"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import MessageContent from "@/components/MessageContent";
import type { AiMode } from "@/lib/gemini";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const modeLabels: Array<{ value: AiMode; label: string }> = [
  { value: "general", label: "General" },
  { value: "coding", label: "Coding" },
  { value: "language", label: "Languages" }
];

const starterPrompts: Record<AiMode, string[]> = {
  general: [
    "Give me a 20-minute study plan for coding and language practice today.",
    "How can I balance learning JavaScript and Spanish in the same week?",
    "Quiz me with one coding question and one language question."
  ],
  coding: [
    "Help me break down a beginner JavaScript problem without giving the full answer.",
    "What is a good debugging checklist for coding challenges?",
    "Explain closures in a simple way with a tiny example."
  ],
  language: [
    "Teach me a short Spanish travel phrase with pronunciation help.",
    "Quiz me on beginner French greetings.",
    "How should I practice Japanese hiragana for 10 minutes?"
  ]
};

const placeholders: Record<AiMode, string> = {
  general: "Ask about learning strategy, mixed practice, or study planning...",
  coding: "Ask for a hint, debugging help, or a concept explanation...",
  language: "Ask for vocabulary help, translations, examples, or practice..."
};

export default function LearnPage() {
  const [mode, setMode] = useState<AiMode>("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  const starters = useMemo(() => starterPrompts[mode], [mode]);

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
          mode
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

  const resetMode = (nextMode: AiMode) => {
    setMode(nextMode);
    setMessages([]);
    setInput("");
    setLoading(false);
  };

  return (
    <div className="page-shell-tight">
      <div className="chat-shell">
        <section className="card fade-in fade-in-1 stack-md">
          <span className="section-label">AI Tutor</span>
          <div className="stack-sm">
            <h1 className="page-heading" style={{ fontSize: "clamp(1.8rem, 3vw, 2.7rem)" }}>
              Learn with Gemini across code and languages
            </h1>
            <p className="page-copy">
              Switch modes any time. Changing modes clears the conversation so each tutoring session
              stays focused.
            </p>
          </div>
          <div className="tabs">
            {modeLabels.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`pill ${mode === item.value ? "pill-active" : ""}`}
                onClick={() => resetMode(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="chat-log fade-in fade-in-2" ref={logRef}>
          {!messages.length && (
            <div className="stack-lg">
              <div className="empty-note">
                Start with a prompt below or type your own question. The tutor will adapt to the{" "}
                {mode === "language" ? "language" : mode} mode you selected.
              </div>

              <div className="chip-row">
                {starters.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chip"
                    onClick={() => sendMessage(prompt)}
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
                    ↻
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
              placeholder={placeholders[mode]}
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
