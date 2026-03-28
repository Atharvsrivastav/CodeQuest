"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { diffBadge, languageLessons } from "@/lib/data";
import { useLearnlyProgress } from "@/lib/useProgress";

const filters = ["All", "Spanish", "French", "German", "Japanese"] as const;

export default function LanguagesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const progress = useLearnlyProgress();
  const completedIds = new Set(progress.completedIds);

  const filteredLessons = useMemo(() => {
    if (filter === "All") {
      return languageLessons;
    }

    return languageLessons.filter((lesson) => lesson.lang === filter);
  }, [filter]);

  return (
    <div className="page-shell stack-lg">
      <section className="card fade-in fade-in-1 stack-md">
        <span className="section-label">Language Practice</span>
        <h1 className="page-heading" style={{ fontSize: "clamp(1.9rem, 3vw, 2.8rem)" }}>
          Build spoken-language fluency in short sessions
        </h1>
        <p className="page-copy">
          Practice vocabulary, greetings, travel phrases, and reading fundamentals across multiple
          languages.
        </p>
        <div className="pill-row">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={`pill ${filter === item ? "pill-active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="list-panel fade-in fade-in-2">
        {filteredLessons.map((lesson) => {
          const completed = completedIds.has(lesson.id);

          return (
            <Link href={`/languages/${lesson.id}`} className="list-row" key={lesson.id}>
              <div className="list-row-main">
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{lesson.flag}</span>
                <div className="list-row-copy">
                  <h2 className="list-row-title">
                    {lesson.lang} · {lesson.topic}
                  </h2>
                  <p className="list-row-desc">{lesson.description}</p>
                </div>
              </div>

              <div className="row-meta">
                <span className={`badge ${diffBadge[lesson.difficulty]}`}>
                  {lesson.difficulty}
                </span>
                <span className="badge badge-blue">{lesson.xp} XP</span>
                <span className={completed ? "badge badge-green" : "text-subtle"}>
                  {completed ? "Completed" : "→"}
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
