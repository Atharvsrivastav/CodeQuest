"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type EditorLanguage = "javascript" | "typescript" | "python";

const starterCode: Record<EditorLanguage, string> = {
  javascript:
    'const name = "Learnly";\nconst days = 7;\n\nconsole.log(`Practicing with ${name} for ${days} days.`);',
  typescript:
    'type Session = {\n  topic: string;\n  minutes: number;\n};\n\nconst session: Session = { topic: "TypeScript", minutes: 25 };\nconsole.log(`${session.topic}: ${session.minutes} minutes`);',
  python:
    'language = "Python"\nminutes = 30\n\nprint(f"Practicing {language} for {minutes} minutes")'
};

export default function CodePage() {
  const [language, setLanguage] = useState<EditorLanguage>("javascript");
  const [code, setCode] = useState(starterCode.javascript);
  const [output, setOutput] = useState("Run your code to see Gemini simulate the console output.");
  const [loading, setLoading] = useState(false);

  const languageLabel = useMemo(() => {
    if (language === "javascript") {
      return "JavaScript";
    }

    if (language === "typescript") {
      return "TypeScript";
    }

    return "Python";
  }, [language]);

  useEffect(() => {
    setCode(starterCode[language]);
    setOutput("Run your code to see Gemini simulate the console output.");
  }, [language]);

  const runCode = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "general",
          context:
            "The user is working in Learnly's free editor. Simulate console output only. Return raw output with no explanations. If nothing is printed, respond with (no output).",
          messages: [
            {
              role: "user",
              content: `Simulate the console output for this ${languageLabel} code.\n\n${code}`
            }
          ]
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to simulate the output.");
      }

      setOutput(data.message ?? "(no output)");
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Unable to simulate the output.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setOutput("Code copied to clipboard.");
    } catch {
      setOutput("Clipboard access is not available in this browser.");
    }
  };

  return (
    <div className="page-shell-wide stack-lg">
      <section className="card fade-in fade-in-1 stack-md">
        <span className="section-label">Free Editor</span>
        <h1 className="page-heading" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}>
          Experiment with code in a clean workspace
        </h1>
        <p className="page-copy">
          Write code, switch languages, and ask Gemini to simulate the console output with no extra
          explanation.
        </p>
      </section>

      <section className="code-layout fade-in fade-in-2">
        <div className="editor-main">
          <div className="card stack-md">
            <div className="toolbar" style={{ justifyContent: "space-between" }}>
              <div className="pill-row">
                {(["javascript", "typescript", "python"] as EditorLanguage[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`pill ${language === option ? "pill-active" : ""}`}
                    onClick={() => setLanguage(option)}
                  >
                    {option === "javascript"
                      ? "JavaScript"
                      : option === "typescript"
                        ? "TypeScript"
                        : "Python"}
                  </button>
                ))}
              </div>

              <div className="toolbar">
                <button type="button" className="btn btn-ghost" onClick={() => void copyCode()}>
                  Copy
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setCode(starterCode[language]);
                    setOutput("Editor reset.");
                  }}
                >
                  Reset
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void runCode()}>
                  {loading ? (
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

          <div className="editor-surface">
            <MonacoEditor
              height="calc(100vh - 300px)"
              language={language}
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

        <aside className="output-panel stack-md">
          <div className="stack-sm">
            <span className="section-label">Output</span>
            <h2 style={{ margin: 0, letterSpacing: "-0.03em" }}>Simulated console</h2>
          </div>
          <pre
            className="card surface-muted"
            style={{ margin: 0, flex: 1, minHeight: "100%", whiteSpace: "pre-wrap" }}
          >
            <code>{output}</code>
          </pre>
        </aside>
      </section>
    </div>
  );
}
