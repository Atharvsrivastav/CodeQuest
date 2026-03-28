"use client";

import { useMemo } from "react";

import ProgressBar from "@/components/ProgressBar";
import {
  codingChallenges,
  languageLessons,
  resetProgress,
  totalAvailableXp
} from "@/lib/data";
import { useLearnlyProgress } from "@/lib/useProgress";

export default function ProgressPage() {
  const progress = useLearnlyProgress();
  const completedIds = new Set(progress.completedIds);

  const codingSolved = codingChallenges.filter((challenge) => completedIds.has(challenge.id)).length;
  const languageSolved = languageLessons.filter((lesson) => completedIds.has(lesson.id)).length;

  const languageGroups = useMemo(() => {
    return ["Spanish", "French", "German", "Japanese"].map((lang) => {
      const lessons = languageLessons.filter((lesson) => lesson.lang === lang);
      const completed = lessons.filter((lesson) => completedIds.has(lesson.id)).length;

      return {
        lang,
        lessons,
        completed
      };
    });
  }, [completedIds]);

  return (
    <div className="page-shell stack-lg">
      <section className="card fade-in fade-in-1 stack-md">
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div className="stack-sm">
            <span className="section-label">Progress</span>
            <h1 className="page-heading" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}>
              Track every lesson and challenge
            </h1>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (window.confirm("Reset all Learnly progress? This will clear completed items and XP.")) {
                resetProgress();
              }
            }}
          >
            Reset Progress
          </button>
        </div>

        <ProgressBar value={progress.xp} max={totalAvailableXp} label="XP earned" />

        <div className="stats-grid">
          <div className="stat-card fade-in fade-in-2 stack-sm">
            <span className="section-label">Total Completed</span>
            <h2 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.04em" }}>
              {progress.completedIds.length}
            </h2>
            <p className="page-copy">Combined across coding challenges and language lessons.</p>
          </div>
          <div className="stat-card fade-in fade-in-3 stack-sm">
            <span className="section-label">Coding Solved</span>
            <h2 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.04em" }}>
              {codingSolved}
            </h2>
            <p className="page-copy">{codingChallenges.length} total coding challenges available.</p>
          </div>
          <div className="stat-card fade-in fade-in-4 stack-sm">
            <span className="section-label">Language Lessons</span>
            <h2 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.04em" }}>
              {languageSolved}
            </h2>
            <p className="page-copy">{languageLessons.length} total lessons available.</p>
          </div>
        </div>
      </section>

      <section className="split-grid">
        <div className="list-panel fade-in fade-in-2">
          <div className="stack-sm">
            <span className="section-label">Coding Checklist</span>
            <h2 style={{ margin: 0, letterSpacing: "-0.03em" }}>All coding challenges</h2>
          </div>

          <div style={{ marginTop: "1rem" }}>
            {codingChallenges.map((challenge) => (
              <div className="list-row" key={challenge.id}>
                <div className="list-row-main">
                  <span
                    className={`circle ${
                      completedIds.has(challenge.id) ? "circle-done" : "circle-empty"
                    }`}
                  />
                  <div className="list-row-copy">
                    <h3 className="list-row-title">{challenge.title}</h3>
                    <p className="list-row-desc">{challenge.description}</p>
                  </div>
                </div>
                <span className="badge badge-gray mono">{challenge.xp} XP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stack-md fade-in fade-in-3">
          <div className="list-panel">
            <div className="stack-sm">
              <span className="section-label">Language Progress</span>
              <h2 style={{ margin: 0, letterSpacing: "-0.03em" }}>By language</h2>
            </div>
          </div>

          {languageGroups.map((group) => (
            <div className="language-group stack-md" key={group.lang}>
              <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, letterSpacing: "-0.03em" }}>{group.lang}</h3>
                <span className="badge badge-gray mono">
                  {group.completed}/{group.lessons.length}
                </span>
              </div>
              <div className="mini-track">
                <div
                  className="mini-fill"
                  style={{
                    width: `${Math.round((group.completed / Math.max(group.lessons.length, 1)) * 100)}%`
                  }}
                />
              </div>

              <div>
                {group.lessons.map((lesson) => (
                  <div className="list-row" key={lesson.id}>
                    <div className="list-row-main">
                      <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{lesson.flag}</span>
                      <div className="list-row-copy">
                        <h4 className="list-row-title">
                          {lesson.lang} · {lesson.topic}
                        </h4>
                        <p className="list-row-desc">{lesson.description}</p>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        completedIds.has(lesson.id) ? "badge-green" : "badge-gray"
                      }`}
                    >
                      {completedIds.has(lesson.id) ? "Done" : `${lesson.xp} XP`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
