type ProgressBarProps = {
  value: number;
  max: number;
  compact?: boolean;
  label?: string;
};

export default function ProgressBar({
  value,
  max,
  compact = false,
  label
}: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const percentage = Math.min(100, Math.round((value / safeMax) * 100));

  return (
    <div className="stack-sm">
      {(label || !compact) && (
        <div className="inline-cluster" style={{ justifyContent: "space-between" }}>
          <span className="text-muted">{label ?? "Progress"}</span>
          <span className="mono text-subtle">
            {value}/{max}
          </span>
        </div>
      )}
      <div className="progress-track" aria-label={label ?? "Progress"}>
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
