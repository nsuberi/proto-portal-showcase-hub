import type { BenchmarkCase } from "@/data/benchmarkCases";

interface SummaryScorecardProps {
  cases: BenchmarkCase[];
}

export function SummaryScorecard({ cases }: SummaryScorecardProps) {
  if (cases.length === 0) return null;

  const avgWithout =
    cases.reduce((s, c) => s + c.without.coverage, 0) / cases.length;
  const avgWith =
    cases.reduce((s, c) => s + c.with.coverage, 0) / cases.length;
  const totalStepsWithout = cases.reduce(
    (s, c) => s + c.without.stepsCount,
    0
  );
  const totalStepsWith = cases.reduce((s, c) => s + c.with.stepsCount, 0);

  return (
    <section className="mx-auto max-w-4xl px-6 py-12 md:px-12">
      <h2 className="mb-6 font-mono text-xs font-semibold uppercase tracking-widest text-[color:var(--accent)]">
        Summary
      </h2>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AggregateStat
          label="Avg coverage without"
          value={`${avgWithout.toFixed(0)}%`}
          color="var(--amber)"
        />
        <AggregateStat
          label="Avg coverage with"
          value={`${avgWith.toFixed(0)}%`}
          color="var(--emerald)"
        />
        <AggregateStat
          label="Total steps without"
          value={String(totalStepsWithout)}
          color="var(--amber)"
        />
        <AggregateStat
          label="Total steps with"
          value={String(totalStepsWith)}
          color="var(--emerald)"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[color:var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-2)]">
              <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-mid)]">
                Case
              </th>
              <th
                className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--amber)" }}
              >
                Coverage (–)
              </th>
              <th
                className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--emerald)" }}
              >
                Coverage (+)
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-mid)]">
                Steps (–/+)
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-mid)]">
                Verdict
              </th>
            </tr>
          </thead>
          <tbody>
            {cases.map((bench, i) => (
              <tr
                key={bench.id}
                className={`border-b border-[color:var(--border)] ${
                  i % 2 === 0 ? "bg-[color:var(--surface)]" : "bg-[color:var(--surface-2)]"
                }`}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-[color:var(--accent)] mr-2">
                    {String(bench.num).padStart(2, "0")}
                  </span>
                  <span className="text-[color:var(--text)]">{bench.title}</span>
                </td>
                <td
                  className="px-4 py-3 text-right font-mono text-sm font-semibold"
                  style={{ color: "var(--amber)" }}
                >
                  {bench.without.coverage}%
                </td>
                <td
                  className="px-4 py-3 text-right font-mono text-sm font-semibold"
                  style={{ color: "var(--emerald)" }}
                >
                  {bench.with.coverage}%
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[color:var(--text-mid)]">
                  {bench.without.stepsCount} / {bench.with.stepsCount}
                </td>
                <td className="px-4 py-3 text-sm text-[color:var(--text-mid)]">
                  {bench.verdict}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AggregateStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-center">
      <div className="font-mono text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-xs text-[color:var(--text-mid)]">{label}</div>
    </div>
  );
}
