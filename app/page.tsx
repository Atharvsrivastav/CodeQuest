"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import ProgressBar from "@/components/ProgressBar";
import { codingChallenges, totalChallengeXp } from "@/lib/challenges";
import { useProgress } from "@/lib/useProgress";

const featureCards = [
  {
    href: "/adaptive-tutor",
    label: "Adaptive Quiz",
    title: "Adaptive Tutor",
    copy: "Answer a multilingual quiz that adjusts difficulty on the fly and explains each answer clearly."
  },
  {
    href: "/tutor",
    label: "Ask For Help",
    title: "AI Tutor",
    copy: "Get beginner-friendly coding guidance or switch to spoken-language practice without leaving the platform."
  },
  {
    href: "/code",
    label: "Prototype Fast",
    title: "Workspace",
    copy: "Jump into JavaScript, TypeScript, or Python and use AI to simulate console output while you iterate."
  },
  {
    href: "/dashboard",
    label: "See The Trend",
    title: "Dashboard",
    copy: "Track solved challenges, accuracy, and weak spots in one clean progress view."
  }
];

const quickStartCards = [
  {
    href: "/tutor?path=coding",
    label: "Coding Path",
    title: "Learn with the tutor",
    copy: "Choose a programming language and get explanations paced for beginners.",
    meta: "Step-by-step guidance"
  },
  {
    href: "/code",
    label: "Workspace",
    title: "Prototype an idea",
    copy: "Use the editor when you want a low-pressure space to test syntax and experiment.",
    meta: "JavaScript, TypeScript, Python"
  }
];

const practiceFlow = [
  {
    step: "01",
    title: "Start with one focused problem",
    copy: "Pick a challenge that matches your level instead of navigating a cluttered workspace."
  },
  {
    step: "02",
    title: "Ask for help without losing context",
    copy: "Use the tutor when you need a nudge, then jump back into the same practice loop."
  },
  {
    step: "03",
    title: "See progress in a way that feels rewarding",
    copy: "XP, streaks, and completion stay visible so each session feels like momentum."
  }
];

