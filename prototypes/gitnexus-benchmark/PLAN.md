# GitNexus Benchmark — Prototype Plan

## Concept

A research report prototype that benchmarks 6 code intelligence queries answered two ways:

- **Without GitNexus**: Claude Code using only grep + file reads (no MCP tools)
- **With GitNexus**: Claude Code using the GitNexus MCP (knowledge graph queries)

The story is what a structured code index gives an AI assistant — accuracy, completeness, confidence — measured against this codebase (12,333 nodes, 17,545 edges, 195 execution flows).

---

## The 6 Benchmark Cases

| # | Title | Query | Tool used |
|---|-------|-------|-----------|
| 1 | Symbol callers | "What components call AppShell?" | `gitnexus_context` |
| 2 | Blast radius | "What breaks if I change shared design tokens?" | `gitnexus_impact` |
| 3 | Execution trace | "Trace user input → canvas render in island-algorithms" | `gitnexus_query` + process resource |
| 4 | Package consumers | "Which prototypes import layout-primitives?" | `gitnexus_cypher` |
| 5 | Safe rename | "If I rename useVisualizerStore, what files change?" | `gitnexus_rename` (dry run) |
| 6 | API key flow | "Trace Claude API key from env to HTTP call" | `gitnexus_query` |

Case 4 is intentionally a near-tie — grep handles package.json scanning well. Honest results make the report credible.

---

## Scoring Per Case

| Metric | Description |
|--------|-------------|
| Coverage | % of true relationships surfaced (0–100) |
| Steps | Number of commands/queries required |
| Time | Estimated minutes |
| Missed items | Specific relationships/files the approach failed to surface |

---

## Data Collection Instructions (for next session)

For each case, execute the query both ways and record:

### Without GitNexus (Claude with grep/read only)
1. Describe the approach in plain English
2. List each command/file-read step
3. Paste the actual output excerpt
4. Estimate what % of the true answer was found
5. List what was missed

### With GitNexus (Claude with MCP active)
1. Write the exact MCP call signature
2. Paste the actual tool output excerpt
3. Note any unique insights the graph revealed
4. Record the step count (usually 1)

### Populate `src/data/benchmarkCases.ts`

Fill in the `benchmarkCases` array using the `BenchmarkCase` type already defined.
Each entry needs: `id`, `num`, `title`, `query`, `category`, `tool`, `without`, `with`, `verdict`, and optionally `note`.

---

## UI Architecture

```
src/
├── data/benchmarkCases.ts     typed data, populated in collection session
├── components/
│   ├── HeroBanner.tsx          stats, framing, legend
│   ├── CaseCard.tsx            expandable per-case with before/after panels
│   ├── MethodPanel.tsx         code block + output excerpt for one side
│   ├── ScoreBar.tsx            coverage/steps comparison bars
│   └── SummaryScorecard.tsx    aggregate table at bottom
├── styles/tokens.css           amber (without) + emerald (with) palette
└── App.tsx                     renders banner → cases → scorecard
```

---

## Monorepo Registration

- Port: 3013
- Base path: `/prototypes/gitnexus-benchmark/`
- Workspace: `@proto-portal/gitnexus-benchmark`
- Scripts: `dev:gitnexus-benchmark`, `build:gitnexus-benchmark`
- Proxy: registered in `scripts/dev-proxy.js`
- CLAUDE.md: added to ports table

---

## Next Steps

1. Start a fresh Claude Code session in this repo with GitNexus MCP active
2. Run the 6 benchmark queries (without GitNexus first, then with)
3. Populate `src/data/benchmarkCases.ts` with real data
4. Run `yarn workspace @proto-portal/gitnexus-benchmark dev` to see the report
5. Polish UI, then add to portfolio landing page card grid
