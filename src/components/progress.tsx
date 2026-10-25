// A thin meter. `tone` is a status colour; callers always pair it with a text label.
export function Progress({
  value,
  max,
  tone = "accent",
}: {
  value: number;
  max: number;
  tone?: "accent" | "good" | "warning" | "critical";
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const color = {
    accent: "bg-accent",
    good: "bg-good",
    warning: "bg-warning",
    critical: "bg-critical",
  }[tone];

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
