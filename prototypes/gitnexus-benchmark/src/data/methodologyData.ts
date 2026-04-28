export interface MethodologyFlaw {
  id: string;
  title: string;
  severity: "critical" | "moderate" | "minor";
  body: string;
}

export interface DataCollectionStep {
  label: string;
  detail: string;
}

export const dataCollectionSteps: DataCollectionStep[] = [
  {
    label: "WITHOUT session (prior conversation)",
    detail:
      "A separate Claude Code session answered all six queries using only grep and file reads, with no GitNexus MCP active. The agent pre-filled the 'without' fields in benchmarkCases.ts — approach, steps, output excerpts, coverage, step count, time estimate, and missed items — before this session started.",
  },
  {
    label: "WITH session (this conversation)",
    detail:
      "This session read the pre-filled benchmarkCases.ts, then ran GitNexus MCP tools to answer the same six queries. The 'with' fields, verdicts, and setup analysis were all written by the same agent conducting the queries, with the without-side answers already visible.",
  },
  {
    label: "Measurement",
    detail:
      "No automated measurement was used. Coverage percentages, step counts, and time estimates were self-reported by the conducting agent in each session. There was no wall-clock timing, no correctness check against a verified answer, and no third-party evaluation.",
  },
];

export const methodologyFlaws: MethodologyFlaw[] = [
  {
    id: "misconfigured-tool",
    severity: "critical",
    title: "The tool under test was misconfigured for the entire session",
    body:
      "The --embeddings flag was never passed to npx gitnexus analyze. Without it, the semantic vector component of gitnexus_query is disabled, and BM25 alone fails because auto-generated process names contain no natural language terms. Every gitnexus_query call returned empty results. Cases 03 and 06 — the execution-trace and cross-file tracing cases most likely to show a graph advantage — produced zero process results. The current WITH data for those cases documents a broken configuration, not the tool's actual capability. A valid comparison has not been run.",
  },
  {
    id: "non-blind",
    severity: "critical",
    title: "The WITH session was not blind",
    body:
      "benchmarkCases.ts was read at the start of this session, exposing all six WITHOUT answers before a single MCP tool was called. Coverage scores were assigned relative to those answers, not against independently established ground truth. Verdicts were written knowing what story each case was expected to tell. This is a strong source of confirmation and framing bias throughout.",
  },
  {
    id: "no-ground-truth",
    severity: "critical",
    title: "No ground truth was independently established",
    body:
      "Coverage percentages measure how much of the WITHOUT answer the WITH session reproduced — not how much of the actual complete correct answer either session found. The WITHOUT session explicitly lists missed items in several cases, meaning its answers are also incomplete. The first session's output became the de facto gold standard by default, not by verification. Both sessions may have missed the same things, or different things, with no way to distinguish.",
  },
  {
    id: "self-reported-metrics",
    severity: "moderate",
    title: "Coverage and time are self-reported estimates with no measurement",
    body:
      "No wall-clock timing was measured. The estimatedMinutes values for both sides were assigned by the agent conducting each session. The WITHOUT session's times (3, 6, 12, 1, 2, 4 minutes) and the WITH session's times (0.3–0.6 minutes) convey false precision. The apparent WITH speed advantage on Cases 02 and 05 is partly because the tools failed immediately — a tool that returns wrong answers in 0.4 minutes is not faster than a tool that returns correct answers in 6 minutes.",
  },
  {
    id: "different-operators",
    severity: "moderate",
    title: "Different operators with different prior codebase knowledge",
    body:
      "The WITHOUT session's output excerpts cite specific file paths and line numbers without any exploration steps visible, suggesting prior familiarity with the codebase. This session came in cold. The WITHOUT session's efficiency and accuracy may reflect codebase familiarity, not grep's capability. This confounder was not controlled and is not noted in the per-case data.",
  },
  {
    id: "same-agent-judge",
    severity: "moderate",
    title: "The same agent ran the tools, scored itself, and wrote the failure analysis",
    body:
      "There was no separation between execution, evaluation, and post-hoc rationalization. The setup analysis section — which reframes poor tool results as 'known bounded limitations documented in the architecture' — was written by the same process that produced the poor results. Self-diagnosis of failure modes after the fact is structurally compromised, even when conducted in good faith.",
  },
  {
    id: "step-count-inverted",
    severity: "moderate",
    title: "Fewer steps is treated as better, even when steps failed",
    body:
      "The summary scorecard shows lower total step counts for 'With GitNexus' as if that represents efficiency. For Cases 02 and 05, the WITH session used fewer steps because the tools returned nothing and stopped. The WITHOUT session used more steps because it found real answers. The step count metric has the wrong polarity for failed cases.",
  },
  {
    id: "case-selection",
    severity: "minor",
    title: "Case selection was favorable to GitNexus, not adversarial",
    body:
      "The six cases were chosen to showcase what a knowledge graph should theoretically excel at: blast radius, execution traces, safe rename, package consumers. This is a best-case selection for the tool, not a stress-test. A more balanced benchmark would include cases designed to find failure modes alongside cases designed to find strengths.",
  },
  {
    id: "single-codebase",
    severity: "minor",
    title: "Single codebase, zero generalizability",
    body:
      "All six cases come from one TypeScript/React/Python monorepo of moderate size. GitNexus may perform differently on a large Java service, a Go microservices repo, a Python data pipeline, or any repo with different language or pattern distribution. One codebase, one run, proves nothing about whether these results generalize.",
  },
];

export const FLAW_SEVERITY_META: Record<
  MethodologyFlaw["severity"],
  { label: string; colorVar: string; bgVar: string }
> = {
  critical: {
    label: "Critical flaw",
    colorVar: "#ef4444",
    bgVar: "rgba(239, 68, 68, 0.10)",
  },
  moderate: {
    label: "Moderate flaw",
    colorVar: "var(--amber)",
    bgVar: "var(--amber-glow)",
  },
  minor: {
    label: "Minor flaw",
    colorVar: "var(--text-mid)",
    bgVar: "rgba(100, 116, 139, 0.10)",
  },
};
