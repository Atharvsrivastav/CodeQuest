"use client";

import { useEffect, useRef, useState } from "react";

import MessageContent from "@/components/MessageContent";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type LearningPath = "coding" | "spoken";

const LEARNING_PATH_OPTIONS = [
  {
    id: "coding" as const,
    badge: "Coding",
    title: "Learn coding",
    description:
      "Choose a programming language and let the AI tutor explain concepts, syntax, examples, and beginner practice."
  },
  {
    id: "spoken" as const,
    badge: "Spoken language",
    title: "Learn spoken language",
    description:
      "Choose a human language and learn greetings, pronunciation, grammar basics, and simple conversation practice."
  }
];

const CODING_LANGUAGES = ["JavaScript", "Python", "TypeScript", "Java", "C++", "SQL"] as const;
const SPOKEN_LANGUAGES = ["English", "Hindi", "German", "Spanish", "French"] as const;

function getLanguageOptions(path: LearningPath) {
  return path === "coding" ? [...CODING_LANGUAGES] : [...SPOKEN_LANGUAGES];
}

function buildIntroPrompt(path: LearningPath, language: string) {
  if (path === "coding") {
    return `I want to start learning ${language}. Please teach me like a beginner. Explain what ${language} is used for, the most important first concepts, one tiny example, and give me one short practice task.`;
  }

  return `I want to start learning ${language}. Please teach me like a beginner. Start with simple greetings, pronunciation help in plain text, a few useful beginner phrases, and one tiny speaking practice task.`;
}

function buildStarterPrompts(path: LearningPath, language: string) {
  if (path === "coding") {
    return [
      `Teach me the basic syntax of ${language}.`,
      `What should a beginner learn first in ${language}?`,
      `Give me a tiny ${language} practice exercise with hints.`
    ];
  }

  return [
    `Teach me common greetings in ${language}.`,
    `Give me 5 beginner phrases in ${language} with pronunciation help.`,
    `Start a very simple ${language} conversation and quiz me.`
  ];
}

function buildContext(path: LearningPath, language: string) {
  if (path === "coding") {
    return {
      product: "CodeQuest AI Tutor",
      learningPath: "coding",
      selectedLanguage: language,
      teachingGoal:
        "Teach the selected programming language in a beginner-friendly way with simple explanations, tiny examples, and short guided practice."
    };
  }

  return {
    product: "CodeQuest AI Tutor",
    learningPath: "spoken-language",
    selectedLanguage: language,
    teachingGoal:
      "Teach the selected spoken language in a beginner-friendly way with simple explanations, pronunciation tips, short dialogues, and small practice tasks."
  };
}

function buildPlaceholder(path: LearningPath | null, language: string | null) {
  if (!path) {
    return "Choose Coding or Spoken Language to begin...";
  }

  if (!language) {
    return path === "coding"
      ? "Choose a programming language first..."
      : "Choose a spoken language first...";
  }

  return path === "coding"
    ? `Ask about ${language} syntax, concepts, examples, or beginner practice...`
    : `Ask about ${language} vocabulary, speaking, grammar, or pronunciation...`;
}

