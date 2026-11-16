interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  /** Tailwind classes for the filled part. */
  barClassName?: string;
  className?: string;
}

/** Accessible progress bar (role="progressbar" with current/max values). */
export function ProgressBar({
  value,
  max,
  label,
  barClassName = "bg-ritual-accent",
  className = "h-1.5",
}: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const clamped = Math.max(0, Math.min(value, safeMax));
  const percent = Math.round((clamped / safeMax) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      aria-valuetext={`${clamped} / ${safeMax} (${percent}%)`}
      className={`w-full overflow-hidden rounded-full bg-zinc-800 ${className}`}
    >
      <div
        className={`h-full transition-all duration-500 ${barClassName}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
