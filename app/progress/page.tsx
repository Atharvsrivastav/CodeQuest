"use client";

import { motion } from "framer-motion";

import ProgressBar from "@/components/ProgressBar";
import { codingChallenges, totalChallengeXp } from "@/lib/challenges";
import { getAdaptiveDifficulty, getWeakTopics } from "@/lib/personalization";
import { resetProgress } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";

export default function ProgressPage() {
  const progress = useProgress();
  const completedIds = new Set(progress.completedIds);
  const solvedCount = codingChallenges.filter((challenge) => completedIds.has(challenge.id)).length;
  const remainingCount = codingChallenges.length - solvedCount;
  const completionRate = Math.round((solvedCount / Math.max(codingChallenges.length, 1)) * 100);
  const adaptiveDifficulty = getAdaptiveDifficulty(progress);
  const weakTopics = getWeakTopics(progress, 5);
  const adaptiveDifficultyLabel =
    adaptiveDifficulty.charAt(0).toUpperCase() + adaptiveDifficulty.slice(1);
  const sectionMotion = (delay = 0) => ({
    initial: false as const,
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay, ease: "easeOut" as const }
  });

  return (
    <div className="page-shell stack-lg">
      <motion.section className="card stack-md" {...sectionMotion(0.05)}>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div className="stack-sm">
            <span className="section-label">Progress</span>
            <h1 className="page-heading" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}>
              Track challenge completion and XP
            </h1>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (window.confirm("Reset all CodeQuest progress? This will clear completed challenges and XP.")) {
                resetProgress();
              }
            }}
          >
            Reset Progress
          </button>
        </div>

        <ProgressBar value={progress.xp} max={totalChallengeXp} label="XP earned" />

        <div className="stats-grid">
          <div className="stat-card fade-in fade-in-2 stack-sm">
            <span className="section-label">XP Earned</span>
            <h2 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.04em" }}>
              {progress.xp}
            </h2>
            <p className="page-copy">XP is now calculated from solved coding challenges only.</p>
          </div>
          <div className="stat-card fade-in fade-in-3 stack-sm">
            <span className="section-label">Challenges Solved</span>
            <h2 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.04em" }}>
              {solvedCount}
            </h2>
            <p className="page-copy">{codingChallenges.length} total coding challenges available.</p>
          </div>
          <div className="stat-card fade-in fade-in-4 stack-sm">
            <span className="section-label">Current Streak</span>
            <h2 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.04em" }}>
              {progress.streak}
            </h2>
            <p className="page-copy">
              {completionRate}% complete with {remainingCount} challenges remaining.
            </p>
          </div>
          <div className="stat-card fade-in fade-in-4 stack-sm">
            <span className="section-label">Adaptive Difficulty</span>
            <h2 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-0.04em" }}>
              {adaptiveDifficultyLabel}
            </h2>
            <p className="page-copy">
              Based on your recent test outcomes, the next suggested track is{" "}
              {adaptiveDifficultyLabel.toLowerCase()}.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section className="list-panel" {...sectionMotion(0.12)}>
        <div className="stack-sm">
          <span className="section-label">Weak Topics</span>
          <h2 style={{ margin: 0, letterSpacing: "-0.03em" }}>Targeted practice areas</h2>
        </div>

        <div style={{ marginTop: "1rem" }}>
          {weakTopics.length ? (
            weakTopics.map((topic) => (
              <div className="list-row" key={topic.topic}>
                <div className="list-row-main">
                  <span className="circle circle-empty" />
                  <div className="list-row-copy">
                    <h3 className="list-row-title">{topic.topic}</h3>
                    <p className="list-row-desc">
                      {topic.attempts} attempts with {Math.round((1 - topic.passRate) * 100)}% error rate.
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="page-copy" style={{ margin: 0 }}>
              Weak topics will appear after a few test runs.
            </p>
          )}
        </div>
      </motion.section>

      <motion.section className="list-panel" {...sectionMotion(0.17)}>
        <div className="stack-sm">
          <span className="section-label">Challenge Checklist</span>
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
              <div className="row-meta">
                <span className="badge badge-gray mono">{challenge.language.toUpperCase()}</span>
                <span className="badge badge-blue">{challenge.xp} XP</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
