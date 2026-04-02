"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const PROGRAMMING_LANGUAGES = ["Python", "Java", "C++", "SQL", "JavaScript", "TypeScript"] as const;
const SPOKEN_LANGUAGES = ["English", "Hindi", "German"] as const;
const API_BASE_URL = (process.env.NEXT_PUBLIC_ADAPTIVE_TUTOR_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

type SpokenLanguage = (typeof SPOKEN_LANGUAGES)[number];
type Difficulty = "easy" | "medium" | "hard";
type DifficultyDirection = "up" | "down" | "same";
type Screen = "home" | "quiz";
type LoadingState = "idle" | "starting" | "submitting" | "next";

const LANGUAGE_HINTS: Record<SpokenLanguage, string> = {
  English: "Clear global default",
  Hindi: "Simple Hindi explanations",
  German: "Friendly German guidance"
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard"
};

interface QuizQuestion {
  id: string;
  category: string;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
}

interface StartResponse {
  session_id: string;
  language: SpokenLanguage;
  difficulty: Difficulty;
  score: number;
  streak: number;
  answered_count: number;
  total_questions: number;
  quiz_complete: boolean;
  question_number: number;
  question: QuizQuestion | null;
}

interface QuestionResponse {
  language: SpokenLanguage;
  difficulty: Difficulty;
  score: number;
  streak: number;
  answered_count: number;
  total_questions: number;
  quiz_complete: boolean;
  question_number: number;
  question: QuizQuestion | null;
}

interface AnswerResponse {
  correct: boolean;
  explanation: string;
  next_difficulty: Difficulty;
  score: number;
  streak: number;
  correct_option: string;
  difficulty_direction: DifficultyDirection;
  question_number: number;
  total_questions: number;
  quiz_complete: boolean;
  language: SpokenLanguage;
}

interface CompletedTurn {
  question: QuizQuestion;
  selectedOption: string;
  feedback: AnswerResponse;
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });
  } catch {
    throw new Error(
      `Could not reach the tutor API at ${API_BASE_URL}. Start the FastAPI server and confirm NEXT_PUBLIC_ADAPTIVE_TUTOR_API_URL is correct.`
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : null) ?? "The tutor service is unavailable right now.";
    throw new Error(message);
  }

  return payload as T;
}

function difficultyBadgeTone(difficulty: Difficulty) {
  if (difficulty === "hard") {
    return {
      borderColor: "rgba(244, 114, 182, 0.38)",
      background: "rgba(244, 114, 182, 0.14)",
      color: "#db2777"
    };
  }

  if (difficulty === "medium") {
    return {
      borderColor: "rgba(245, 158, 11, 0.34)",
      background: "rgba(245, 158, 11, 0.16)",
      color: "#b45309"
    };
  }

  return {
    borderColor: "rgba(34, 197, 94, 0.34)",
    background: "rgba(34, 197, 94, 0.14)",
    color: "#15803d"
  };
}

function statCardStyle() {
  return {
    borderColor: "var(--border)",
    background: "color-mix(in srgb, var(--surface) 88%, transparent)"
  } as const;
}

function panelStyle() {
  return {
    borderColor: "var(--border)",
    background: "color-mix(in srgb, var(--surface) 92%, transparent)",
    boxShadow: "var(--surface-shadow)"
  } as const;
}