export default function TutorPage() {
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const pathParam = new URLSearchParams(window.location.search).get("path");

    if (pathParam === "coding" || pathParam === "spoken") {
      setSelectedPath(pathParam);
      setSelectedLanguage(null);
      setMessages([]);
      setInput("");
      return;
    }

    setSelectedPath(null);
    setSelectedLanguage(null);
    setMessages([]);
    setInput("");
  }, []);

  useEffect(() => {
    const container = logRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages, loading]);

  const availableLanguages = selectedPath ? getLanguageOptions(selectedPath) : [];
  const starterPrompts =
    selectedPath && selectedLanguage ? buildStarterPrompts(selectedPath, selectedLanguage) : [];
  const placeholder = buildPlaceholder(selectedPath, selectedLanguage);
  const canSend = Boolean(selectedPath && selectedLanguage && input.trim()) && !loading;

  async function requestTutorReply(
    nextMessages: ChatMessage[],
    path: LearningPath,
    language: string
  ) {
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: nextMessages,
          mode: path === "coding" ? "coding" : "spoken",
          context: buildContext(path, language)
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
  }

  async function sendMessage(override?: string) {
    if (!selectedPath || !selectedLanguage || loading) {
      return;
    }

    const content = (override ?? input).trim();

    if (!content) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];

    setMessages(nextMessages);
    setInput("");
    await requestTutorReply(nextMessages, selectedPath, selectedLanguage);
  }

  function handlePathSelect(path: LearningPath) {
    if (loading || path === selectedPath) {
      return;
    }

    setSelectedPath(path);
    setSelectedLanguage(null);
    setMessages([]);
    setInput("");
  }

  async function handleLanguageSelect(language: string) {
    if (!selectedPath || loading) {
      return;
    }

    if (language === selectedLanguage && messages.length > 0) {
      return;
    }

    setSelectedLanguage(language);
    setInput("");

    const introPrompt = buildIntroPrompt(selectedPath, language);
    const nextMessages: ChatMessage[] = [{ role: "user", content: introPrompt }];

    setMessages(nextMessages);
    await requestTutorReply(nextMessages, selectedPath, language);
  }

  function resetTutor() {
    if (loading) {
      return;
    }

    setSelectedPath(null);
    setSelectedLanguage(null);
    setMessages([]);
    setInput("");
  }

  function clearCurrentLanguage() {
    if (loading) {
      return;
    }

    setSelectedLanguage(null);
    setMessages([]);
    setInput("");
  }

  return (
    <div className="page-shell">
      <div className="chat-shell">
        <section className="card fade-in fade-in-1 stack-md">
          <span className="section-label">AI Tutor</span>
          <div className="stack-sm">
            <h1 className="page-heading" style={{ fontSize: "clamp(2rem, 3vw, 3rem)" }}>
              Choose what you want to learn first
            </h1>
            <p className="page-copy">
              Start with one simple choice: learn coding or learn a spoken language. After that,
              pick the language you want, and the AI tutor will start teaching it in a beginner-friendly way.
            </p>
          </div>

          <div className="split-grid">
            {LEARNING_PATH_OPTIONS.map((option) => {
              const active = selectedPath === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handlePathSelect(option.id)}
                  aria-pressed={active}
                  className="rounded-[24px] border p-5 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  disabled={loading}
                  style={{
                    borderColor: active
                      ? "color-mix(in srgb, var(--accent) 28%, var(--border))"
                      : "var(--border)",
                    background: active
                      ? "color-mix(in srgb, var(--accent-light) 78%, var(--surface))"
                      : "color-mix(in srgb, var(--surface) 92%, transparent)",
                    boxShadow: "var(--surface-shadow)"
                  }}
                >
                  <span className="section-label" style={{ marginBottom: "0.65rem" }}>
                    {option.badge}
                  </span>
                  <h2 style={{ margin: 0, fontSize: "1.45rem", letterSpacing: "-0.03em" }}>
                    {option.title}
                  </h2>
                  <p className="page-copy" style={{ marginTop: "0.85rem" }}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="divider" />

          <div className="stack-sm">
            <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
              <div className="stack-sm" style={{ flex: 1, minWidth: 0 }}>
                <span className="section-label" style={{ marginBottom: 0 }}>
                  {!selectedPath
                    ? "Learning Setup"
                    : selectedPath === "coding"
                      ? "Programming Languages"
                      : "Spoken Languages"}
                </span>
                <h2 style={{ margin: 0, fontSize: "1.35rem", letterSpacing: "-0.03em" }}>
                  {selectedPath
                    ? `Select the ${selectedPath === "coding" ? "language" : "spoken language"} you want to study`
                    : "Select a learning path to unlock the language list"}
                </h2>
              </div>

              {(selectedPath || selectedLanguage) && (
                <div className="conversation-actions">
                  {selectedLanguage && (
                    <button type="button" className="btn btn-ghost" onClick={clearCurrentLanguage} disabled={loading}>
                      Change language
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost" onClick={resetTutor} disabled={loading}>
                    Start over
                  </button>
                </div>
              )}
            </div>

            {!selectedPath ? (
              <div className="empty-note">
                Pick <strong>Coding</strong> or <strong>Spoken Language</strong> above. Then the tutor will show the right list of languages for you.
              </div>
            ) : (
              <>
                <div className="pill-row">
                  {availableLanguages.map((language) => (
                    <button
                      key={language}
                      type="button"
                      className={`pill ${selectedLanguage === language ? "pill-active" : ""}`}
                      onClick={() => void handleLanguageSelect(language)}
                      disabled={loading}
                    >
                      {language}
                    </button>
                  ))}
                </div>

                <div className="empty-note">
                  {selectedLanguage
                    ? `The tutor is now focused on ${selectedLanguage}. Ask anything you want, or use one of the quick prompts below.`
                    : selectedPath === "coding"
                      ? "Choose a programming language and the AI tutor will immediately start teaching it."
                      : "Choose a spoken language and the AI tutor will immediately start teaching it."}
                </div>

                {selectedLanguage && (
                  <div className="chip-row">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="chip"
                        onClick={() => void sendMessage(prompt)}
                        disabled={loading}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="chat-log fade-in fade-in-2" ref={logRef}>
          {!selectedPath ? (
            <div className="empty-note">
              Your tutor chat will appear here after you choose whether you want to learn coding or a spoken language.
            </div>
          ) : !selectedLanguage ? (
            <div className="empty-note">
              Choose a language above. As soon as you click one, the AI tutor will begin teaching it.
            </div>
          ) : (
            <>
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
                      <span className="text-muted">
                        {selectedPath === "coding" ? "Preparing your lesson..." : "Preparing your language lesson..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="chat-composer fade-in fade-in-3">
          <div className="composer-row">
            <textarea
              className="textarea-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={placeholder}
              disabled={!selectedLanguage || loading}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void sendMessage()}
              disabled={!canSend}
            >
              Ask Tutor
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
