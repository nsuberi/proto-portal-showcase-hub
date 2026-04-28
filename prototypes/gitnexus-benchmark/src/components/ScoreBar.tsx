interface ScoreBarProps {
  label: string;
  withoutValue: number;
  withValue: number;
  unit?: string;
  lowerIsBetter?: boolean;
}

export function ScoreBar({
  label,
  withoutValue,
  withValue,
  unit = "%",
  lowerIsBetter = false,
}: ScoreBarProps) {
  const max = lowerIsBetter
    ? Math.max(withoutValue, withValue)
    : 100;

  const withoutPct = lowerIsBetter
    ? (withoutValue / max) * 100
    : withoutValue;

  const withPct = lowerIsBetter
    ? (withValue / max) * 100
    : withValue;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-[color:var(--text-mid)]">
        <span>{label}</span>
        <div className="flex gap-4">
          <span style={{ color: "var(--amber)" }}>
            {withoutValue}{unit}
          </span>
          <span style={{ color: "var(--emerald)" }}>
            {withValue}{unit}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded-full bg-[color:var(--surface-2)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${withoutPct}%`,
              background: "var(--amber)",
              opacity: 0.7,
            }}
          />
        </div>
        <div className="h-1.5 w-full rounded-full bg-[color:var(--surface-2)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${withPct}%`,
              background: "var(--emerald)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
