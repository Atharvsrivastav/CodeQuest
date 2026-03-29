"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import MessageContent from "@/components/MessageContent";
import { diffBadge, getChallengeById } from "@/lib/challenges";
import { recordEvaluation } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RunResult = {
  status: "ok" | "error";
  output: string;
};

type TestResult = {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
};

type EvaluationResult = {
  passed: boolean;
  passedTests: number;
  totalTests: number;
  feedback: string;
  suggestion: string;
  results: TestResult[];
};

type ActivePanel = "output" | "tests";

const tutorStarters = [
  "Help me understand what the challenge is really asking.",
  "Give me a first hint without solving it.",
  "What should I test or debug first?"
];

export default function ChallengeDetailPage() {
  const params = useParams() as { id?: string | string[] };
  const challengeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const challenge = challengeId ? getChallengeById(challengeId) : undefined;
  const progress = useProgress();
  const solved = challenge ? progress.completedIds.includes(challenge.id) : false;

  const [activePanel, setActivePanel] = useState<ActivePanel>("output");
  const [code, setCode] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [testResult, setTestResult] = useState<EvaluationResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<ChatMessage[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);

  useEffect(() => {
    if (!challenge) {
      return;
    }

    setActivePanel("output");
    setCode(challenge.starterCode);
    setShowHint(false);
    setRunResult(null);
    setTestResult(null);
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
            This challenge id does not match any item in the CodeQuest library.
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

  const actionBusy = runLoading || testLoading;

  const runCode = async () => {
    if (actionBusy) {
      return;
    }

    setActivePanel("output");
    setRunLoading(true);
    setRunResult(null);

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          code
        })
      });

      const data = (await response.json()) as Partial<RunResult> & { error?: string };

      if (!response.ok) {
        setRunResult({
          status: "error",
          output:
            typeof data.output === "string"
              ? data.output
              : data.error ?? "Unable to run the code right now."
        });
        return;
      }

      setRunResult({
        status: data.status === "error" ? "error" : "ok",
        output: typeof data.output === "string" ? data.output : "(no output)"
      });
    } catch (error) {
      setRunResult({
        status: "error",
        output: error instanceof Error ? error.message : "Unable to run the code right now."
      });
    } finally {
      setRunLoading(false);
    }
  };

  const runTests = async () => {
    if (actionBusy) {
      return;
    }

    setActivePanel("tests");
    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          code
        })
      });

      const data = (await response.json()) as EvaluationResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to evaluate the code right now.");
      }

      setTestResult(data);
      recordEvaluation(challenge.id, data.passed);
    } catch (error) {
      setTestResult({
        passed: false,
        passedTests: 0,
        totalTests: challenge.testCases.length,
        feedback:
          error instanceof Error ? error.message : "Unable to evaluate the code right now.",
        suggestion: "Review the challenge requirements and try the evaluation again.",
        results: challenge.testCases.map((testCase) => ({
          input: testCase.input,
          expected: testCase.expected,
          actual: "unclear from submission",
          passed: false
        }))
      });
    } finally {
      setTestLoading(false);
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
            challengeId: challenge.id,
            title: challenge.title,
            description: challenge.description,
            language: challenge.language,
            difficulty: challenge.difficulty,
            hint: challenge.hint,
            tags: challenge.tags,
            testCases: challenge.testCases,
            currentCode: code
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
                  <pre
                    key={`${testCase.input}-${index}`}
                    className="card surface-muted"
                    style={{ margin: 0 }}
                  >
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
            </div>

            <div className="card stack-md">
              <div className="stack-sm">
                <span className="section-label">Challenge Tutor</span>
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
                          ...
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
                    setRunResult(null);
                    setTestResult(null);
                    setActivePanel("output");
                  }}
                  disabled={actionBusy}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void runCode()}
                  disabled={actionBusy}
                >
                  {runLoading ? (
                    <>
                      <span className="spin" aria-hidden="true">
                        ...
                      </span>
                      Running Code
                    </>
                  ) : (
                    "Run Code"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void runTests()}
                  disabled={actionBusy}
                >
                  {testLoading ? (
                    <>
                      <span className="spin" aria-hidden="true">
                        ...
                      </span>
                      Running Tests
                    </>
                  ) : (
                    "Run Tests"
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

          <section className="card fade-in fade-in-4 stack-md">
            <div className="toolbar" style={{ justifyContent: "space-between" }}>
              <div className="tabs">
                <button
                  type="button"
                  className={`pill ${activePanel === "output" ? "pill-active" : ""}`}
                  onClick={() => setActivePanel("output")}
                >
                  Output
                </button>
                <button
                  type="button"
                  className={`pill ${activePanel === "tests" ? "pill-active" : ""}`}
                  onClick={() => setActivePanel("tests")}
                >
                  Tests
                </button>
              </div>

              {activePanel === "output" && runResult && (
                <span className={`badge ${runResult.status === "error" ? "badge-red" : "badge-blue"}`}>
                  {runResult.status === "error" ? "Run Error" : "Simulated Output"}
                </span>
              )}

              {activePanel === "tests" && testResult && (
                <span className={`badge ${testResult.passed ? "badge-green" : "badge-red"}`}>
                  {testResult.passedTests}/{testResult.totalTests} passed
                </span>
              )}
            </div>

            {activePanel === "output" ? (
              runLoading ? (
                <div className="empty-note">Running your code and preparing the simulated output...</div>
              ) : runResult ? (
                <pre className="workspace-output">
                  <code>{runResult.output}</code>
                </pre>
              ) : (
                <div className="empty-note">
                  Run your code to see simulated console output for this challenge.
                </div>
              )
            ) : testLoading ? (
              <div className="empty-note">Running the challenge test cases and preparing feedback...</div>
            ) : testResult ? (
              <div className="stack-md">
                <div className={`result-box ${testResult.passed ? "result-pass" : "result-fail"} stack-sm`}>
                  <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
                    <strong>{testResult.passed ? "All tests passed" : "Tests still failing"}</strong>
                    <span className="mono">
                      {testResult.passedTests}/{testResult.totalTests}
                    </span>
                  </div>
                  <p className="page-copy">{testResult.feedback}</p>
                  <p className="page-copy">{testResult.suggestion}</p>
                </div>

                <div className="workspace-test-list">
                  {testResult.results.map((item, index) => (
                    <div
                      className={`result-box ${item.passed ? "result-pass" : "result-fail"} stack-sm`}
                      key={`${item.input}-${index}`}
                    >
                      <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
                        <strong>Test {index + 1}</strong>
                        <span className={`badge ${item.passed ? "badge-green" : "badge-red"}`}>
                          {item.passed ? "Passed" : "Failed"}
                        </span>
                      </div>

                      <div className="workspace-test-grid">
                        <div className="workspace-test-block">
                          <span className="section-label" style={{ marginBottom: "0.5rem" }}>
                            Input
                          </span>
                          <pre className="workspace-snippet">
                            <code>{item.input}</code>
                          </pre>
                        </div>
                        <div className="workspace-test-block">
                          <span className="section-label" style={{ marginBottom: "0.5rem" }}>
                            Expected
                          </span>
                          <pre className="workspace-snippet">
                            <code>{item.expected}</code>
                          </pre>
                        </div>
                        <div className="workspace-test-block">
                          <span className="section-label" style={{ marginBottom: "0.5rem" }}>
                            Actual
                          </span>
                          <pre className="workspace-snippet">
                            <code>{item.actual}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-note">
                Run the tests to see pass or fail status, per-test details, and AI feedback.
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
