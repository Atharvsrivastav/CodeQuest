"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import DonutChart from "@/components/dashboard/DonutChart";
import HorizontalBarChart from "@/components/dashboard/HorizontalBarChart";
import MetricCard from "@/components/dashboard/MetricCard";
import { buildDashboardSummary, type DashboardSummary } from "@/lib/dashboard";
import { useProgress } from "@/lib/useProgress";

export default function DashboardPage() {
  const progress = useProgress();
  const [summary, setSummary] = useState<DashboardSummary>(() => buildDashboardSummary(progress));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);

      try {
        const response = await fetch("/api/dashboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(progress),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Unable to load dashboard summary.");
        }

        const data = (await response.json()) as DashboardSummary;
        setSummary(data);
      } catch {
        if (!controller.signal.aborted) {
          setSummary(buildDashboardSummary(progress));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [progress]);

  const difficultyChartData = useMemo(
    () =>
      summary.difficultyAccuracy.map((item) => ({
        label: item.difficulty[0].toUpperCase() + item.difficulty.slice(1),
        value: item.accuracyPercent,
        caption: `${item.solved} solved, ${item.attempts} attempts`
      })),
    [summary.difficultyAccuracy]
  );

  const weakTopicChartData = useMemo(
    () =>
      summary.weakTopics.map((item) => ({
        label: item.topic,
        value: item.errorRatePercent,
        caption: `${item.attempts} attempts`
      })),
    [summary.weakTopics]
  );
  const sectionMotion = (delay = 0) => ({
    initial: false as const,
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay, ease: "easeOut" as const }
  });

  return (
    <div className="page-shell stack-lg">
      <motion.section className="card stack-sm" {...sectionMotion(0.05)}>
        <span className="section-label">Dashboard</span>
        <h1 className="page-heading" style={{ fontSize: "clamp(1.9rem, 3vw, 2.8rem)" }}>
          Personal performance snapshot
        </h1>
        <p className="page-copy">
          Track solved problems, accuracy, XP progress, and weak topics from one clean dashboard.
        </p>
        <p className="text-subtle" style={{ margin: 0 }}>
          {loading ? "Refreshing insights..." : "Insights are up to date."}
        </p>
      </motion.section>

      <motion.section className="dashboard-metric-grid" {...sectionMotion(0.12)}>
        <MetricCard
          label="Problems Solved"
          value={`${summary.solvedCount}/${summary.totalChallenges}`}
          caption={`${summary.solvedPercent}% completion`}
        />
        <MetricCard
          label="Accuracy"
          value={`${summary.accuracyPercent}%`}
          caption="Based on challenge test runs"
        />
        <MetricCard label="XP" value={`${summary.xp}`} caption="Total XP earned so far" />
        <MetricCard
          label="Weak Topics"
          value={`${summary.weakTopics.length}`}
          caption={
            summary.weakTopics.length
              ? `Top area: ${summary.weakTopics[0]?.topic ?? "n/a"}`
              : "No weak topics detected yet"
          }
        />
      </motion.section>

      <motion.section className="dashboard-chart-grid" {...sectionMotion(0.18)}>
        <DonutChart
          value={summary.solvedCount}
          total={summary.totalChallenges}
          label="Solved Progress"
          caption="Solved vs total challenges"
        />
        <HorizontalBarChart
          title="Accuracy By Difficulty"
          subtitle="Pass rate based on tracked attempts"
          data={difficultyChartData}
          emptyMessage="Run more tests to populate difficulty analytics."
        />
        <HorizontalBarChart
          title="Weak Topic Heatmap"
          subtitle="Higher values indicate higher error rate"
          data={weakTopicChartData}
          emptyMessage="Weak topics will appear after a few failed attempts."
        />
      </motion.section>
    </div>
  );
}
