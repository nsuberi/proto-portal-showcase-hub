import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BenchmarkCase } from "@/data/benchmarkCases";
import { MethodPanel } from "./MethodPanel";
import { ScoreBar } from "./ScoreBar";

const CATEGORY_LABELS: Record<BenchmarkCase["category"], string> = {
  architecture: "Architecture",
  impact: "Impact Analysis",
  "execution-flow": "Execution Flow",
  refactoring: "Refactoring",
  dependency: "Dependencies",
  tracing: "Tracing",
};

interface CaseCardProps {
  bench: BenchmarkCase;
}

export function CaseCard({ bench }: CaseCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
      <button
        className="flex w-full items-start gap-4 px-6 py-5 text-left hover:bg-[color:var(--surface-2)] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="mt-0.5 shrink-0 font-mono text-xs font-semibold text-[color:var(--accent)]">
          {String(bench.num).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-[color:var(--text)]">
              {bench.title}
            </span>
            <span className="rounded-full border border-[color:var(--border)] px-2 py-0.5 font-mono text-[10px] text-[color:var(--text-mid)] uppercase tracking-wide">
              {CATEGORY_LABELS[bench.category]}
            </span>
          </div>
          <p className="font-mono text-sm text-[color:var(--text-mid)] italic">
            &ldquo;{bench.query}&rdquo;
          </p>
        </div>

        <div className="ml-4 hidden shrink-0 items-center gap-6 sm:flex">
          <CoveragePill value={bench.without.coverage} color="var(--amber)" />
          <CoveragePill value={bench.with.coverage} color="var(--emerald)" />
        </div>

        <ChevronDown
          className="ml-2 mt-0.5 shrink-0 text-[color:var(--text-mid)] transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          size={16}
        />
      </button>

      {expanded && (
        <div className="border-t border-[color:var(--border)] px-6 pb-6 pt-5">
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <MethodPanel side="without" data={bench.without} />
            <MethodPanel side="with" data={bench.with} />
          </div>

          <div className="mb-5 space-y-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
            <ScoreBar
              label="Coverage"
              withoutValue={bench.without.coverage}
              withValue={bench.with.coverage}
            />
            <ScoreBar
              label="Steps required"
              withoutValue={bench.without.stepsCount}
              withValue={bench.with.stepsCount}
              unit=""
              lowerIsBetter
            />
            <ScoreBar
              label="Time (minutes)"
              withoutValue={bench.without.estimatedMinutes}
              withValue={bench.with.estimatedMinutes}
              unit="m"
              lowerIsBetter
            />
          </div>

          <div className="rounded-lg bg-[color:var(--surface-2)] px-4 py-3">
            <span className="mr-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[color:var(--accent)]">
              Verdict
            </span>
            <span className="text-sm text-[color:var(--text)]">{bench.verdict}</span>
          </div>

          {bench.note && (
            <p className="mt-3 text-xs text-[color:var(--text-mid)] italic">
              Note: {bench.note}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function CoveragePill({ value, color }: { value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-sm font-semibold" style={{ color }}>
        {value}%
      </div>
      <div className="text-[10px] text-[color:var(--text-dim)]">coverage</div>
    </div>
  );
}
