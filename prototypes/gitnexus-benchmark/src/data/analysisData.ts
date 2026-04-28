export type FindingSeverity = "fixable" | "structural" | "caveat";

export interface SetupFinding {
  id: string;
  title: string;
  severity: FindingSeverity;
  affectedCases: string[];
  symptom: string;
  rootCause: string;
  fix: string | null;
  source: string;
}

export const setupFindings: SetupFinding[] = [
  {
    id: "embeddings-off",
    title: "Embeddings not generated — gitnexus_query non-functional",
    severity: "fixable",
    affectedCases: ["case-03", "case-06"],
    symptom:
      "Every gitnexus_query call returned { processes: [], process_symbols: [], definitions: [] } in under 60ms, including BM25-only queries for exact symbol names like 'togglePlay' and 'CLAUDE_API_KEY'.",
    rootCause:
      "The --embeddings flag is off by default. Without it, the semantic vector component is disabled. BM25 also fails because auto-generated process names ('VisualizerCanvas → IndexOf3D') don't contain the natural language terms being searched. Reciprocal Rank Fusion of two empty result sets is empty — so gitnexus_query is effectively non-functional on this index.",
    fix: "npx gitnexus analyze --force --embeddings\n\nThe --force flag skips the early-exit-if-HEAD-matches check. Embeddings are preserved across subsequent non-embedding runs, so this only needs to run once.",
    source: "gitnexus-cli SKILL.md (--embeddings flag); ARCHITECTURE.md (hybrid BM25 + vector RRF ranking); benchmark observation (all query calls returned empty)",
  },
  {
    id: "jsx-not-calls",
    title: "JSX component invocations not tracked as CALLS edges",
    severity: "structural",
    affectedCases: ["case-01", "case-03"],
    symptom:
      "AppShell and VisualizerCanvas both have incoming: {} despite being rendered in parent components. React hooks called as regular functions (useStepMaterialization, useResponsiveMode) do have CALLS edges. The asymmetry is consistent: hooks yes, components no.",
    rootCause:
      "The tree-sitter CALLS extractor recognizes direct function call syntax (foo(), foo(bar)) but not JSX element syntax (<Foo />, <Foo bar={x} />). JSX compiles to React.createElement(Foo, ...) at runtime, but tree-sitter parses source before compilation. Component call graphs in React codebases are therefore invisible to the graph.",
    fix: null,
    source: "ARCHITECTURE.md (tree-sitter call extraction); benchmark observation (useStepMaterialization had 6 incoming hook callers; AppShell had 0 JSX callers)",
  },
  {
    id: "css-not-indexed",
    title: "CSS files not indexed — design-token CSS consumers invisible",
    severity: "structural",
    affectedCases: ["case-02"],
    symptom:
      "gitnexus_impact on baseTailwindConfig returned 0 results in both directions. Grep found 5+ CSS files using @import \"@proto-portal/design-tokens/css/tokens.css\". The entire CSS consumer graph is absent.",
    rootCause:
      "GitNexus uses tree-sitter grammars for 13 supported languages. CSS has no registered tree-sitter grammar in the current version. CSS @import statements produce no File nodes or IMPORTS edges. The CSS side of the design-token blast radius is structurally invisible.",
    fix: null,
    source: "ARCHITECTURE.md (13 supported languages via tree-sitter, CSS not listed); npm README language table",
  },
  {
    id: "const-not-callable",
    title: "const exports not indexed as callable symbols",
    severity: "structural",
    affectedCases: ["case-05"],
    symptom:
      "useVisualizerStore was indexed as kind 'Const' with incoming: {} and outgoing: {}. gitnexus_rename returned { files_affected: 0, total_edits: 0 }. Grep found 18 import sites. The rename tool's text_search fallback also returned 0 — it did not fall back when the graph had no edges.",
    rootCause:
      "Only functions, classes, methods, and interfaces are indexed as first-class graph nodes with edge traversal. A const whose value is a callable (Zustand pattern: export const useStore = create<State>(...)) is not recognized as a CALLS target. Components importing and calling useVisualizerStore(selector) produce no CALLS edges into the const. This makes Zustand, Jotai, and similar state-library patterns effectively opaque to impact analysis and rename.",
    fix: "No flag-based fix. A workaround is to wrap the store in an explicit function export: export function useVisualizerStore<T>(selector: (s: State) => T) { return store(selector); } — but this changes the API surface.",
    source: "ARCHITECTURE.md ('only functions, classes, methods, and interfaces are indexed as nodes'); benchmark observation (kind: 'Const', 0 edges, 0 rename edits)",
  },
  {
    id: "tailwind-config-no-nodes",
    title: "TypeScript config files don't create graph nodes",
    severity: "structural",
    affectedCases: ["case-02"],
    symptom:
      "tailwind.config.ts files across 4+ prototypes all import baseTailwindConfig from @proto-portal/design-tokens, but none appear as consumers in impact analysis. The TS side of the design-token blast radius is as invisible as the CSS side.",
    rootCause:
      "The GitNexus documentation states that tsconfig.json and toolchain config files are read only to resolve module path aliases — they don't generate symbol nodes or edges. By extension, tailwind.config.ts is treated as configuration scaffolding rather than indexable source. Import edges from config files to shared packages are not emitted.",
    fix: null,
    source: "ARCHITECTURE.md ('language toolchain config parsing... only in the sense of reading them to resolve paths and module aliases'); benchmark observation (0 upstream impact for baseTailwindConfig)",
  },
  {
    id: "process-uri-mismatch",
    title: "Process resource URI requires name, not the ID returned by context()",
    severity: "caveat",
    affectedCases: ["case-03"],
    symptom:
      "context() returned processes with IDs like proc_28_visualizercanvas and step metadata. ReadMcpResourceTool with URI gitnexus://repo/proto-portal-showcase-hub/process/proc_28_visualizercanvas returned 'Process not found'. The processes resource lists names like 'VisualizerCanvas → IndexOf3D'.",
    rootCause:
      "The context() tool exposes internal numeric/slug IDs (proc_28_...) but the resource URI system uses the human-readable heuristic process name. These are separate namespaces. The skill docs say gitnexus://repo/{name}/process/{processName} — processName means the full label string, not the internal ID. The correct URI would be gitnexus://repo/proto-portal-showcase-hub/process/VisualizerCanvas → IndexOf3D.",
    fix: "Read gitnexus://repo/{name}/processes first to get the exact name string, then use that string in the process resource URI. Do not use the proc_XX_... IDs from context() for resource URIs.",
    source: "gitnexus-guide SKILL.md (resource table: 'process/{processName}'); benchmark observation (proc_28_visualizercanvas URI returned not-found)",
  },
  {
    id: "barrel-imports-sparse",
    title: "IMPORTS edges sparse across barrel re-export chains",
    severity: "structural",
    affectedCases: ["case-01", "case-04"],
    symptom:
      "shared/layout-primitives/src/AppShell.tsx (exported via index.ts barrel) had zero incoming edges. The Cypher query for layout-primitives consumers found only the barrel's own internal import of AppShell. Direct imports of the local AppShell (App.tsx → AppShell.tsx, no barrel) also had no incoming edge.",
    rootCause:
      "The TypeScript IMPORTS resolver uses a 'named' strategy that tracks explicit named imports. The architecture docs note that re-exports through index barrels (export * from './AppShell') 'may not resolve at full confidence' through the three-tier resolution system. Additionally, the direct App.tsx → AppShell import gap suggests IMPORTS-to-symbol edges may be missing more broadly — the graph may track file-level IMPORTS but not resolve them to the specific Function node being imported.",
    fix: "npx gitnexus analyze --force may help clear stale partial edge data. The barrel gap may be a fundamental limitation of the current resolver confidence thresholds.",
    source: "ARCHITECTURE.md ('named strategy... re-exports through index barrels or export * from chains may not resolve at full confidence'); benchmark observation (zero incoming edges on both shared and local AppShell)",
  },
];

export const SEVERITY_META: Record<
  FindingSeverity,
  { label: string; colorVar: string; bgVar: string }
> = {
  fixable: {
    label: "Fixable now",
    colorVar: "var(--emerald)",
    bgVar: "var(--emerald-glow)",
  },
  structural: {
    label: "Structural limit",
    colorVar: "var(--amber)",
    bgVar: "var(--amber-glow)",
  },
  caveat: {
    label: "Workflow caveat",
    colorVar: "var(--accent)",
    bgVar: "var(--accent-glow)",
  },
};
