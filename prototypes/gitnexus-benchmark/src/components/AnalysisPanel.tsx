import { setupFindings, SEVERITY_META, type SetupFinding } from "@/data/analysisData";
import type { BenchmarkCase } from "@/data/benchmarkCases";

interface AnalysisPanelProps {
  cases: BenchmarkCase[];
}

export function AnalysisPanel({ cases }: AnalysisPanelProps) {
  const caseMap = Object.fromEntries(cases.map((c) => [c.id, c]));

  const fixable = setupFindings.filter((f) => f.severity === "fixable");
  const structural = setupFindings.filter((f) => f.severity === "structural");
  const caveats = setupFindings.filter((f) => f.severity === "caveat");

  return (
    <section className="mx-auto max-w-4xl px-6 pb-20 pt-4 md:px-12">
      <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-[color:var(--accent)]">
        Setup Analysis
      </div>
      <h2 className="mb-3 text-2xl font-bold text-[color:var(--text)]">
        What's missing from the current implementation
      </h2>
      <p className="mb-10 max-w-2xl text-[color:var(--text-mid)] leading-relaxed">
        Post-benchmark research into the GitNexus architecture, CLI skill files,
        and published documentation identified seven gaps explaining the results.
        One is fixable by re-running the analyzer with an additional flag. The
        rest are structural limits of the current version.
      </p>

      <FindingGroup
        title="Fixable now"
        colorVar="var(--emerald)"
        findings={fixable}
        caseMap={caseMap}
      />
      <FindingGroup
        title="Structural limits"
        colorVar="var(--amber)"
        findings={structural}
        caseMap={caseMap}
      />
      <FindingGroup
        title="Workflow caveats"
        colorVar="var(--accent)"
        findings={caveats}
        caseMap={caseMap}
      />
    </section>
  );
}

function FindingGroup({
  title,
  colorVar,
  findings,
  caseMap,
}: {
  title: string;
  colorVar: string;
  findings: SetupFinding[];
  caseMap: Record<string, BenchmarkCase>;
}) {
  if (findings.length === 0) return null;

  return (
    <div className="mb-10">
      <div
        className="mb-4 flex items-center gap-3"
        style={{ color: colorVar }}
      >
        <span className="h-px flex-1 bg-current opacity-20" />
        <span className="font-mono text-xs font-semibold uppercase tracking-widest">
          {title}
        </span>
        <span className="h-px flex-1 bg-current opacity-20" />
      </div>
      <div className="space-y-4">
        {findings.map((f) => (
          <FindingCard key={f.id} finding={f} caseMap={caseMap} />
        ))}
      </div>
    </div>
  );
}

function FindingCard({
  finding,
  caseMap,
}: {
  finding: SetupFinding;
  caseMap: Record<string, BenchmarkCase>;
}) {
  const meta = SEVERITY_META[finding.severity];

  return (
    <div
      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 px-5 py-4 border-b border-[color:var(--border)]">
        <span
          className="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
          style={{
            color: meta.colorVar,
            background: meta.bgVar,
          }}
        >
          {meta.label}
        </span>
        <h3 className="text-sm font-semibold text-[color:var(--text)] leading-snug">
          {finding.title}
        </h3>
      </div>

      {/* Body */}
      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-[color:var(--border)] md:border-b-0 md:border-r px-5 py-4 space-y-4">
          <Field label="Symptom" text={finding.symptom} />
          <Field label="Root cause" text={finding.rootCause} />
          {finding.fix && <FixBlock fix={finding.fix} />}
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-mid)]">
              Affected cases
            </div>
            <div className="flex flex-wrap gap-2">
              {finding.affectedCases.map((cid) => {
                const c = caseMap[cid];
                return (
                  <span
                    key={cid}
                    className="rounded border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2 py-1 font-mono text-xs text-[color:var(--accent)]"
                  >
                    {c ? `${String(c.num).padStart(2, "0")} ${c.title}` : cid}
                  </span>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-mid)]">
              Verified by
            </div>
            <p className="text-xs text-[color:var(--text-mid)] leading-relaxed italic">
              {finding.source}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-mid)]">
        {label}
      </div>
      <p className="text-sm text-[color:var(--text-mid)] leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function FixBlock({ fix }: { fix: string }) {
  const lines = fix.split("\n");
  const hasCode = lines.length > 1;
  const [codeLine, ...rest] = lines;

  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--emerald)]">
        Fix
      </div>
      {hasCode ? (
        <div className="space-y-2">
          <pre className="rounded bg-[color:var(--surface-2)] border border-[color:var(--border)] px-3 py-2 font-mono text-xs text-[color:var(--emerald)] overflow-x-auto whitespace-pre-wrap">
            {codeLine}
          </pre>
          {rest.length > 0 && (
            <p className="text-sm text-[color:var(--text-mid)] leading-relaxed">
              {rest.join("\n").trim()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-[color:var(--text-mid)] leading-relaxed">
          {fix}
        </p>
      )}
    </div>
  );
}
