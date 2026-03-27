import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { useAuth } from "@/hooks/use-auth";

export type ChatMessageRole = "user" | "assistant";
export type ChatMessageStatus = "complete" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;
  status: ChatMessageStatus;
}

export interface ChatConversation {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
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

const mapPersistedMessage = (message: Record<string, unknown>): ChatMessage | null => {
  if (
    typeof message.id !== "string" ||
    (message.role !== "user" && message.role !== "assistant") ||
    typeof message.content !== "string" ||
    typeof message.created_at !== "string"
  ) {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: new Date(message.created_at),
    status: "complete",
  };
};

const mapPersistedConversation = (
  conversation: Record<string, unknown>
): ChatConversation | null => {
  if (
    typeof conversation.id !== "string" ||
    typeof conversation.created_at !== "string" ||
    typeof conversation.updated_at !== "string" ||
    !Array.isArray(conversation.messages)
  ) {
    return null;
  }

  const messages = conversation.messages
    .map((message) =>
      message && typeof message === "object"
        ? mapPersistedMessage(message as Record<string, unknown>)
        : null
    )
    .filter((message): message is ChatMessage => message !== null);

  return {
    id: conversation.id,
    title: typeof conversation.title === "string" ? conversation.title : null,
    createdAt: new Date(conversation.created_at),
    updatedAt: new Date(conversation.updated_at),
    messages,
  };
};

export const useChat = ({
  endpoint = "/chat",
  tools = ["searchLeads", "fetchTrades"],
  initialMessages = [defaultWelcomeMessage],
}: UseChatOptions = {}) => {
  const { isConfigured, session, user } = useAuth();
  // Message history lives in hook state so the UI can render a full conversation and resend
  // the entire transcript to the backend on each prompt.
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  // The active conversation id is reused on each send so later messages append to the same
  // persisted transcript instead of creating a brand-new conversation each time.
  const [conversationId, setConversationId] = useState<string | null>(null);
  // The worker returns grouped history by conversation; we keep it here for future chat-session UI.
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  // `isStreaming` drives the disabled input state and typing indicator while tokens arrive.
  const [isStreaming, setIsStreaming] = useState(false);
  // `isHydratingHistory` tells the UI that we are fetching persisted chat history on mount.
  const [isHydratingHistory, setIsHydratingHistory] = useState(false);
  // A short status line lets the UI explain whether we are connecting, streaming, or using a tool.
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  // Transport/provider errors are surfaced separately from the assistant transcript.
  const [error, setError] = useState<string | null>(null);
  // Keep a handle to the current request so it can be aborted on unmount.
  const activeRequestRef = useRef<AbortController | null>(null);
  const hydratedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isConfigured || !session?.access_token || !user?.id || user.id === "local-dev-user") {
      return;
    }

    if (hydratedUserIdRef.current === user.id) {
      return;
    }

    hydratedUserIdRef.current = user.id;
    let isCancelled = false;

    const hydrateChatHistory = async () => {
      setIsHydratingHistory(true);

      try {
        // History is fetched with the user's Supabase access token so the backend can
        // scope the result set to that authenticated user before returning any messages.
        const response = await fetch(buildChatUrl("/chat-history"), {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const details = await response.text();
          throw new Error(
            details
              ? `Chat history request failed (${response.status}): ${details}`
              : `Chat history request failed (${response.status} ${response.statusText})`
          );
        }

        const payload = (await response.json()) as {
          conversations?: Array<Record<string, unknown>>;
        };

        if (isCancelled) {
          return;
        }

        const nextConversations = Array.isArray(payload.conversations)
          ? payload.conversations
              .map((conversation) => mapPersistedConversation(conversation))
              .filter(
                (conversation): conversation is ChatConversation => conversation !== null
              )
          : [];

        setConversations(nextConversations);

        if (nextConversations[0]) {
          // The latest conversation becomes the active transcript so the next `sendMessage`
          // call continues that persisted session instead of forking a new one immediately.
          setConversationId(nextConversations[0].id);
          setMessages(
            nextConversations[0].messages.length
              ? nextConversations[0].messages
              : initialMessages
          );
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load chat history."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsHydratingHistory(false);
        }
      }
    };

    // Hydrate the most recent persisted conversation as soon as the authenticated session exists.
    void hydrateChatHistory();

    return () => {
      isCancelled = true;
    };
  }, [initialMessages, isConfigured, session?.access_token, user?.id]);

  const sendMessage = async (rawInput: string) => {
    const content = rawInput.trim();
    if (!content || isStreaming || isHydratingHistory) {
      return;
    }

    const userMessage = createMessage("user", content);
    const assistantMessage = createMessage("assistant", "", "streaming");
    const nextConversationId = conversationId || crypto.randomUUID();
    const requestMessages = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setError(null);
    setIsStreaming(true);
    setStreamStatus("Connecting to Nick AI...");
    setConversationId(nextConversationId);
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
          ...(isConfigured && session?.access_token && user?.id !== "local-dev-user"
            ? {
                Authorization: `Bearer ${session.access_token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          messages: requestMessages,
          tools,
          conversationId: nextConversationId,
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
          const nextConversationId =
            payload &&
            typeof payload === "object" &&
            "conversationId" in payload &&
            typeof payload.conversationId === "string"
              ? payload.conversationId
              : null;

          if (nextConversationId) {
            setConversationId(nextConversationId);
          }

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
    conversations,
    conversationId,
    isStreaming,
    isHydratingHistory,
    streamStatus,
    error,
    sendMessage,
  };
};
