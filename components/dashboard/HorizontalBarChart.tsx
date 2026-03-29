"use client";

import { motion } from "framer-motion";

type BarDatum = {
  label: string;
  value: number;
  caption: string;
};

type HorizontalBarChartProps = {
  title: string;
  subtitle: string;
  data: BarDatum[];
  emptyMessage: string;
};

export default function HorizontalBarChart({
  title,
  subtitle,
  data,
  emptyMessage
}: HorizontalBarChartProps) {
  if (!data.length) {
    return (
      <motion.article
        className="dashboard-chart-card stack-md"
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="stack-sm">
          <span className="section-label">{title}</span>
          <p className="text-subtle" style={{ margin: 0 }}>
            {subtitle}
          </p>
        </div>
        <p className="text-subtle" style={{ margin: 0 }}>
          {emptyMessage}
        </p>
      </motion.article>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <motion.article
      className="dashboard-chart-card stack-md"
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="stack-sm">
        <span className="section-label">{title}</span>
        <p className="text-subtle" style={{ margin: 0 }}>
          {subtitle}
        </p>
      </div>

      <div className="dashboard-bar-grid">
        {data.map((item) => {
          const percent = Math.round((item.value / maxValue) * 100);

          return (
            <div key={item.label} className="dashboard-bar-row">
              <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
                <strong>{item.label}</strong>
                <span className="mono">{item.value}%</span>
              </div>
              <div className="dashboard-bar-track" aria-hidden="true">
                <motion.div
                  className="dashboard-bar-fill"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percent}%` }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                />
              </div>
              <p className="text-subtle" style={{ margin: 0 }}>
                {item.caption}
              </p>
            </div>
          );
        })}
      </div>
    </motion.article>
  );
}
