import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";

export type ChatMessageRole = "user" | "assistant";
export type ChatMessageStatus = "complete" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;
  status: ChatMessageStatus;
}

type UseChatOptions = {
  endpoint?: string;
  tools?: string[];
  initialMessages?: ChatMessage[];
};

type StreamEvent = {
  event: string;
  data: string;
};

const defaultWelcomeMessage: ChatMessage = {
  id: "nick-welcome",
  role: "assistant",
  content: "Hello! I'm Nick, your AI assistant. How can I help you today?",
  createdAt: new Date(),
  status: "complete",
};

const buildChatUrl = (url: string) => {
  const baseUrl = (config.apiBase || "").replace(/\/$/, "");
  return /^https?:\/\//i.test(url)
    ? url
    : `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

const createMessage = (
  role: ChatMessageRole,
  content: string,
  status: ChatMessageStatus = "complete"
): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
  createdAt: new Date(),
  status,
});

const parseEventChunk = (chunk: string): StreamEvent | null => {
  if (!chunk.trim()) {
    return null;
  }

  let event = "message";
  const dataLines: string[] = [];

  for (const line of chunk.split("\n")) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  return {
    event,
    data: dataLines.join("\n"),
  };
};

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
};

export const useChat = ({
  endpoint = "/chat",
  tools = ["get_leads", "get_trades"],
  initialMessages = [defaultWelcomeMessage],
}: UseChatOptions = {}) => {
  // Message history lives in hook state so the UI can render a full conversation and resend
  // the entire transcript to the backend on each prompt.
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  // `isStreaming` drives the disabled input state and typing indicator while tokens arrive.
  const [isStreaming, setIsStreaming] = useState(false);
  // A short status line lets the UI explain whether we are connecting, streaming, or using a tool.
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  // Transport/provider errors are surfaced separately from the assistant transcript.
  const [error, setError] = useState<string | null>(null);
  // Keep a handle to the current request so it can be aborted on unmount.
  const activeRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
    };
  }, []);

  const sendMessage = async (rawInput: string) => {
    const content = rawInput.trim();
    if (!content || isStreaming) {
      return;
    }

    const userMessage = createMessage("user", content);
    const assistantMessage = createMessage("assistant", "", "streaming");
    const requestMessages = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setError(null);
    setIsStreaming(true);
    setStreamStatus("Connecting to Nick AI...");
    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ]);

    const abortController = new AbortController();
    activeRequestRef.current = abortController;

    // The chat endpoint returns server-sent events. We read the raw `ReadableStream`, split
    // the stream into SSE event chunks, and apply each `token` delta onto the in-progress
    // assistant message so the UI updates one fragment at a time.
    try {
      const response = await fetch(buildChatUrl(endpoint), {
        method: "POST",
        signal: abortController.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          messages: requestMessages,
          tools,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          details
            ? `Chat request failed (${response.status}): ${details}`
            : `Chat request failed (${response.status} ${response.statusText})`
        );
      }

      if (!response.body) {
        throw new Error("Chat response did not include a readable stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const applyToken = (delta: string) => {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content: `${message.content}${delta}`,
                  status: "streaming",
                }
              : message
          )
        );
      };

      const finalizeAssistantMessage = (status: ChatMessageStatus) => {
        setMessages((currentMessages) =>
          currentMessages.map((message) => {
            if (message.id !== assistantMessage.id) {
              return message;
            }

            if (message.content.trim()) {
              return {
                ...message,
                status,
              };
            }

            return {
              ...message,
              content:
                status === "error"
                  ? "Sorry, I couldn't finish that response."
                  : "No response was returned.",
              status,
            };
          })
        );
      };

      const handleStreamEvent = (streamEvent: StreamEvent) => {
        const payload = safeJsonParse(streamEvent.data);

        if (streamEvent.event === "meta") {
          setStreamStatus("Nick is preparing a response...");
          return;
        }

        if (streamEvent.event === "tool_call") {
          setStreamStatus("Nick is checking internal data...");
          return;
        }

        if (streamEvent.event === "tool_result") {
          setStreamStatus("Nick is summarizing the results...");
          return;
        }

        if (streamEvent.event === "token") {
          const delta =
            payload &&
            typeof payload === "object" &&
            "delta" in payload &&
            typeof payload.delta === "string"
              ? payload.delta
              : "";

          if (!delta) {
            return;
          }

          setStreamStatus("Nick is responding...");
          applyToken(delta);
          return;
        }

        if (streamEvent.event === "error") {
          const message =
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : "The chat stream returned an error.";

          throw new Error(message);
        }

        if (streamEvent.event === "done") {
          setStreamStatus(null);
          finalizeAssistantMessage("complete");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        let boundaryIndex = buffer.indexOf("\n\n");
        while (boundaryIndex !== -1) {
          const rawChunk = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);
          boundaryIndex = buffer.indexOf("\n\n");

          const streamEvent = parseEventChunk(rawChunk);
          if (streamEvent) {
            handleStreamEvent(streamEvent);
          }
        }

        if (done) {
          break;
        }
      }

      const trailingEvent = parseEventChunk(buffer);
      if (trailingEvent) {
        handleStreamEvent(trailingEvent);
      }

      setStreamStatus(null);
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessage.id && message.status === "streaming"
            ? { ...message, status: "complete" }
            : message
        )
      );
    } catch (caughtError) {
      if (abortController.signal.aborted) {
        return;
      }

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while streaming the response.";

      setError(message);
      setStreamStatus(null);
      setMessages((currentMessages) =>
        currentMessages.map((chatMessage) =>
          chatMessage.id === assistantMessage.id
            ? {
                ...chatMessage,
                content: chatMessage.content.trim()
                  ? chatMessage.content
                  : "Sorry, I couldn't finish that response.",
                status: "error",
              }
            : chatMessage
        )
      );
    } finally {
      if (activeRequestRef.current === abortController) {
        activeRequestRef.current = null;
      }
      setIsStreaming(false);
    }
  };

  return {
    messages,
    isStreaming,
    streamStatus,
    error,
    sendMessage,
  };
};
