"use client";

import { motion } from "framer-motion";

type MetricCardProps = {
  label: string;
  value: string;
  caption: string;
};

export default function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <motion.article
      className="dashboard-metric-card stack-sm"
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <span className="section-label" style={{ marginBottom: 0 }}>
        {label}
      </span>
      <p className="dashboard-metric-value">{value}</p>
      <p className="text-subtle" style={{ margin: 0 }}>
        {caption}
      </p>
    </motion.article>
  );
}
