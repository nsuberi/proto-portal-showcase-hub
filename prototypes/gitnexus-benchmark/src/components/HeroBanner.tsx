const CODEBASE_STATS = {
  nodes: 12333,
  edges: 17545,
  flows: 195,
};

export function HeroBanner() {
  return (
    <header className="border-b border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-12 md:px-12 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 font-mono text-xs tracking-widest text-[color:var(--accent)] uppercase">
          Code Intelligence Report
        </div>
        <h1 className="mb-4 font-display text-3xl font-bold text-[color:var(--text)] md:text-4xl">
          GitNexus Benchmark
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-[color:var(--text-mid)] leading-relaxed">
          Six code intelligence queries answered two ways: Claude Code using
          only grep and file reads, then with the GitNexus knowledge graph MCP
          active. A direct comparison of what a structured code index gives an
          AI assistant.
        </p>

        <div className="flex flex-wrap gap-6">
          <Stat label="Nodes indexed" value={CODEBASE_STATS.nodes.toLocaleString()} />
          <Stat label="Relationships" value={CODEBASE_STATS.edges.toLocaleString()} />
          <Stat label="Execution flows" value={CODEBASE_STATS.flows.toLocaleString()} />
        </div>

        <div className="mt-8 flex items-center gap-6 text-sm">
          <Legend color="var(--amber)" label="Without GitNexus" />
          <Legend color="var(--emerald)" label="With GitNexus" />
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-xl font-semibold text-[color:var(--accent)]">{value}</div>
      <div className="text-xs text-[color:var(--text-mid)]">{label}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-[color:var(--text-mid)]">{label}</span>
    </div>
  );
}
