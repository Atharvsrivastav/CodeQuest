"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import ProgressBar from "@/components/ProgressBar";
import {
  diffBadge,
  getLanguageLessonById,
  markComplete,
  normalizeText
} from "@/lib/data";
import { useLearnlyProgress } from "@/lib/useProgress";

export default function LanguageLessonDetailPage() {
  const params = useParams() as { id?: string | string[] };
  const lessonId = Array.isArray(params.id) ? params.id[0] : params.id;
  const lesson = lessonId ? getLanguageLessonById(lessonId) : undefined;
  const progress = useLearnlyProgress();
  const alreadyCompleted = lesson ? progress.completedIds.includes(lesson.id) : false;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setAnswer("");
    setChecked(false);
    setIsCorrect(null);
    setShowHint(false);
    setFeedback("");
    setLoadingFeedback(false);
    setCompleted(false);
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="page-shell-tight">
        <div className="card stack-md">
          <span className="section-label">Lesson</span>
          <h1 style={{ margin: 0, letterSpacing: "-0.03em" }}>Lesson not found</h1>
          <p className="page-copy">
            This lesson id does not match any item in the Learnly library.
          </p>
          <div>
            <Link href="/languages" className="btn btn-primary">
              Back to Lessons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalExercises = lesson.exercises.length;
  const exercise = lesson.exercises[currentIndex];

  const acceptedAnswers = useMemo(() => {
    return [exercise.answer, ...(exercise.alt ?? [])].map(normalizeText);
  }, [exercise]);

  const checkAnswer = async () => {
    if (!answer.trim()) {
      return;
    }

    const correct = acceptedAnswers.includes(normalizeText(answer));
    setChecked(true);
    setIsCorrect(correct);
    setLoadingFeedback(true);
    setFeedback("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "language",
          context: {
            language: lesson.lang,
            nativeName: lesson.nativeName,
            topic: lesson.topic,
            difficulty: lesson.difficulty,
            hint: lesson.hint
          },
          messages: [
            {
              role: "user",
              content: [
                `Exercise prompt: ${exercise.prompt}`,
                `Expected answer: ${exercise.answer}`,
                `Accepted alternatives: ${(exercise.alt ?? []).join(", ") || "none"}`,
                `Learner answer: ${answer}`,
                `Result: ${correct ? "correct" : "incorrect"}`,
                "Give short, supportive feedback with a translation or explanation and one tiny example."
              ].join("\n")
            }
          ]
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to get language feedback.");
      }

      setFeedback(data.message ?? "");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Something went wrong while fetching feedback."
      );
    } finally {
      setLoadingFeedback(false);
    }
  };

  const moveForward = () => {
    if (!checked) {
      return;
    }

    if (currentIndex === totalExercises - 1) {
      markComplete(lesson.id, lesson.xp);
      setCompleted(true);
      return;
    }

    setCurrentIndex((current) => current + 1);
    setAnswer("");
    setChecked(false);
    setIsCorrect(null);
    setShowHint(false);
    setFeedback("");
  };

  if (completed) {
    return (
      <div className="page-shell-tight">
        <div className="card fade-in fade-in-1 stack-lg">
          <span className="section-label">Lesson Complete</span>
          <h1 className="page-heading" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}>
            {lesson.flag} {lesson.lang} · {lesson.topic}
          </h1>
          <p className="page-copy">
            You finished this lesson and earned {lesson.xp} XP. Restart any time to practice it
            again.
          </p>
          <div className="row-meta">
            <span className="badge badge-green">Completed</span>
            <span className="badge badge-blue">{lesson.xp} XP earned</span>
          </div>
          <div className="inline-cluster">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCurrentIndex(0);
                setAnswer("");
                setChecked(false);
                setIsCorrect(null);
                setShowHint(false);
                setFeedback("");
                setCompleted(false);
              }}
            >
              Restart Lesson
            </button>
            <Link href="/languages" className="btn btn-ghost">
              Back to Lessons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell-tight stack-lg">
      <section className="card fade-in fade-in-1 stack-md">
        <div className="inline-cluster text-muted">
          <Link href="/languages">Languages</Link>
          <span>/</span>
          <span>{lesson.lang}</span>
        </div>

        <div className="stack-sm">
          <span className="section-label">Lesson Flow</span>
          <h1 className="page-heading" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}>
            {lesson.flag} {lesson.lang} · {lesson.topic}
          </h1>
          <p className="page-copy">{lesson.description}</p>
        </div>

        <div className="row-meta">
          <span className={`badge ${diffBadge[lesson.difficulty]}`}>{lesson.difficulty}</span>
          <span className="badge badge-blue">{lesson.xp} XP</span>
          {alreadyCompleted && <span className="badge badge-green">Completed before</span>}
        </div>

        <ProgressBar
          value={currentIndex + 1}
          max={totalExercises}
          label={`Exercise ${currentIndex + 1} of ${totalExercises}`}
        />
      </section>

      <section className="card fade-in fade-in-2 stack-lg">
        <div className="stack-md">
          <span className="section-label">Current Exercise</span>
          <h2 style={{ margin: 0, fontSize: "1.5rem", letterSpacing: "-0.03em" }}>
            {exercise.prompt}
          </h2>
        </div>

        <div className="stack-md">
          <input
            className={`input ${
              checked ? (isCorrect ? "lesson-input-correct" : "lesson-input-wrong") : ""
            }`}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your answer here..."
          />

          <div className="conversation-actions">
            <button type="button" className="btn btn-primary" onClick={() => void checkAnswer()}>
              Check Answer
            </button>
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
            <button
              type="button"
              className="btn btn-ghost"
              onClick={moveForward}
              disabled={!checked}
            >
              {currentIndex === totalExercises - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>

        {showHint && <div className="hint-box">{lesson.hint}</div>}

        {checked && (
          <div className={`result-box ${isCorrect ? "result-pass" : "result-fail"} stack-sm`}>
            <strong>{isCorrect ? "Correct" : "Not quite"}</strong>
            <p className="page-copy">
              Expected answer: <span className="mono">{exercise.answer}</span>
            </p>
          </div>
        )}

        {(loadingFeedback || feedback) && (
          <div className="card surface-muted stack-sm">
            <div className="inline-cluster">
              {loadingFeedback && (
                <span className="spin" aria-hidden="true">
                  ↻
                </span>
              )}
              <span className="section-label" style={{ marginBottom: 0 }}>
                AI Feedback
              </span>
            </div>
            <p className="page-copy">{loadingFeedback ? "Preparing feedback..." : feedback}</p>
          </div>
        )}
      </section>
    </div>
  );
}
