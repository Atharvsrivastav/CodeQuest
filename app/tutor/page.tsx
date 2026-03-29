"use client";

import { useEffect, useRef, useState } from "react";

import MessageContent from "@/components/MessageContent";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const starterPrompts = [
  "Help me break down a beginner JavaScript problem without solving it.",
  "What is a practical debugging checklist for coding challenges?",
  "Explain closures in a simple way with a tiny example."
];

const placeholder = "Ask for a hint, debugging help, or a concept explanation...";

export default function TutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = logRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (override?: string) => {
    const content = (override ?? input).trim();

    if (!content || loading) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: nextMessages,
          mode: "coding",
          context:
            "This is the main AI tutor inside CodeQuest. Prefer guided hints, debugging steps, and concept explanations over full solutions."
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to reach the AI tutor.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message ?? "I couldn't generate a response yet."
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong while contacting the AI tutor."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell-tight">
      <div className="chat-shell">
        <section className="card fade-in fade-in-1 stack-md">
          <span className="section-label">AI Tutor</span>
          <div className="stack-sm">
            <h1 className="page-heading" style={{ fontSize: "clamp(1.8rem, 3vw, 2.7rem)" }}>
              Get coding help without leaving the platform
            </h1>
            <p className="page-copy">
              Use the tutor for challenge hints, debugging guidance, or quick concept refreshers
              while keeping the conversation focused on programming.
            </p>
          </div>
        </section>

        <section className="chat-log fade-in fade-in-2" ref={logRef}>
          {!messages.length && (
            <div className="stack-lg">
              <div className="empty-note">
                Start with a prompt below or type your own question. The tutor stays focused on
                coding concepts, debugging, and challenge-solving strategy.
              </div>

              <div className="chip-row">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chip"
                    onClick={() => void sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div className="chat-entry" key={`${message.role}-${index}`}>
              <div
                className={`chat-bubble ${
                  message.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
                }`}
              >
                <MessageContent content={message.content} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-entry">
              <div className="chat-bubble chat-bubble-assistant">
                <div className="inline-cluster">
                  <span className="spin" aria-hidden="true">
                    ...
                  </span>
                  <span className="text-muted">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="chat-composer fade-in fade-in-3">
          <div className="composer-row">
            <textarea
              className="textarea-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={placeholder}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button type="button" className="btn btn-primary" onClick={() => void sendMessage()}>
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
