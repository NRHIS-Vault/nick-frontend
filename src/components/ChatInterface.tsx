import React, { useEffect, useRef, useState } from "react";
import { Send, Mic, Volume2, Languages } from "lucide-react";
import { useChat } from "@/hooks/useChat";

const ChatInterface: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  // The chat hook owns the conversation transcript and streaming lifecycle.
  const { messages, isStreaming, streamStatus, error, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep the newest token visible as the assistant message grows.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, streamStatus]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedInput = inputText.trim();
    if (!trimmedInput || isStreaming) {
      return;
    }

    setInputText("");
    await sendMessage(trimmedInput);
  };

  const toggleListening = () => {
    setIsListening((currentValue) => !currentValue);
  };

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {/* Header stays fixed while the transcript area scrolls underneath it. */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-bold text-primary-foreground">N</span>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Nick AI</h3>
            <p className="text-xs text-muted-foreground">
              {streamStatus || (isStreaming ? "Streaming reply..." : "Ready to help")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isStreaming}
            className="p-2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Volume2 size={16} />
          </button>
          <button
            type="button"
            disabled={isStreaming}
            className="p-2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Languages size={16} />
          </button>
        </div>
      </div>

      {/* Message bubbles use separate alignment and color treatments for user vs assistant. */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-background/40 px-4 py-4">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm lg:max-w-xl ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/60 bg-surface-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] opacity-70">
                  <span>{isUser ? "You" : "Nick"}</span>
                  <span>
                    {message.createdAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {message.role === "assistant" && message.status === "streaming" && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <span>Streaming response</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* A separate loading row makes the streaming state visible even before the first token arrives. */}
        {isStreaming &&
          !messages.some(
            (message) =>
              message.role === "assistant" &&
              message.status === "streaming" &&
              message.content.trim()
          ) && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border/60 bg-surface-muted px-4 py-3 text-foreground shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span>{streamStatus || "Nick is thinking..."}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* The form submits to the streaming hook and stays disabled while a response is in flight. */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleListening}
            disabled={isStreaming}
            className={`rounded-full p-2 transition-colors ${
              isListening
                ? "bg-destructive text-destructive-foreground"
                : "border border-border bg-surface-muted text-muted-foreground hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Mic size={16} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder={isStreaming ? "Waiting for Nick..." : "Type your message..."}
            disabled={isStreaming}
            className="flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-foreground focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            className="rounded-full bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