export default function HomePage() {
  const progress = useProgress();
  const completedIds = new Set(progress.completedIds);
  const recentChallenges = codingChallenges.slice(0, 4);
  const solvedCount = progress.completedIds.length;
  const completionRate = Math.round((solvedCount / Math.max(codingChallenges.length, 1)) * 100);
  const nextChallenge =
    codingChallenges.find((challenge) => !completedIds.has(challenge.id)) ?? codingChallenges[0];
  const javascriptCount = codingChallenges.filter((challenge) => challenge.language === "js").length;
  const pythonCount = codingChallenges.filter((challenge) => challenge.language === "python").length;
  const sectionMotion = (delay = 0) => ({
    initial: false as const,
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay, ease: "easeOut" as const }
  });

  return (
    <div className="page-shell stack-xl">
      <motion.section className="card hero-card stack-lg" {...sectionMotion(0.05)}>
        <div className="hero-grid hero-grid-home">
          <div className="stack-lg">
            <div className="stack-md">
              <span className="hero-kicker">Bright, focused practice</span>
              <h1 className="page-heading">
                Build coding confidence in a workspace that feels light, calm, and motivating.
              </h1>
              <p className="page-copy hero-copy">
                CodeQuest brings challenges, AI tutoring, and a live editor into one clean flow so
                learning feels less overwhelming and more rewarding every time you return.
              </p>
            </div>

            <div className="inline-cluster">
              <Link href="/challenges" className="btn btn-primary">
                Start Challenges
              </Link>
              <Link href="/code" className="btn btn-ghost">
                Open Workspace
              </Link>
            </div>

            <div className="hero-stat-strip">
              <div className="hero-stat-chip">
                <span className="section-label" style={{ marginBottom: 0 }}>
                  Solved
                </span>
                <strong>
                  {solvedCount}/{codingChallenges.length}
                </strong>
                <span>Challenges completed in your current track.</span>
              </div>
              <div className="hero-stat-chip">
                <span className="section-label" style={{ marginBottom: 0 }}>
                  XP Earned
                </span>
                <strong>{progress.xp}</strong>
                <span>Rewarded progress across your practice sessions.</span>
              </div>
              <div className="hero-stat-chip">
                <span className="section-label" style={{ marginBottom: 0 }}>
                  Current Streak
                </span>
                <strong>{progress.streak}</strong>
                <span>Keep the chain going with one small win today.</span>
              </div>
            </div>
          </div>

          <div className="hero-spotlight stack-md">
            <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
              <div className="stack-sm">
                <span className="section-label" style={{ marginBottom: 0 }}>
                  Learning Cockpit
                </span>
                <h2 style={{ margin: 0, fontSize: "1.9rem", letterSpacing: "-0.05em" }}>
                  One clean loop from practice to progress.
                </h2>
              </div>
              <span className="badge badge-blue">{completionRate}% complete</span>
            </div>

            <div className="hero-spotlight-grid">
              <div className="hero-spotlight-card">
                <span className="section-label" style={{ marginBottom: 0 }}>
                  Challenge Library
                </span>
                <strong>{codingChallenges.length}</strong>
                <span className="text-subtle">Curated coding exercises ready to solve.</span>
              </div>
              <div className="hero-spotlight-card">
                <span className="section-label" style={{ marginBottom: 0 }}>
                  Language Mix
                </span>
                <strong>
                  {javascriptCount} JS / {pythonCount} Py
                </strong>
                <span className="text-subtle">A balanced set of frontend and scripting practice.</span>
              </div>
            </div>

            <div className="hero-note stack-sm">
              <div className="row-meta">
                <span className="badge badge-green">Next up</span>
                <span className="text-subtle">{nextChallenge.title}</span>
              </div>
              <p className="page-copy">
                {nextChallenge.description}
              </p>
              <div className="row-meta">
                <span className={`badge ${nextChallenge.language === "python" ? "badge-amber" : "badge-blue"}`}>
                  {nextChallenge.language === "python" ? "Python" : "JavaScript"}
                </span>
                <span className="badge badge-gray">{nextChallenge.xp} XP reward</span>
              </div>
            </div>
          </div>
        </div>

        <ProgressBar value={progress.xp} max={totalChallengeXp} label="XP runway" />
      </motion.section>

      <motion.section className="split-grid" {...sectionMotion(0.12)}>
        <div className="list-panel stack-sm">
          <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
            <div className="stack-sm">
              <p className="section-label">Challenge Track</p>
              <h2 style={{ margin: 0, letterSpacing: "-0.04em" }}>Recent challenges</h2>
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

        <div className="card stack-sm">
          <div className="stack-sm">
            <span className="section-label">Quick Start</span>
            <h2 style={{ margin: 0, letterSpacing: "-0.04em" }}>Choose the kind of session you want</h2>
            <p className="page-copy">
              The interface stays simple on purpose, so you can start a guided lesson or open the
              workspace without feeling lost.
            </p>
          </div>

          <div className="quick-start-grid">
            {quickStartCards.map((card) => (
              <Link href={card.href} className="quick-start-card" key={card.href}>
                <p className="section-label">{card.label}</p>
                <h3>{card.title}</h3>
                <p className="page-copy">{card.copy}</p>
                <div className="quick-start-meta">
                  <span className="badge badge-blue">{card.meta}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="split-grid" {...sectionMotion(0.18)}>
        <div className="list-panel stack-sm">
          <div className="stack-sm">
            <p className="section-label">Why It Feels Better</p>
            <h2 style={{ margin: 0, letterSpacing: "-0.04em" }}>The product now leads with clarity</h2>
          </div>

          <div className="insight-list">
            {practiceFlow.map((item) => (
              <div className="insight-item" key={item.step}>
                <span className="insight-step">{item.step}</span>
                <div className="insight-copy">
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card stack-md">
          <div className="stack-sm">
            <p className="section-label">Explore The Product</p>
            <h2 style={{ margin: 0, letterSpacing: "-0.04em" }}>Every major tool stays within reach</h2>
            <p className="page-copy">
              The app keeps the most useful surfaces close together so moving between practice,
              help, and review feels natural.
            </p>
          </div>

          <div className="quick-start-grid">
            {featureCards.map((card, index) => (
              <motion.div
                key={card.href}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.35, delay: 0.08 + index * 0.05, ease: "easeOut" }}
              >
                <Link href={card.href} className="quick-start-card">
                  <p className="section-label">{card.label}</p>
                  <h3>{card.title}</h3>
                  <p className="page-copy">{card.copy}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
