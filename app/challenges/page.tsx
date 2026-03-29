"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { codingChallenges, diffBadge, getChallengeById } from "@/lib/challenges";
import { getAdaptiveDifficulty, getSuggestedChallengeIds, getWeakTopics } from "@/lib/personalization";
import { useProgress } from "@/lib/useProgress";

const filters = ["all", "beginner", "intermediate", "advanced"] as const;

export default function ChallengesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const progress = useProgress();
  const completedIds = new Set(progress.completedIds);
  const adaptiveDifficulty = useMemo(() => getAdaptiveDifficulty(progress), [progress]);
  const weakTopics = useMemo(() => getWeakTopics(progress, 3), [progress]);
  const suggestedChallenges = useMemo(
    () =>
      getSuggestedChallengeIds(progress, 3)
        .map((challengeId) => getChallengeById(challengeId))
        .filter((challenge): challenge is NonNullable<ReturnType<typeof getChallengeById>> =>
          Boolean(challenge)
        ),
    [progress]
  );
  const adaptiveDifficultyLabel =
    adaptiveDifficulty.charAt(0).toUpperCase() + adaptiveDifficulty.slice(1);
  const sectionMotion = (delay = 0) => ({
    initial: false as const,
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay, ease: "easeOut" as const }
  });

  const filteredChallenges = useMemo(() => {
    if (filter === "all") {
      return codingChallenges;
    }

    return codingChallenges.filter((challenge) => challenge.difficulty === filter);
  }, [filter]);

  return (
    <div className="page-shell stack-lg">
      <motion.section className="card stack-md" {...sectionMotion(0.05)}>
        <span className="section-label">Coding Practice</span>
        <h1 className="page-heading" style={{ fontSize: "clamp(1.9rem, 3vw, 2.8rem)" }}>
          Solve focused coding challenges
        </h1>
        <p className="page-copy">
          Work through a curated set of JavaScript and Python exercises, then lean on the AI tutor
          whenever you need a hint or debugging step.
        </p>
        <div className="pill-row">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={`pill ${filter === item ? "pill-active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item === "all" ? "All" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section className="card stack-md" {...sectionMotion(0.11)}>
        <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
          <div className="stack-sm">
            <span className="section-label">Personalized Path</span>
            <h2 style={{ margin: 0, letterSpacing: "-0.03em" }}>Recommended next problems</h2>
          </div>
          <span className={`badge ${diffBadge[adaptiveDifficulty]}`}>
            {adaptiveDifficultyLabel} target
          </span>
        </div>

        <p className="page-copy">
          Suggestions adapt to your recent test outcomes, topic weaknesses, and the next best
          challenge difficulty.
        </p>

        <div className="stack-sm">
          <span className="section-label">Weak Topics</span>
          {weakTopics.length ? (
            <div className="chip-row">
              {weakTopics.map((topic) => (
                <span className="chip" key={topic.topic}>
                  {topic.topic} - {Math.round((1 - topic.passRate) * 100)}% error rate
                </span>
              ))}
            </div>
          ) : (
            <p className="text-subtle" style={{ margin: 0 }}>
              Complete a few test runs to detect topic weaknesses.
            </p>
          )}
        </div>

        <div className="stack-sm">
          <span className="section-label">Suggested Next Problems</span>
          {suggestedChallenges.length ? (
            suggestedChallenges.map((challenge) => (
              <Link href={`/challenges/${challenge.id}`} className="list-row" key={challenge.id}>
                <div className="list-row-main">
                  <span className={`circle ${completedIds.has(challenge.id) ? "circle-done" : "circle-empty"}`} />
                  <div className="list-row-copy">
                    <h3 className="list-row-title">{challenge.title}</h3>
                    <p className="list-row-desc">{challenge.description}</p>
                  </div>
                </div>
                <div className="row-meta">
                  <span className={`badge ${diffBadge[challenge.difficulty]}`}>
                    {challenge.difficulty}
                  </span>
                  <span className="badge badge-blue">{challenge.xp} XP</span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-subtle" style={{ margin: 0 }}>
              You&apos;ve completed every challenge in the current track.
            </p>
          )}
        </div>
      </motion.section>

      <motion.section className="list-panel" {...sectionMotion(0.16)}>
        {filteredChallenges.map((challenge) => {
          const completed = completedIds.has(challenge.id);

          return (
            <Link href={`/challenges/${challenge.id}`} className="list-row" key={challenge.id}>
              <div className="list-row-main">
                <span className={`circle ${completed ? "circle-done" : "circle-empty"}`} />
                <div className="list-row-copy">
                  <h2 className="list-row-title">{challenge.title}</h2>
                  <p className="list-row-desc">{challenge.description}</p>
                </div>
              </div>

              <div className="row-meta">
                <span className="badge badge-gray mono">{challenge.language.toUpperCase()}</span>
                <span className={`badge ${diffBadge[challenge.difficulty]}`}>
                  {challenge.difficulty}
                </span>
                <span className="badge badge-blue">{challenge.xp} XP</span>
              </div>
            </Link>
          );
        })}
      </motion.section>
    </div>
  );
}
