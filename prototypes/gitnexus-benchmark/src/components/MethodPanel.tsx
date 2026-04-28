import type { BenchmarkSide } from "@/data/benchmarkCases";

interface MethodPanelProps {
  side: "without" | "with";
  data: BenchmarkSide;
}

export function MethodPanel({ side, data }: MethodPanelProps) {
  const isWithout = side === "without";
  const accent = isWithout ? "var(--amber)" : "var(--emerald)";
  const label = isWithout ? "WITHOUT GITNEXUS" : "WITH GITNEXUS";

  return (
    <div
      className="flex flex-col rounded-lg border bg-[color:var(--surface-2)] p-4"
      style={{ borderColor: `color-mix(in srgb, ${accent} 25%, var(--border))` }}
    >
      <div
        className="mb-3 font-mono text-[10px] tracking-widest font-semibold"
        style={{ color: accent }}
      >
        {label}
      </div>

      <div className="mb-3 text-sm font-medium text-[color:var(--text)]">
        {data.approach}
      </div>

      {data.steps.length > 0 && (
        <div className="mb-4 space-y-1">
          {data.steps.map((step, i) => (
            <div
              key={i}
              className="rounded bg-[color:var(--bg)] px-3 py-1.5 font-mono text-xs text-[color:var(--text-mid)]"
            >
              {step.type === "command" && (
                <span className="mr-2 text-[color:var(--text-dim)]">$</span>
              )}
              {step.content}
            </div>
          ))}
        </div>
      )}

      {data.outputExcerpt && (
        <div className="mb-4 flex-1 rounded border border-[color:var(--border)] bg-[color:var(--bg)] p-3 font-mono text-xs leading-relaxed text-[color:var(--text-mid)] whitespace-pre-wrap">
          {data.outputExcerpt}
        </div>
      )}

      {data.missedItems.length > 0 && (
        <div className="mt-auto">
          <div className="mb-1 text-[10px] font-mono text-[color:var(--amber)] uppercase tracking-wide">
            Missed
          </div>
          <ul className="space-y-0.5">
            {data.missedItems.map((item, i) => (
              <li key={i} className="font-mono text-xs text-[color:var(--text-mid)]">
                <span className="mr-1.5 text-[color:var(--amber)]">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
