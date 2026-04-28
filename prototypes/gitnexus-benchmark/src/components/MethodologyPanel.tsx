import {
  dataCollectionSteps,
  methodologyFlaws,
  FLAW_SEVERITY_META,
  type MethodologyFlaw,
} from "@/data/methodologyData";

export function MethodologyPanel() {
  const critical = methodologyFlaws.filter((f) => f.severity === "critical");
  const moderate = methodologyFlaws.filter((f) => f.severity === "moderate");
  const minor = methodologyFlaws.filter((f) => f.severity === "minor");

  return (
    <section className="mx-auto max-w-4xl px-6 pb-20 pt-4 md:px-12">
      <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-[color:var(--accent)]">
        Methodology
      </div>
      <h2 className="mb-3 text-2xl font-bold text-[color:var(--text)]">
        How this data was collected — and why you should be skeptical of it
      </h2>
      <p className="mb-10 max-w-2xl text-[color:var(--text-mid)] leading-relaxed">
        Full candor on the test design. The data collection process has several
        structural flaws that limit what conclusions can be drawn. These are not
        minor caveats — two of them are severe enough to invalidate specific
        case comparisons outright.
      </p>

      {/* Data collection process */}
      <div className="mb-10 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
        <div className="border-b border-[color:var(--border)] px-5 py-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[color:var(--text-mid)]">
            How the data was collected
          </h3>
        </div>
        <div className="divide-y divide-[color:var(--border)]">
          {dataCollectionSteps.map((step, i) => (
            <div key={i} className="flex gap-4 px-5 py-4">
              <div className="mt-0.5 shrink-0 font-mono text-xs text-[color:var(--accent)]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="mb-1 text-sm font-semibold text-[color:var(--text)]">
                  {step.label}
                </div>
                <p className="text-sm text-[color:var(--text-mid)] leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flaw groups */}
      <FlawGroup title="Critical flaws" flaws={critical} />
      <FlawGroup title="Moderate flaws" flaws={moderate} />
      <FlawGroup title="Minor flaws" flaws={minor} />

      {/* Bottom line */}
      <div className="mt-10 rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] px-6 py-5">
        <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-[color:var(--text-mid)]">
          Bottom line
        </div>
        <p className="text-sm text-[color:var(--text-mid)] leading-relaxed">
          The benchmark as run answers one question reliably: what happens when
          you use GitNexus without generating embeddings, against a moderately
          familiar codebase, on cases favorable to graph analysis. It does not
          answer whether GitNexus outperforms grep in practice. Cases 03 and 06
          need to be re-run with{" "}
          <code className="rounded bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs text-[color:var(--emerald)]">
            --embeddings
          </code>{" "}
          before any comparison is valid. A trustworthy benchmark would establish
          ground truth independently, measure time objectively, blind the WITH
          session to the WITHOUT results, and test on multiple codebases.
        </p>
      </div>
    </section>
  );
}

function FlawGroup({
  title,
  flaws,
}: {
  title: string;
  flaws: MethodologyFlaw[];
}) {
  if (flaws.length === 0) return null;
  const color = FLAW_SEVERITY_META[flaws[0].severity].colorVar;

  return (
    <div className="mb-8">
      <div
        className="mb-4 flex items-center gap-3"
        style={{ color }}
      >
        <span className="h-px flex-1 bg-current opacity-20" />
        <span className="font-mono text-xs font-semibold uppercase tracking-widest">
          {title}
        </span>
        <span className="h-px flex-1 bg-current opacity-20" />
      </div>
      <div className="space-y-3">
        {flaws.map((f) => (
          <FlawCard key={f.id} flaw={f} />
        ))}
      </div>
    </div>
  );
}

function FlawCard({ flaw }: { flaw: MethodologyFlaw }) {
  const meta = FLAW_SEVERITY_META[flaw.severity];

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
      <div className="flex flex-wrap items-start gap-3 border-b border-[color:var(--border)] px-5 py-4">
        <span
          className="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: meta.colorVar, background: meta.bgVar }}
        >
          {meta.label}
        </span>
        <h3 className="text-sm font-semibold text-[color:var(--text)] leading-snug">
          {flaw.title}
        </h3>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-[color:var(--text-mid)] leading-relaxed">
          {flaw.body}
        </p>
      </div>
    </div>
  );
}
