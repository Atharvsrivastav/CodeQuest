"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import MessageContent from "@/components/MessageContent";
import {
  diffBadge,
  getChallengeById,
  markComplete
} from "@/lib/data";
import { useLearnlyProgress } from "@/lib/useProgress";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type EvaluationResult = {
  passed: boolean;
  passedTests: number;
  totalTests: number;
  feedback: string;
  suggestion: string;
};

const tutorStarters = [
  "Help me understand what the challenge is really asking.",
  "Give me a first hint without solving it.",
  "What should I test or debug first?"
];

export default function ChallengeDetailPage() {
  const params = useParams() as { id?: string | string[] };
  const challengeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const challenge = challengeId ? getChallengeById(challengeId) : undefined;
  const progress = useLearnlyProgress();
  const solved = challenge ? progress.completedIds.includes(challenge.id) : false;

  const [code, setCode] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<ChatMessage[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);

  useEffect(() => {
    if (!challenge) {
      return;
    }

    setCode(challenge.starterCode);
    setShowHint(false);
    setResult(null);
    setTutorMessages([]);
    setTutorInput("");
    setTutorLoading(false);
  }, [challenge]);

  if (!challenge) {
    return (
      <div className="page-shell-tight">
        <div className="card stack-md">
          <span className="section-label">Challenge</span>
          <h1 style={{ margin: 0, letterSpacing: "-0.03em" }}>Challenge not found</h1>
          <p className="page-copy">
            This challenge id does not match any item in the Learnly library.
          </p>
          <div>
            <Link href="/challenges" className="btn btn-primary">
              Back to Challenges
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const runEvaluation = async () => {
    if (running) {
      return;
    }

    setRunning(true);
    setResult(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          challenge
        })
      });

      const data = (await response.json()) as EvaluationResult & { error?: string };

      if (!response.ok && data.error) {
        throw new Error(data.error);
      }

      setResult(data);

      if (data.passed) {
        markComplete(challenge.id, challenge.xp);
      }
    } catch (error) {
      setResult({
        passed: false,
        passedTests: 0,
        totalTests: challenge.testCases.length,
        feedback:
          error instanceof Error ? error.message : "Unable to evaluate the code right now.",
        suggestion: "Review the challenge requirements and try the evaluation again."
      });
    } finally {
      setRunning(false);
    }
  };

  const sendTutorMessage = async (override?: string) => {
    const content = (override ?? tutorInput).trim();

    if (!content || tutorLoading) {
      return;
    }

    const nextMessages: ChatMessage[] = [...tutorMessages, { role: "user", content }];
    setTutorMessages(nextMessages);
    setTutorInput("");
    setTutorLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "coding",
          context: {
            title: challenge.title,
            description: challenge.description,
            language: challenge.language,
            difficulty: challenge.difficulty,
            hint: challenge.hint,
            tags: challenge.tags,
            testCases: challenge.testCases
          },
          messages: nextMessages
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to reach the coding tutor.");
      }

      setTutorMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message ?? "I couldn't generate a hint yet."
        }
      ]);
    } catch (error) {
      setTutorMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong while contacting the tutor."
        }
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  return (
    <div className="page-shell-wide">
      <section className="editor-shell">
        <aside className="editor-sidebar fade-in fade-in-1">
          <div className="sticky-sidebar stack-md">
            <div className="card stack-md">
              <div className="stack-sm">
                <span className="section-label">Challenge Brief</span>
                <p className="page-copy">{challenge.description}</p>
              </div>

              <div className="stack-sm">
                <span className="section-label">Test Cases</span>
                {challenge.testCases.map((testCase, index) => (
                  <pre key={`${testCase.input}-${index}`} className="card surface-muted" style={{ margin: 0 }}>
                    <code>
                      Input: {testCase.input}
                      {"\n"}Expected: {testCase.expected}
                    </code>
                  </pre>
                ))}
              </div>

              <div className="stack-sm">
                <span className="section-label">Tags</span>
                <div className="chip-row">
                  {challenge.tags.map((tag) => (
                    <span className="chip" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="stack-sm">
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "var(--accent-warn-light)",
                    borderColor: "color-mix(in srgb, var(--accent-warn) 18%, var(--border))",
                    color: "var(--accent-warn)"
                  }}
                  onClick={() => setShowHint((current) => !current)}
                >
                  {showHint ? "Hide Hint" : "Show Hint"}
                </button>

                {showHint && <div className="hint-box">{challenge.hint}</div>}
              </div>

              {result && (
                <div className={`result-box ${result.passed ? "result-pass" : "result-fail"} stack-sm`}>
                  <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
                    <strong>{result.passed ? "Passed" : "Keep going"}</strong>
                    <span className="mono">
                      {result.passedTests}/{result.totalTests}
                    </span>
                  </div>
                  <p className="page-copy">{result.feedback}</p>
                  <p className="page-copy">{result.suggestion}</p>
                </div>
              )}
            </div>

            <div className="card stack-md">
              <div className="stack-sm">
                <span className="section-label">Mini AI Tutor</span>
                <p className="page-copy">
                  Ask for hints, debugging help, or a walkthrough of the prompt. Full solutions stay
                  off limits.
                </p>
              </div>

              <div className="overflow-panel" style={{ maxHeight: "280px", padding: "16px" }}>
                {!tutorMessages.length ? (
                  <div className="stack-md">
                    <div className="empty-note">
                      Start with a quick prompt to get a challenge-specific hint.
                    </div>
                    <div className="chip-row">
                      {tutorStarters.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          className="chip"
                          onClick={() => void sendTutorMessage(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  tutorMessages.map((message, index) => (
                    <div className="chat-entry" key={`${message.role}-${index}`}>
                      <div
                        className={`chat-bubble ${
                          message.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
                        }`}
                      >
                        <MessageContent content={message.content} />
                      </div>
                    </div>
                  ))
                )}

                {tutorLoading && (
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
              </div>

              <div className="stack-sm">
                <textarea
                  className="textarea-input"
                  value={tutorInput}
                  onChange={(event) => setTutorInput(event.target.value)}
                  placeholder="Ask for a nudge, debugging step, or concept hint..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendTutorMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void sendTutorMessage()}
                >
                  Ask Tutor
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="editor-main">
          <div className="card fade-in fade-in-2 stack-md">
            <div className="inline-cluster text-muted">
              <Link href="/challenges">Challenges</Link>
              <span>/</span>
              <span>{challenge.title}</span>
            </div>

            <div className="toolbar" style={{ justifyContent: "space-between" }}>
              <div className="stack-sm">
                <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.04em" }}>
                  {challenge.title}
                </h1>
                <div className="row-meta">
                  <span className={`badge ${diffBadge[challenge.difficulty]}`}>
                    {challenge.difficulty}
                  </span>
                  <span className="badge badge-gray mono">{challenge.language.toUpperCase()}</span>
                  <span className="badge badge-blue">{challenge.xp} XP</span>
                  {solved && <span className="badge badge-green">Solved</span>}
                </div>
              </div>

              <div className="toolbar">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setCode(challenge.starterCode);
                    setResult(null);
                  }}
                >
                  Reset
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void runEvaluation()}>
                  {running ? (
                    <>
                      <span className="spin" aria-hidden="true">
                        ↻
                      </span>
                      Running
                    </>
                  ) : (
                    "Run"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="editor-surface fade-in fade-in-3">
            <MonacoEditor
              height="calc(100vh - 255px)"
              language={challenge.language === "js" ? "javascript" : "python"}
              value={code}
              onChange={(value: string | undefined) => setCode(value ?? "")}
              theme="vs"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "var(--font-geist-mono)",
                roundedSelection: false,
                automaticLayout: true,
                scrollBeyondLastLine: false
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
