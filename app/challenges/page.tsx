"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { codingChallenges, diffBadge } from "@/lib/data";
import { useLearnlyProgress } from "@/lib/useProgress";

const filters = ["all", "beginner", "intermediate", "advanced"] as const;

export default function ChallengesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const progress = useLearnlyProgress();
  const completedIds = new Set(progress.completedIds);

  const filteredChallenges = useMemo(() => {
    if (filter === "all") {
      return codingChallenges;
    }

    return codingChallenges.filter((challenge) => challenge.difficulty === filter);
  }, [filter]);

  return (
    <div className="page-shell stack-lg">
      <section className="card fade-in fade-in-1 stack-md">
        <span className="section-label">Coding Practice</span>
        <h1 className="page-heading" style={{ fontSize: "clamp(1.9rem, 3vw, 2.8rem)" }}>
          Solve focused coding challenges
        </h1>
        <p className="page-copy">
          Move from quick beginner prompts to deeper JavaScript and Python exercises without
          leaving the app.
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
      </section>

      <section className="list-panel fade-in fade-in-2">
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
      </section>
    </div>
  );
}
