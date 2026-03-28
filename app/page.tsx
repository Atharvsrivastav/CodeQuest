"use client";

import Link from "next/link";

import ProgressBar from "@/components/ProgressBar";
import {
  codingChallenges,
  languageLessons,
  totalAvailableXp
} from "@/lib/data";
import { useLearnlyProgress } from "@/lib/useProgress";

const featureCards = [
  {
    href: "/learn",
    title: "AI Tutor",
    copy: "Switch between general, coding, and language tutoring with Gemini-powered guidance."
  },
  {
    href: "/code",
    title: "Editor",
    copy: "Use the free editor to explore JavaScript, TypeScript, and Python in one place."
  },
  {
    href: "/progress",
    title: "Progress",
    copy: "Track XP, review completed work, and see how your learning is stacking up."
  }
];

export default function HomePage() {
  const progress = useLearnlyProgress();
  const completedIds = new Set(progress.completedIds);
  const recentChallenges = codingChallenges.slice(0, 3);
  const recentLessons = languageLessons.slice(0, 4);

  return (
    <div className="page-shell stack-lg">
      <section className="card fade-in fade-in-1 stack-lg">
        <div className="stack-md">
          <span className="section-label">Unified Learning</span>
          <div className="hero-grid">
            <div className="stack-md">
              <h1 className="page-heading">Learn to code. Learn a language. Do both.</h1>
              <p className="page-copy">
                Learnly brings coding drills, spoken-language lessons, and an AI tutor into one
                clean daily practice loop.
              </p>
              <div className="inline-cluster">
                <Link href="/challenges" className="btn btn-primary">
                  Explore Coding
                </Link>
                <Link href="/languages" className="btn btn-ghost">
                  Explore Languages
                </Link>
              </div>
            </div>

            <div className="card surface-muted stack-md">
              <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
                <div className="stack-sm">
                  <span className="section-label" style={{ marginBottom: 0 }}>
                    Today&apos;s Snapshot
                  </span>
                  <h2 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.04em" }}>
                    {progress.xp} XP
                  </h2>
                </div>
                <span className="badge badge-blue">{progress.completedIds.length} completed</span>
              </div>
              <p className="page-copy">
                Move between beginner coding challenges and practical language lessons without
                leaving the same workspace.
              </p>
              <div className="row-meta">
                <span className="badge badge-gray mono">{codingChallenges.length} coding tasks</span>
                <span className="badge badge-gray mono">
                  {languageLessons.length} language lessons
                </span>
              </div>
            </div>
          </div>
        </div>

        {progress.xp > 0 && (
          <ProgressBar
            value={progress.xp}
            max={totalAvailableXp}
            label="Overall XP progress"
          />
        )}
      </section>

      <section className="split-grid">
        <div className="list-panel fade-in fade-in-2">
          <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="section-label">Coding Track</p>
              <h2 style={{ margin: 0, letterSpacing: "-0.03em" }}>Recent challenges</h2>
            </div>
            <Link href="/challenges" className="btn btn-ghost">
              View all
            </Link>
          </div>

          <div style={{ marginTop: "1rem" }}>
            {recentChallenges.map((challenge) => {
              const completed = completedIds.has(challenge.id);

              return (
                <Link href={`/challenges/${challenge.id}`} className="list-row" key={challenge.id}>
                  <div className="list-row-main">
                    <span className={`circle ${completed ? "circle-done" : "circle-empty"}`} />
                    <div className="list-row-copy">
                      <h3 className="list-row-title">{challenge.title}</h3>
                      <p className="list-row-desc">{challenge.description}</p>
                    </div>
                  </div>
                  <div className="row-meta">
                    <span className="badge badge-gray mono">{challenge.language.toUpperCase()}</span>
                    <span className="text-subtle">{completed ? "Solved" : "Ready"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="list-panel fade-in fade-in-3">
          <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="section-label">Language Track</p>
              <h2 style={{ margin: 0, letterSpacing: "-0.03em" }}>Recent lessons</h2>
            </div>
            <Link href="/languages" className="btn btn-ghost">
              View all
            </Link>
          </div>

          <div style={{ marginTop: "1rem" }}>
            {recentLessons.map((lesson) => {
              const completed = completedIds.has(lesson.id);

              return (
                <Link href={`/languages/${lesson.id}`} className="list-row" key={lesson.id}>
                  <div className="list-row-main">
                    <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{lesson.flag}</span>
                    <div className="list-row-copy">
                      <h3 className="list-row-title">
                        {lesson.lang} · {lesson.topic}
                      </h3>
                      <p className="list-row-desc">{lesson.description}</p>
                    </div>
                  </div>
                  <div className="row-meta">
                    <span className={`badge ${completed ? "badge-green" : "badge-gray"}`}>
                      {completed ? "Done" : `${lesson.xp} XP`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {featureCards.map((card, index) => (
          <Link
            href={card.href}
            className={`feature-link fade-in fade-in-${Math.min(index + 2, 4)}`}
            key={card.href}
          >
            <p className="section-label">{card.title}</p>
            <h3 style={{ margin: "0 0 0.6rem", fontSize: "1.2rem", letterSpacing: "-0.03em" }}>
              {card.title}
            </h3>
            <p className="page-copy">{card.copy}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
