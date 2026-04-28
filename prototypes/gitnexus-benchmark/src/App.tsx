import { HeroBanner } from "@/components/HeroBanner";
import { CaseCard } from "@/components/CaseCard";
import { SummaryScorecard } from "@/components/SummaryScorecard";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { MethodologyPanel } from "@/components/MethodologyPanel";
import { benchmarkCases } from "@/data/benchmarkCases";

export default function App() {
  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <HeroBanner />

      <main className="mx-auto max-w-4xl px-6 py-10 md:px-12">
        {benchmarkCases.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {benchmarkCases.map((bench) => (
              <CaseCard key={bench.id} bench={bench} />
            ))}
          </div>
        )}
      </main>

      <SummaryScorecard cases={benchmarkCases} />
      <AnalysisPanel cases={benchmarkCases} />
      <MethodologyPanel />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
      <div className="mb-3 font-mono text-xs uppercase tracking-widest text-[color:var(--accent)]">
        Data pending
      </div>
      <p className="text-[color:var(--text-mid)]">
        Benchmark cases will be populated in the data collection session.
      </p>
      <p className="mt-2 font-mono text-xs text-[color:var(--text-dim)]">
        src/data/benchmarkCases.ts
      </p>
    </div>
  );
}