export default function AdaptiveTutorClient() {
  const levelBannerTimeoutRef = useRef<number | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedLanguage, setSelectedLanguage] = useState<SpokenLanguage | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<CompletedTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [quizComplete, setQuizComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [levelBanner, setLevelBanner] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (levelBannerTimeoutRef.current !== null) {
        window.clearTimeout(levelBannerTimeoutRef.current);
      }
    };
  }, []);

  const answeredCount = feedback ? questionNumber : Math.max(questionNumber - 1, 0);
  const progressPercent = Math.min(100, Math.round((answeredCount / Math.max(totalQuestions, 1)) * 100));
  const isStarting = loadingState === "starting";
  const isSubmitting = loadingState === "submitting";
  const isLoadingNext = loadingState === "next";
  const isBusy = loadingState !== "idle";
  const canStartQuiz = Boolean(selectedLanguage) && !isStarting;
  const canSubmitAnswer = Boolean(sessionId && currentQuestion && selectedOption) && !feedback && !isSubmitting;
  const canLoadNextQuestion = Boolean(sessionId && feedback) && !quizComplete && !isLoadingNext;
  const canRestartQuiz = Boolean(selectedLanguage) && !isBusy;

  function clearLevelBanner() {
    if (levelBannerTimeoutRef.current !== null) {
      window.clearTimeout(levelBannerTimeoutRef.current);
    }
    levelBannerTimeoutRef.current = null;
    setLevelBanner(null);
  }

  function triggerLevelBanner(nextDifficulty: Difficulty) {
    clearLevelBanner();
    setLevelBanner(`Level Up! You unlocked ${DIFFICULTY_LABELS[nextDifficulty]} mode.`);
    levelBannerTimeoutRef.current = window.setTimeout(() => {
      setLevelBanner(null);
      levelBannerTimeoutRef.current = null;
    }, 2600);
  }

  function resetTransientQuizState() {
    setSessionId(null);
    setHistory([]);
    setCurrentQuestion(null);
    setSelectedOption(null);
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setDifficulty("easy");
    setQuestionNumber(1);
    setTotalQuestions(10);
    setQuizComplete(false);
    clearLevelBanner();
    setErrorMessage(null);
  }

  function applyQuestionState(data: StartResponse | QuestionResponse) {
    setSelectedLanguage(data.language);
    setDifficulty(data.difficulty);
    setScore(data.score);
    setStreak(data.streak);
    setQuestionNumber(data.question_number);
    setTotalQuestions(data.total_questions);
    setQuizComplete(data.quiz_complete);
    setCurrentQuestion(data.question);
  }

  function applyAnswerState(data: AnswerResponse) {
    setFeedback(data);
    setDifficulty(data.next_difficulty);
    setScore(data.score);
    setStreak(data.streak);
    setQuestionNumber(data.question_number);
    setTotalQuestions(data.total_questions);
    setQuizComplete(data.quiz_complete);
  }

  function handleLanguageSelect(language: SpokenLanguage) {
    setSelectedLanguage(language);
    setErrorMessage(null);
  }

  function handleOptionSelect(option: string) {
    if (feedback) {
      return;
    }

    setSelectedOption(option);
    setErrorMessage(null);
  }

  async function startQuiz(languageOverride?: SpokenLanguage) {
    const language = languageOverride ?? selectedLanguage;
    if (!language || isStarting) {
      return;
    }

    resetTransientQuizState();
    setLoadingState("starting");
    setSelectedLanguage(language);

    try {
      const data = await fetchApi<StartResponse>("/start", {
        method: "POST",
        body: JSON.stringify({ language })
      });

      if (!data.question) {
        throw new Error("The tutor could not load the first question.");
      }

      setSessionId(data.session_id);
      applyQuestionState(data);
      setScreen("quiz");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start the quiz.");
    } finally {
      setLoadingState("idle");
    }
  }

  async function loadNextQuestion() {
    if (!sessionId || !currentQuestion || !selectedOption || !feedback) {
      return;
    }

    setLoadingState("next");
    setErrorMessage(null);
    const completedTurn: CompletedTurn = {
      question: currentQuestion,
      selectedOption,
      feedback
    };

    try {
      const data = await fetchApi<QuestionResponse>(
        `/question?session_id=${encodeURIComponent(sessionId)}`
      );

      setHistory((previous) => [...previous, completedTurn]);
      setSelectedOption(null);
      setFeedback(null);
      applyQuestionState(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load the next question.");
    } finally {
      setLoadingState("idle");
    }
  }

  async function submitAnswer() {
    if (!sessionId || !currentQuestion || !selectedLanguage || !selectedOption || feedback) {
      return;
    }

    setLoadingState("submitting");
    setErrorMessage(null);

    try {
      const data = await fetchApi<AnswerResponse>("/answer", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          selected_option: selectedOption,
          question_id: currentQuestion.id,
          language: selectedLanguage
        })
      });

      applyAnswerState(data);

      if (data.difficulty_direction === "up") {
        triggerLevelBanner(data.next_difficulty);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit the answer.");
    } finally {
      setLoadingState("idle");
    }
  }

  async function restartQuiz() {
    if (!selectedLanguage) {
      setScreen("home");
      return;
    }

    await startQuiz(selectedLanguage);
  }

  function backToHome() {
    setScreen("home");
    resetTransientQuizState();
  }

  function renderAnswerBubble(turn: { selectedOption: string }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ml-auto max-w-[88%] rounded-[28px] border px-5 py-4 text-sm sm:max-w-[72%] sm:text-base"
        style={{
          borderColor: "rgba(37, 99, 235, 0.22)",
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(15, 118, 110, 0.14))"
        }}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: "var(--text-3)" }}>
          You Answered
        </p>
        <p className="m-0 font-medium" style={{ color: "var(--text)" }}>
          {turn.selectedOption}
        </p>
      </motion.div>
    );
  }

  function renderFeedbackBubble(turn: { feedback: AnswerResponse }) {
    const tone = turn.feedback.correct
      ? {
          borderColor: "rgba(34, 197, 94, 0.28)",
          background: "rgba(34, 197, 94, 0.10)",
          badge: "Correct",
          badgeColor: "#15803d"
        }
      : {
          borderColor: "rgba(239, 68, 68, 0.24)",
          background: "rgba(239, 68, 68, 0.10)",
          badge: "Incorrect",
          badgeColor: "#dc2626"
        };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[95%] rounded-[28px] border px-5 py-5 sm:max-w-[80%]"
        style={{
          borderColor: tone.borderColor,
          background: tone.background
        }}
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{
              borderColor: tone.borderColor,
              color: tone.badgeColor
            }}
          >
            {tone.badge}
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
            Explanation in {turn.feedback.language}
          </span>
        </div>
        <p className="m-0 whitespace-pre-line text-sm leading-7 sm:text-base" style={{ color: "var(--text)" }}>
          {turn.feedback.explanation}
        </p>
        {!turn.feedback.correct && (
          <p className="mt-4 text-sm font-medium" style={{ color: "var(--text-2)" }}>
            Correct answer: <span style={{ color: "var(--text)" }}>{turn.feedback.correct_option}</span>
          </p>
        )}
      </motion.div>
    );
  }

  function optionTone(option: string) {
    if (!feedback) {
      if (selectedOption === option) {
        return {
          borderColor: "rgba(37, 99, 235, 0.38)",
          background: "rgba(37, 99, 235, 0.12)",
          color: "var(--text)"
        };
      }

      return {
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--surface) 94%, transparent)",
        color: "var(--text)"
      };
    }

    if (option === feedback.correct_option) {
      return {
        borderColor: "rgba(34, 197, 94, 0.34)",
        background: "rgba(34, 197, 94, 0.14)",
        color: "#166534"
      };
    }

    if (option === selectedOption) {
      return {
        borderColor: "rgba(239, 68, 68, 0.26)",
        background: "rgba(239, 68, 68, 0.10)",
        color: "#b91c1c"
      };
    }

    return {
      borderColor: "var(--border)",
      background: "color-mix(in srgb, var(--surface) 94%, transparent)",
      color: "var(--text-2)"
    };
  }

  return (
    <div className="page-shell-wide">
      <AnimatePresence>
        {levelBanner ? (
          <motion.div
            key={levelBanner}
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            className="fixed left-1/2 top-24 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-[24px] border px-5 py-4 text-center shadow-2xl"
            style={{
              borderColor: "rgba(250, 204, 21, 0.42)",
              background: "linear-gradient(135deg, rgba(250, 204, 21, 0.92), rgba(249, 115, 22, 0.92))",
              color: "#241608"
            }}
          >
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.28em]">Adaptive Jump</p>
            <p className="mt-2 text-lg font-semibold">{levelBanner}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {screen === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="flex flex-col gap-6"
          >
            <section
              className="overflow-hidden rounded-[36px] border px-6 py-7 sm:px-8 sm:py-10"
              style={{
                borderColor: "rgba(37, 99, 235, 0.16)",
                background:
                  "radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 32%), radial-gradient(circle at right top, rgba(15, 118, 110, 0.16), transparent 35%), color-mix(in srgb, var(--surface) 92%, transparent)",
                boxShadow: "var(--surface-shadow)"
              }}
            >
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="inline-flex min-h-9 items-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.26em]"
                      style={{
                        borderColor: "rgba(37, 99, 235, 0.22)",
                        background: "rgba(37, 99, 235, 0.12)",
                        color: "var(--accent)"
                      }}
                    >
                      Adaptive Quiz Journey
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                      Multilingual explanations with dynamic difficulty
                    </span>
                  </div>

                  <div className="max-w-3xl">
                    <h1
                      className="m-0 text-[clamp(2.6rem,5vw,4.6rem)] font-semibold leading-[0.94] tracking-[-0.06em]"
                      style={{ color: "var(--text)" }}
                    >
                      AI Adaptive Learning Tutor
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-8 sm:text-lg" style={{ color: "var(--text-2)" }}>
                      Pick your explanation language, answer programming questions, and let the tutor
                      automatically raise or lower the challenge as your streak changes.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "10-question sprint", value: "Fast feedback loop" },
                      { label: "Adaptive logic", value: "3 right up, 2 wrong down" },
                      { label: "AI explanations", value: "English, Hindi, German" }
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[24px] border p-4"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.15)",
                          background: "color-mix(in srgb, var(--surface) 84%, transparent)"
                        }}
                      >
                        <p className="m-0 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-3)" }}>
                          {item.label}
                        </p>
                        <p className="mt-3 text-lg font-semibold" style={{ color: "var(--text)" }}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-[32px] border p-6"
                  style={{
                    borderColor: "rgba(37, 99, 235, 0.18)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.74), color-mix(in srgb, var(--surface) 90%, transparent))"
                  }}
                >
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: "var(--text-3)" }}>
                    Spoken Language
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]" style={{ color: "var(--text)" }}>
                    Select how the tutor should explain
                  </h2>
                  <div className="mt-5 grid gap-3" role="radiogroup" aria-label="Spoken language">
                    {SPOKEN_LANGUAGES.map((language) => {
                      const active = selectedLanguage === language;
                      return (
                        <button
                          key={language}
                          type="button"
                          onClick={() => handleLanguageSelect(language)}
                          role="radio"
                          aria-checked={active}
                          className="rounded-[22px] border p-4 text-left transition-all hover:-translate-y-0.5"
                          style={{
                            borderColor: active ? "rgba(37, 99, 235, 0.34)" : "var(--border)",
                            background: active
                              ? "linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(15, 118, 110, 0.12))"
                              : "color-mix(in srgb, var(--surface) 94%, transparent)"
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="m-0 text-lg font-semibold" style={{ color: "var(--text)" }}>
                                {language}
                              </p>
                              <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                                {LANGUAGE_HINTS[language]}
                              </p>
                            </div>
                            <span
                              className="mt-1 inline-flex h-6 w-10 items-center justify-center rounded-full border text-[10px] font-bold tracking-[0.14em]"
                              style={{
                                borderColor: active ? "rgba(37, 99, 235, 0.34)" : "var(--border)",
                                background: active ? "rgba(37, 99, 235, 0.12)" : "transparent",
                                color: active ? "var(--accent)" : "var(--text-3)"
                              }}
                            >
                              {active ? "ON" : "OFF"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full border px-5 text-sm font-semibold uppercase tracking-[0.22em] text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    style={{
                      borderColor: "transparent",
                      background: "linear-gradient(135deg, #2563eb, #0f766e)"
                    }}
                    onClick={() => void startQuiz()}
                    disabled={!canStartQuiz}
                  >
                    {isStarting ? "Starting..." : "Start Quiz"}
                  </button>
                  <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-2)" }}>
                    The quiz talks to a FastAPI backend at <span className="font-semibold">{API_BASE_URL}</span>.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <div className="rounded-[32px] border p-6 sm:p-7" style={panelStyle()}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-3)" }}>
                      Programming Languages
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]" style={{ color: "var(--text)" }}>
                      Covered in the question bank
                    </h2>
                  </div>
                  <span
                    className="inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(15, 118, 110, 0.2)",
                      background: "rgba(15, 118, 110, 0.10)",
                      color: "#0f766e"
                    }}
                  >
                    21 curated questions
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {PROGRAMMING_LANGUAGES.map((language) => (
                    <span
                      key={language}
                      className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold"
                      style={{
                        borderColor: "var(--border)",
                        background: "color-mix(in srgb, var(--surface) 96%, transparent)",
                        color: "var(--text)"
                      }}
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border p-6 sm:p-7" style={panelStyle()}>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-3)" }}>
                  How It Works
                </p>
                <div className="mt-5 grid gap-4">
                  {[
                    "Pick English, Hindi, or German before the quiz starts.",
                    "Every answer updates your score, streak, and next difficulty.",
                    "Three correct answers in a row level you up. Two misses can bring the pace back down.",
                    "Each response gets a plain-language explanation from OpenAI, with local fallbacks if the API is unavailable."
                  ].map((step, index) => (
                    <div key={step} className="flex gap-4 rounded-[22px] border p-4" style={statCardStyle()}>
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                        style={{
                          background: "rgba(37, 99, 235, 0.12)",
                          color: "var(--accent)"
                        }}
                      >
                        {index + 1}
                      </span>
                      <p className="m-0 text-sm leading-7" style={{ color: "var(--text-2)" }}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {errorMessage ? (
              <div
                className="rounded-[24px] border px-5 py-4 text-sm font-medium"
                style={{
                  borderColor: "rgba(239, 68, 68, 0.24)",
                  background: "rgba(239, 68, 68, 0.10)",
                  color: "#b91c1c"
                }}
              >
                {errorMessage}
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]"
          >
            <section className="rounded-[32px] border p-4 sm:p-5" style={panelStyle()}>
              <div
                className="rounded-[28px] border px-5 py-5"
                style={{
                  borderColor: "rgba(37, 99, 235, 0.14)",
                  background: "linear-gradient(135deg, rgba(37, 99, 235, 0.10), rgba(15, 118, 110, 0.10))"
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-3)" }}>
                      Quiz Progress
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]" style={{ color: "var(--text)" }}>
                      Question {Math.min(questionNumber, totalQuestions)} of {totalQuestions}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span
                      className="inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold"
                      style={{
                        borderColor: "rgba(37, 99, 235, 0.24)",
                        background: "rgba(37, 99, 235, 0.12)",
                        color: "var(--accent)"
                      }}
                    >
                      {selectedLanguage}
                    </span>
                    <span
                      className="inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold"
                      style={difficultyBadgeTone(difficulty)}
                    >
                      {DIFFICULTY_LABELS[difficulty]}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="h-3 overflow-hidden rounded-full bg-[color:var(--bg-3)]">
                    <motion.div
                      animate={{ width: `${progressPercent}%` }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #2563eb, #0f766e)" }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: "var(--text-2)" }}>
                    <span>{progressPercent}% complete</span>
                    <span>{answeredCount} answered</span>
                  </div>
                </div>
              </div>

              {errorMessage ? (
                <div
                  className="mt-4 rounded-[22px] border px-4 py-3 text-sm font-medium"
                  style={{
                    borderColor: "rgba(239, 68, 68, 0.24)",
                    background: "rgba(239, 68, 68, 0.10)",
                    color: "#b91c1c"
                  }}
                >
                  {errorMessage}
                </div>
              ) : null}

              <div
                className="mt-4 rounded-[28px] border p-4 sm:p-5"
                style={{
                  borderColor: "var(--border)",
                  background: "color-mix(in srgb, var(--surface-2) 88%, transparent)"
                }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-3)" }}>
                      Tutor Chat
                    </p>
                    <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
                      Answer first, then review the explanation in your chosen language.
                    </p>
                  </div>
                </div>

                <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1">
                  {history.map((turn, index) => (
                    <div key={`${turn.question.id}-${index}`} className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-[95%] rounded-[28px] border px-5 py-5 sm:max-w-[80%]"
                        style={{
                          borderColor: "var(--border)",
                          background: "color-mix(in srgb, var(--surface) 95%, transparent)"
                        }}
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <span
                            className="inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.2em]"
                            style={{
                              borderColor: "rgba(15, 118, 110, 0.2)",
                              background: "rgba(15, 118, 110, 0.10)",
                              color: "#0f766e"
                            }}
                          >
                            {turn.question.category}
                          </span>
                          <span
                            className="inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.2em]"
                            style={difficultyBadgeTone(turn.question.difficulty)}
                          >
                            {DIFFICULTY_LABELS[turn.question.difficulty]}
                          </span>
                        </div>
                        <p className="m-0 text-sm leading-7 sm:text-base" style={{ color: "var(--text)" }}>
                          {turn.question.prompt}
                        </p>
                      </motion.div>
                      {renderAnswerBubble(turn)}
                      {renderFeedbackBubble(turn)}
                    </div>
                  ))}

                  {currentQuestion ? (
                    <div className="space-y-4">
                      <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-[95%] rounded-[28px] border px-5 py-5 sm:max-w-[80%]"
                        style={{
                          borderColor: "var(--border)",
                          background: "color-mix(in srgb, var(--surface) 95%, transparent)"
                        }}
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <span
                            className="inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.2em]"
                            style={{
                              borderColor: "rgba(15, 118, 110, 0.2)",
                              background: "rgba(15, 118, 110, 0.10)",
                              color: "#0f766e"
                            }}
                          >
                            {currentQuestion.category}
                          </span>
                          <span
                            className="inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.2em]"
                            style={difficultyBadgeTone(currentQuestion.difficulty)}
                          >
                            {DIFFICULTY_LABELS[currentQuestion.difficulty]}
                          </span>
                        </div>
                        <p className="m-0 text-base leading-8 sm:text-lg" style={{ color: "var(--text)" }}>
                          {currentQuestion.prompt}
                        </p>

                        <div className="mt-5 grid gap-3">
                          {currentQuestion.options.map((option) => {
                            const tone = optionTone(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => handleOptionSelect(option)}
                                disabled={Boolean(feedback) || isSubmitting || isLoadingNext}
                                aria-pressed={selectedOption === option}
                                className="w-full rounded-[20px] border px-4 py-4 text-left text-sm font-medium transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0 sm:text-base"
                                style={tone}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>

                      {selectedOption ? renderAnswerBubble({ selectedOption }) : null}
                      {feedback ? renderFeedbackBubble({ feedback }) : null}

                      {quizComplete && feedback ? (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-[28px] border px-5 py-5"
                          style={{
                            borderColor: "rgba(250, 204, 21, 0.34)",
                            background: "rgba(250, 204, 21, 0.12)"
                          }}
                        >
                          <p className="m-0 text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: "#a16207" }}>
                            Sprint Complete
                          </p>
                          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]" style={{ color: "var(--text)" }}>
                            Final score: {score}
                          </h3>
                          <p className="mt-3 text-sm leading-7 sm:text-base" style={{ color: "var(--text-2)" }}>
                            You finished all {totalQuestions} questions. Restart to try for a higher streak or switch
                            languages from the home screen.
                          </p>
                        </motion.div>
                      ) : null}
                    </div>
                  ) : (
                    <div
                      className="rounded-[24px] border px-5 py-6 text-sm leading-7 sm:text-base"
                      style={{
                        borderColor: "var(--border)",
                        background: "color-mix(in srgb, var(--surface) 96%, transparent)",
                        color: "var(--text-2)"
                      }}
                    >
                      {isLoadingNext ? "Loading your next question..." : "No active question right now."}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="flex flex-col gap-5">
              <div className="rounded-[32px] border p-5 sm:p-6" style={panelStyle()}>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-3)" }}>
                  Session Stats
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[24px] border p-4" style={statCardStyle()}>
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-3)" }}>
                      Score
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]" style={{ color: "var(--text)" }}>
                      {score}
                    </p>
                  </div>
                  <div className="rounded-[24px] border p-4" style={statCardStyle()}>
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-3)" }}>
                      Streak
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]" style={{ color: "var(--text)" }}>
                      {streak}
                    </p>
                  </div>
                  <div className="rounded-[24px] border p-4" style={statCardStyle()}>
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-3)" }}>
                      Selected Language
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]" style={{ color: "var(--text)" }}>
                      {selectedLanguage}
                    </p>
                  </div>
                  <div className="rounded-[24px] border p-4" style={statCardStyle()}>
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-3)" }}>
                      Adaptive Rule
                    </p>
                    <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-2)" }}>
                      3 correct answers in a row raises the level. 2 misses lowers it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border p-5 sm:p-6" style={panelStyle()}>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-3)" }}>
                  Actions
                </p>
                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={() => void submitAnswer()}
                    disabled={!canSubmitAnswer}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-semibold uppercase tracking-[0.22em] text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    style={{
                      borderColor: "transparent",
                      background: "linear-gradient(135deg, #2563eb, #1d4ed8)"
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadNextQuestion()}
                    disabled={!canLoadNextQuestion}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-semibold uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    style={{
                      borderColor: "rgba(15, 118, 110, 0.22)",
                      background: "rgba(15, 118, 110, 0.10)",
                      color: "#0f766e"
                    }}
                  >
                    {isLoadingNext ? "Loading..." : "Next Question"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void restartQuiz()}
                    disabled={!canRestartQuiz}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-semibold uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5"
                    style={{
                      borderColor: "var(--border)",
                      background: "color-mix(in srgb, var(--surface) 94%, transparent)",
                      color: "var(--text)"
                    }}
                  >
                    Restart Quiz
                  </button>
                  <button
                    type="button"
                    onClick={backToHome}
                    disabled={isBusy}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-semibold uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5"
                    style={{
                      borderColor: "var(--border)",
                      background: "transparent",
                      color: "var(--text-2)"
                    }}
                  >
                    Change Language
                  </button>
                </div>
              </div>

              <div className="rounded-[32px] border p-5 sm:p-6" style={panelStyle()}>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-3)" }}>
                  Build Notes
                </p>
                <div className="mt-5 space-y-4 text-sm leading-7" style={{ color: "var(--text-2)" }}>
                  <p className="m-0">
                    FastAPI endpoints: <span className="font-semibold">/start</span>,{" "}
                    <span className="font-semibold">/question</span>, <span className="font-semibold">/answer</span>
                  </p>
                  <p className="m-0">
                    OpenAI explanations are requested in <span className="font-semibold">{selectedLanguage}</span>,
                    with multilingual local fallbacks if the API is unavailable.
                  </p>
                  <p className="m-0">
                    Need the rest of the platform? Return to the main app from{" "}
                    <Link href="/" className="font-semibold underline underline-offset-4">
                      Home
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
