"use client";

import { motion } from "framer-motion";

type DonutChartProps = {
  value: number;
  total: number;
  label: string;
  caption: string;
};

export default function DonutChart({ value, total, label, caption }: DonutChartProps) {
  const normalizedTotal = Math.max(total, 1);
  const clampedValue = Math.min(Math.max(value, 0), normalizedTotal);
  const percent = Math.round((clampedValue / normalizedTotal) * 100);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / normalizedTotal) * circumference;

  return (
    <motion.article
      className="dashboard-chart-card stack-md"
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="stack-sm">
        <span className="section-label">{label}</span>
        <p className="text-subtle" style={{ margin: 0 }}>
          {caption}
        </p>
      </div>

      <div className="dashboard-donut-wrap">
        <svg className="dashboard-donut" viewBox="0 0 120 120" role="img" aria-label={label}>
          <circle cx="60" cy="60" r={radius} className="dashboard-donut-track" />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            className="dashboard-donut-fill"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="dashboard-donut-center">
          <strong>{percent}%</strong>
          <span className="text-subtle">
            {clampedValue}/{normalizedTotal}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
