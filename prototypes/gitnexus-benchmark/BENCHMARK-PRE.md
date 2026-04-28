# Benchmark Session: PRE

## Your role

Answer 6 code intelligence questions about this codebase using only `grep`, `find`, and file reads — the Bash tool and the Read tool. Work honestly. If you can't find something, say so. Don't guess beyond what the tools show you.

---

## Output format

After all 6 cases, open `prototypes/gitnexus-benchmark/src/data/benchmarkCases.ts`. The 6 case skeletons are already there — fill in only the `without` field for each. Leave everything else as-is.

```ts
without: {
  approach: "one-line description of method used",
  steps: [
    { type: "command", content: "grep -rn ..." },
    { type: "file-read", content: "path/to/file.ts" },
    { type: "manual-analysis", content: "description of reasoning step" },
  ],
  outputExcerpt: `paste the most relevant raw output (~10 lines max)`,
  coverage: 70,           // honest estimate: % of the true answer you found
  stepsCount: 5,          // total steps taken
  estimatedMinutes: 4,    // realistic time for a developer doing this manually
  missedItems: [
    "specific thing you couldn't find or verify",
  ],
},
```

**On `coverage`**: be conservative. Finding surface results without verifying depth or transitive relationships is 60–70%. Exact-string search where completeness is high is 90%+.

---

## The 6 Cases

---

### Case 01 — Symbol callers
**Query:** "What components call AppShell?"

Record:
- Every file that imports or renders `AppShell`
- Whether the shared vs. local distinction is clear from search alone
- What you cannot determine (e.g. indirect callers, execution flows that pass through it)

---

### Case 02 — Blast radius
**Query:** "What breaks if I change the shared design tokens?"

The shared design tokens package is at `shared/design-tokens/`. It exports CSS (`css/tokens.css`, `css/utilities.css`) and TypeScript (`baseTailwindConfig`, plus color/spacing/typography token objects).

Record:
- Every direct consumer (prototype, app, shared package)
- Which consume CSS vs. TypeScript exports vs. both
- What you cannot determine: transitive consumers, which CSS custom properties are referenced where, runtime visual impact

---

### Case 03 — Execution trace
**Query:** "Trace the full path from user clicking Play to the canvas rendering a new frame in the island-algorithms visualizer"

Start from `prototypes/island-algorithms-visualizer/src/components/controls/ControlDock.tsx` and follow the chain through state management, any animation/playback hooks, and into the canvas rendering layer. Read files one at a time.

Record:
- The full chain you traced
- Where it became opaque (you can see a call but can't easily follow further)
- How many file reads it took
- Steps you had to skip or guess

---

### Case 04 — Package consumers
**Query:** "Which prototypes and apps import `@proto-portal/layout-primitives`?"

Record:
- Every consumer found
- Confidence the list is complete
- Note if this is a case where grep performs well

---

### Case 05 — Safe rename
**Query:** "If I rename `useVisualizerStore`, what files would need to change?"

Record:
- Every file that references it
- Confidence the list is complete
- Anything that might be dynamically referenced or string-interpolated that search would miss

---

### Case 06 — API key trace
**Query:** "Trace the Claude API key from its environment variable to the actual HTTP request"

The API server lives in `shared/api/`. The key is named `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY`.

Record:
- The full chain from env var to the HTTP call
- Which files are in the path
- What you couldn't determine without running the code (e.g. production secrets path vs. local `.env`)

---

## After all 6 cases

1. Fill in the `without` field for all 6 cases in `prototypes/gitnexus-benchmark/src/data/benchmarkCases.ts`
2. Run `yarn workspace @proto-portal/gitnexus-benchmark build` to confirm clean compile
