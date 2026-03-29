"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import ProgressBar from "@/components/ProgressBar";
import { codingChallenges, totalChallengeXp } from "@/lib/challenges";
import { useProgress } from "@/lib/useProgress";

const featureCards = [
  {
    href: "/tutor",
    title: "AI Tutor",
    copy: "Ask for hints, debugging help, and concept explanations without leaving the platform."
  },
  {
    href: "/code",
    title: "Editor",
    copy: "Prototype in JavaScript, TypeScript, and Python with AI-simulated console output."
  },
  {
    href: "/progress",
    title: "Progress",
    copy: "Track solved challenges, XP earned, and the remaining challenge backlog."
  }
];

export default function HomePage() {
  const progress = useProgress();
  const completedIds = new Set(progress.completedIds);
  const recentChallenges = codingChallenges.slice(0, 4);
  const solvedCount = progress.completedIds.length;
  const completionRate = Math.round((solvedCount / Math.max(codingChallenges.length, 1)) * 100);
  const sectionMotion = (delay = 0) => ({
    initial: false as const,
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay, ease: "easeOut" as const }
  });

  return (
    <div className="page-shell stack-lg">
      <motion.section className="card stack-lg" {...sectionMotion(0.05)}>
        <div className="stack-md">
          <span className="section-label">AI Coding Platform</span>
          <div className="hero-grid">
            <div className="stack-md">
              <h1 className="page-heading">Practice code with challenges, tutoring, and a live workspace.</h1>
              <p className="page-copy">
                CodeQuest keeps the entire experience centered on programming so learners can solve
                challenges, get AI guidance, and measure progress in one focused workflow.
              </p>
              <div className="inline-cluster">
                <Link href="/challenges" className="btn btn-primary">
                  Start Challenges
                </Link>
                <Link href="/tutor" className="btn btn-ghost">
                  Open Tutor
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
                <span className="badge badge-blue">{solvedCount} completed</span>
              </div>
              <p className="page-copy">
                Stay inside one coding loop: pick a challenge, ask for help when you need it, then
                track the XP you earn as you solve.
              </p>
              <div className="row-meta">
                <span className="badge badge-gray mono">{codingChallenges.length} challenges</span>
                <span className="badge badge-gray mono">{completionRate}% complete</span>
              </div>
            </div>
          </div>
        </div>

        {progress.xp > 0 && (
          <ProgressBar value={progress.xp} max={totalChallengeXp} label="Challenge XP progress" />
        )}
      </motion.section>

      <motion.section className="split-grid" {...sectionMotion(0.12)}>
        <div className="list-panel stack-sm">
          <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="section-label">Challenge Track</p>
              <h2 style={{ margin: 0, letterSpacing: "-0.03em" }}>Recent challenges</h2>
            </div>
            <Link href="/challenges" className="btn btn-ghost">
              Browse all
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

        <div className="list-panel stack-sm">
          <div className="stack-sm">
            <p className="section-label">Platform Focus</p>
            <h2 style={{ margin: 0, letterSpacing: "-0.03em" }}>Everything points back to coding practice</h2>
          </div>

          <div style={{ marginTop: "1rem" }} className="stack-md">
            <div className="list-row">
              <div className="list-row-copy">
                <h3 className="list-row-title">Challenge-first flow</h3>
                <p className="list-row-desc">
                  Home, tutor, and progress now revolve around coding challenge execution instead of
                  mixed learning tracks.
                </p>
              </div>
            </div>
            <div className="list-row">
              <div className="list-row-copy">
                <h3 className="list-row-title">AI help without context switching</h3>
                <p className="list-row-desc">
                  Use the dedicated tutor for concepts or the challenge-level tutor for targeted
                  nudges while staying in the same product.
                </p>
              </div>
            </div>
            <div className="list-row">
              <div className="list-row-copy">
                <h3 className="list-row-title">Progress that matches the product</h3>
                <p className="list-row-desc">
                  XP and completion rates now reflect coding challenges only, including migrated
                  local progress from the previous mixed app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className="feature-grid" {...sectionMotion(0.18)}>
        {featureCards.map((card, index) => (
          <motion.div
            key={card.href}
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.35, delay: 0.08 + index * 0.05, ease: "easeOut" }}
          >
            <Link href={card.href} className="feature-link">
              <p className="section-label">{card.title}</p>
              <h3 style={{ margin: "0 0 0.6rem", fontSize: "1.2rem", letterSpacing: "-0.03em" }}>
                {card.title}
              </h3>
              <p className="page-copy">{card.copy}</p>
            </Link>
          </motion.div>
        ))}
      </motion.section>
    </div>
  );
}
