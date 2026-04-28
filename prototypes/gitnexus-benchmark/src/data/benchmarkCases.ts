export type Category =
  | "architecture"
  | "impact"
  | "execution-flow"
  | "refactoring"
  | "dependency"
  | "tracing";

export interface MethodStep {
  type: "command" | "file-read" | "manual-analysis";
  content: string;
}

export interface BenchmarkSide {
  approach: string;
  steps: MethodStep[];
  outputExcerpt: string;
  coverage: number;
  stepsCount: number;
  estimatedMinutes: number;
  missedItems: string[];
}

export interface BenchmarkCase {
  id: string;
  num: number;
  title: string;
  query: string;
  category: Category;
  tool: string;
  without: BenchmarkSide;
  with: BenchmarkSide;
  verdict: string;
  note?: string;
}

const placeholder: BenchmarkSide = {
  approach: "",
  steps: [],
  outputExcerpt: "",
  coverage: 0,
  stepsCount: 0,
  estimatedMinutes: 0,
  missedItems: [],
};

export const benchmarkCases: BenchmarkCase[] = [
  {
    id: "case-01",
    num: 1,
    title: "Symbol callers",
    query: "What components call AppShell?",
    category: "architecture",
    tool: "",
    without: {
      approach: "grep for AppShell across .tsx/.ts files, then read callers to distinguish shared vs local",
      steps: [
        { type: "command", content: "grep -rn \"AppShell\" . --include=\"*.tsx\" --include=\"*.ts\" -l" },
        { type: "file-read", content: "prototypes/island-algorithms-visualizer/src/App.tsx" },
        { type: "manual-analysis", content: "App.tsx imports from @/components/layout/AppShell (local path alias), not from @proto-portal/layout-primitives — the local component shadows the shared one" },
      ],
      outputExcerpt: `shared/layout-primitives/src/AppShell.tsx:10: export function AppShell({
shared/layout-primitives/src/index.ts:1: export { AppShell, ScrollViewport } from "./AppShell";
island-algorithms-visualizer/src/App.tsx:1: import { AppShell } from "@/components/layout/AppShell";
island-algorithms-visualizer/src/App.tsx:6:   return <AppShell />;
island-algorithms-visualizer/src/components/layout/AppShell.tsx:14: export function AppShell() {`,
      coverage: 85,
      stepsCount: 3,
      estimatedMinutes: 3,
      missedItems: [
        "Cannot confirm no other prototype lazily imports or dynamically references AppShell",
        "Cannot determine which prototypes declare @proto-portal/layout-primitives as a dep but don't yet use AppShell",
      ],
    },
    with: {
      approach: "gitnexus_context({name: 'AppShell'}) → disambiguate → context by UID for each",
      steps: [
        { type: "command", content: "gitnexus_context({name: 'AppShell'})" },
        { type: "command", content: "gitnexus_context({uid: 'Function:shared/layout-primitives/src/AppShell.tsx:AppShell'})" },
        { type: "command", content: "gitnexus_context({uid: 'Function:prototypes/island-algorithms-visualizer/src/components/layout/AppShell.tsx:AppShell'})" },
      ],
      outputExcerpt: `Disambiguation returned 2 candidates (score 0.56 each):
  - Function:shared/layout-primitives/src/AppShell.tsx:AppShell (line 9)
  - Function:prototypes/island-algorithms-visualizer/src/components/layout/AppShell.tsx:AppShell (line 13)

Shared AppShell: incoming={}, outgoing={}, processes=[]
Local AppShell: incoming={}, outgoing.calls=[useResponsiveMode], processes=[]`,
      coverage: 30,
      stepsCount: 3,
      estimatedMinutes: 0.5,
      missedItems: [
        "All caller edges are absent — incoming is empty for both symbols despite App.tsx importing the local AppShell",
        "No execution flows registered for either AppShell",
        "Graph disambiguates the two symbols correctly but cannot answer 'who calls AppShell'",
      ],
    },
    verdict: "The graph correctly disambiguates shared vs. local AppShell in one step (grep needed manual file inspection), but it failed to surface any caller edges — incoming was empty for both symbols, so grep delivered the actual answer and the graph did not.",
  },
  {
    id: "case-02",
    num: 2,
    title: "Blast radius",
    query: "What breaks if I change the shared design tokens?",
    category: "impact",
    tool: "",
    without: {
      approach: "grep for @proto-portal/design-tokens across all file types, then classify CSS vs TS consumers",
      steps: [
        { type: "command", content: "grep -rn \"@proto-portal/design-tokens\" . --include=\"*.ts\" --include=\"*.tsx\" --include=\"*.json\" --include=\"*.css\" --include=\"*.js\" | grep -v node_modules" },
        { type: "manual-analysis", content: "Classify results: CSS @import consumers vs TS baseTailwindConfig consumers vs token-object importers vs package.json declarations" },
        { type: "manual-analysis", content: "CSS consumers: learning-path, home-lending-learning, documentation-explorer, code-dojo-deprecated frontend, portfolio root src/index.css. TS consumers: root tailwind.config.ts, ffx-skill-map, learning-path, documentation-explorer, home-lending-learning, code-dojo-deprecated tailwind configs; ffx-skill-map design-system/index.ts; mcp-server-design-tokens resources/tools/prompts. Package.json deps: ai-integration-visualizer, research-workspace, shared/ui-components." },
      ],
      outputExcerpt: `tailwind.config.ts:2: import { baseTailwindConfig } from "@proto-portal/design-tokens";
prototypes/learning-path/src/index.css:1: @import "@proto-portal/design-tokens/css/tokens.css";
prototypes/ffx-skill-map/tailwind.config.ts:2: import { baseTailwindConfig } from "@proto-portal/design-tokens";
prototypes/ffx-skill-map/src/design-system/index.ts:16: } from "@proto-portal/design-tokens";
shared/ui-components/package.json:13: "@proto-portal/design-tokens": "workspace:*",
shared/mcp-servers/design-tokens/src/resources.ts:22: } from "@proto-portal/design-tokens";
apps/code-dojo-deprecated/frontend/src/index.css:5: @import "@proto-portal/design-tokens/css/tokens.css";`,
      coverage: 70,
      stepsCount: 3,
      estimatedMinutes: 6,
      missedItems: [
        "Transitive consumers through @proto-portal/ui-components (which itself depends on design-tokens)",
        "Which specific CSS custom properties each consumer actually references at runtime",
        "Visual impact of changing individual token values vs. adding/removing tokens",
        "ai-integration-visualizer and research-workspace have package.json deps but didn't show source-level imports — unclear if they use CSS or TS exports",
      ],
    },
    with: {
      approach: "gitnexus_impact({target: 'baseTailwindConfig', direction: 'upstream'}) then ({direction: 'downstream'}); gitnexus_impact({target: 'tokens', direction: 'upstream'})",
      steps: [
        { type: "command", content: "gitnexus_impact({target: 'baseTailwindConfig', direction: 'upstream'})" },
        { type: "command", content: "gitnexus_impact({target: 'baseTailwindConfig', direction: 'downstream'})" },
        { type: "command", content: "gitnexus_impact({target: 'tokens', direction: 'upstream'})" },
      ],
      outputExcerpt: `baseTailwindConfig upstream: { impactedCount: 0, risk: 'LOW', byDepth: {} }
baseTailwindConfig downstream: { impactedCount: 0, risk: 'LOW', byDepth: {} }
tokens: ambiguous (8 candidates — MCP tools.ts, ai-builders tokens.ts, Python utils.py, etc.)
  None of the 8 candidates is the shared/design-tokens CSS file.`,
      coverage: 0,
      stepsCount: 3,
      estimatedMinutes: 0.4,
      missedItems: [
        "All tailwind.config.ts import sites for baseTailwindConfig (ffx-skill-map, learning-path, documentation-explorer, home-lending, code-dojo, portfolio root)",
        "All CSS @import consumers of @proto-portal/design-tokens/css/tokens.css",
        "Transitive consumers through @proto-portal/ui-components",
        "MCP server as consumer of design-tokens",
        "Graph has no IMPORTS edges for TypeScript config or CSS files — blast radius is completely invisible",
      ],
    },
    verdict: "Grep wins decisively: the graph returned 0 impacted symbols for baseTailwindConfig in both directions, while grep found 10+ direct consumers across CSS, TS, and package.json — the graph has no import edges for configuration or CSS files.",
  },
  {
    id: "case-03",
    num: 3,
    title: "Execution trace",
    query:
      "Trace the full path from user clicking Play to the canvas rendering a new frame in island-algorithms",
    category: "execution-flow",
    tool: "",
    without: {
      approach: "File-by-file read from ControlDock through store, playback hook, step materialization, and canvas component",
      steps: [
        { type: "file-read", content: "prototypes/island-algorithms-visualizer/src/components/controls/ControlDock.tsx" },
        { type: "manual-analysis", content: "Play button onClick calls togglePlay() from useVisualizerStore" },
        { type: "file-read", content: "prototypes/island-algorithms-visualizer/src/store/useVisualizerStore.ts" },
        { type: "manual-analysis", content: "togglePlay() → play() → set({ isPlaying: true }); stepForward() increments currentIndex" },
        { type: "file-read", content: "prototypes/island-algorithms-visualizer/src/hooks/usePlayback.ts" },
        { type: "manual-analysis", content: "usePlayback useEffect watches isPlaying; when true, starts requestAnimationFrame loop that calls stepForward() at fps-controlled intervals" },
        { type: "file-read", content: "prototypes/island-algorithms-visualizer/src/components/canvas/VisualizerCanvas.tsx" },
        { type: "manual-analysis", content: "VisualizerCanvas calls useStepMaterialization() which is a useMemo on currentIndex → materializeCells() → cells array passed to Scene2D/Scene3D inside @react-three/fiber Canvas" },
        { type: "file-read", content: "prototypes/island-algorithms-visualizer/src/hooks/useStepMaterialization.ts" },
      ],
      outputExcerpt: `ControlDock.tsx:8: const togglePlay = useVisualizerStore((s) => s.togglePlay);
ControlDock.tsx:29: onClick={togglePlay}
useVisualizerStore.ts:115: togglePlay: () => (get().isPlaying ? get().pause() : get().play()),
useVisualizerStore.ts:109: play: () => { ... set({ isPlaying: true }); }
usePlayback.ts:20-28: RAF tick → acc += elapsed; while (acc >= frameMs) { stepForward(); }
useVisualizerStore.ts:117: set({ currentIndex: currentIndex + 1 });
useStepMaterialization.ts:17: return useMemo(() => { const cells = materializeCells(grid, state); ... })
VisualizerCanvas.tsx:15: const { cells, step } = useStepMaterialization();
VisualizerCanvas.tsx:30: <Canvas ...> → <Scene2D grid={grid} cells={cells} ... />`,
      coverage: 75,
      stepsCount: 9,
      estimatedMinutes: 12,
      missedItems: [
        "materializeCells() implementation in @/lib/step-state — how cells get their color/state values",
        "Scene2D.tsx and Scene3D.tsx — how cells are converted to Three.js geometry",
        "@react-three/fiber internal render loop — how Canvas triggers a new WebGL frame",
        "PostFX component — post-processing pass added after scene render",
      ],
    },
    with: {
      approach: "gitnexus_query for process, then gitnexus_context on usePlayback, VisualizerCanvas, useStepMaterialization, materializeCells",
      steps: [
        { type: "command", content: "gitnexus_query({query: 'user clicks play canvas render island algorithms visualizer'})" },
        { type: "command", content: "gitnexus_context({name: 'usePlayback'})" },
        { type: "command", content: "gitnexus_context({name: 'VisualizerCanvas'})" },
        { type: "command", content: "gitnexus_context({name: 'useStepMaterialization'})" },
        { type: "command", content: "gitnexus_context({name: 'materializeCells'})" },
      ],
      outputExcerpt: `gitnexus_query: { processes: [], process_symbols: [], definitions: [] }  ← no results

usePlayback: incoming.calls=[App], outgoing={}
VisualizerCanvas: outgoing.calls=[useStepMaterialization, useResponsiveMode]
  processes: [proc_28 "VisualizerCanvas → IndexOf3D" step 1/5, proc_63 "VisualizerCanvas → RoleFromCode" step 1/4]

useStepMaterialization: incoming.calls=[StatusReadout, VisitedTrail, StepContextBand,
  PseudocodeBlock, DataStructurePanel, VisualizerCanvas]; outgoing.calls=[initialStepState, materializeCells]
materializeCells: outgoing.calls=[roleFromCode]`,
      coverage: 55,
      stepsCount: 5,
      estimatedMinutes: 0.6,
      missedItems: [
        "togglePlay → isPlaying → RAF loop chain: usePlayback has no outgoing edges in graph",
        "The process query returned empty — no named flow for the playback path exists",
        "Process resource URIs (proc_28, proc_63) returned 'not found' — process names are heuristic labels, not resolvable IDs",
        "Scene2D / Scene3D and the Three.js/WebGL render call — not in graph",
        "@react-three/fiber Canvas render trigger — not in graph",
      ],
    },
    verdict: "The graph surfaced the downstream fan-out of useStepMaterialization (6 consumers) and the materializeCells → roleFromCode chain that grep missed, but failed to trace the playback trigger path (togglePlay → RAF loop) at all — no process query matched and the outgoing edges on usePlayback were absent.",
  },
  {
    id: "case-04",
    num: 4,
    title: "Package consumers",
    query: "Which prototypes and apps import @proto-portal/layout-primitives?",
    category: "dependency",
    tool: "",
    without: {
      approach: "grep for @proto-portal/layout-primitives across package.json and source files",
      steps: [
        { type: "command", content: "grep -rn \"@proto-portal/layout-primitives\" . --include=\"*.json\" --include=\"*.tsx\" --include=\"*.ts\" | grep -v node_modules" },
        { type: "manual-analysis", content: "Only match is the package's own package.json name field — no prototype or app declares it as a dependency, and no source file imports from it" },
      ],
      outputExcerpt: `shared/layout-primitives/package.json:2: "name": "@proto-portal/layout-primitives",
(no other matches)`,
      coverage: 95,
      stepsCount: 2,
      estimatedMinutes: 1,
      missedItems: [
        "Cannot rule out a prototype that imports via a re-export or path alias that doesn't include the literal package name string",
      ],
    },
    with: {
      approach: "gitnexus_cypher MATCH (f:File)-[r:CodeRelation {type:'IMPORTS'}]->(t:File) WHERE t.filePath CONTAINS 'layout-primitives'",
      steps: [
        { type: "command", content: "gitnexus_cypher({query: \"MATCH (f:File)-[r:CodeRelation {type: 'IMPORTS'}]->(t:File) WHERE t.path CONTAINS 'layout-primitives' RETURN DISTINCT f.path ORDER BY f.path\"})" },
        { type: "command", content: "gitnexus_cypher({query: \"MATCH (f:File)-[r:CodeRelation {type: 'IMPORTS'}]->(t:File) WHERE t.filePath CONTAINS 'layout-primitives' RETURN DISTINCT f.filePath ORDER BY f.filePath\"})" },
      ],
      outputExcerpt: `First attempt failed: "Binder exception: Table IMPORTS does not exist."
Second attempt (corrected property name):
| f.filePath |
| --- |
| shared/layout-primitives/src/index.ts |
(1 row — the package's own index.ts importing from AppShell.tsx internally)`,
      coverage: 90,
      stepsCount: 2,
      estimatedMinutes: 0.3,
      missedItems: [
        "Required a schema correction step (path vs filePath) that grep did not",
        "Cannot distinguish a package.json dep that doesn't yet have source-level imports (same gap as grep)",
      ],
    },
    verdict: "Near-tie: both tools correctly identify zero external consumers of @proto-portal/layout-primitives, but grep reached that answer in one step while Cypher required a schema correction retry — and grep also scanned package.json declarations as a bonus.",
    note: "",
  },
  {
    id: "case-05",
    num: 5,
    title: "Safe rename",
    query: "If I rename useVisualizerStore, what files would need to change?",
    category: "refactoring",
    tool: "",
    without: {
      approach: "grep for useVisualizerStore across .tsx/.ts files, enumerate all matches",
      steps: [
        { type: "command", content: "grep -rn \"useVisualizerStore\" . --include=\"*.tsx\" --include=\"*.ts\" | grep -v node_modules | grep -v benchmarkCases" },
        { type: "manual-analysis", content: "19 files total: 1 definition (store/useVisualizerStore.ts) + 18 import sites across components, hooks, and controls — all in island-algorithms-visualizer" },
      ],
      outputExcerpt: `src/store/useVisualizerStore.ts:47: export const useVisualizerStore = create<StoreState>(...)
src/components/layout/AppShell.tsx:2: import { useVisualizerStore } from "@/store/useVisualizerStore";
src/components/layout/CodexPanel.tsx:3: import { useVisualizerStore } from "@/store/useVisualizerStore";
src/components/canvas/VisualizerCanvas.tsx:3: import { useVisualizerStore } from "@/store/useVisualizerStore";
src/components/controls/ControlDock.tsx:3: import { useVisualizerStore } from "@/store/useVisualizerStore";
src/hooks/usePlayback.ts:2: import { useVisualizerStore } from "@/store/useVisualizerStore";
src/hooks/useStepMaterialization.ts:2: import { useVisualizerStore } from "@/store/useVisualizerStore";
... (12 more import sites)`,
      coverage: 95,
      stepsCount: 2,
      estimatedMinutes: 2,
      missedItems: [
        "Test files that might reference the store name as a string literal (e.g., in mocks or snapshots)",
        "Dynamic import() calls using the name as a string — none observed but not exhaustively confirmed",
      ],
    },
    with: {
      approach: "gitnexus_context({name: 'useVisualizerStore'}) then gitnexus_rename({symbol_name: 'useVisualizerStore', new_name: 'useIslandStore', dry_run: true})",
      steps: [
        { type: "command", content: "gitnexus_context({name: 'useVisualizerStore'})" },
        { type: "command", content: "gitnexus_rename({symbol_name: 'useVisualizerStore', new_name: 'useIslandStore', dry_run: true})" },
      ],
      outputExcerpt: `context: { uid: "Const:...useVisualizerStore.ts:useVisualizerStore", kind: "Const",
  incoming: {}, outgoing: {}, processes: [] }

rename dry-run: { files_affected: 0, total_edits: 0, graph_edits: 0,
  text_search_edits: 0, changes: [], applied: false }`,
      coverage: 0,
      stepsCount: 2,
      estimatedMinutes: 0.4,
      missedItems: [
        "All 18 import sites across components, hooks, and controls — the rename tool found none",
        "The symbol is indexed as kind 'Const' and has no IMPORTS/CALLS edges — the graph cannot map its consumers",
        "Zustand store references (imported via named export) are not tracked as CALLS edges",
      ],
    },
    verdict: "Grep wins completely: the graph found the symbol definition but produced 0 rename edits because the Zustand store export has no tracked CALLS or IMPORTS edges — grep's 18-file list was accurate and the graph-guided rename would have been silent and incorrect.",
  },
  {
    id: "case-06",
    num: 6,
    title: "API key trace",
    query:
      "Trace the Claude API key from its environment variable to the actual HTTP request",
    category: "tracing",
    tool: "",
    without: {
      approach: "grep for CLAUDE_API_KEY to find files, then read claude-service.js to trace full resolution and HTTP call chain",
      steps: [
        { type: "command", content: "grep -rn \"CLAUDE_API_KEY\" . --include=\"*.ts\" --include=\"*.js\" --include=\"*.py\" -l | grep -v node_modules" },
        { type: "file-read", content: "shared/api/src/services/claude-service.js" },
        { type: "manual-analysis", content: "Constructor: this.apiKey = apiKey || process.env.CLAUDE_API_KEY. getClaudeApiKey(): returns this.apiKey if set; if AWS_SECRETS_ENABLED=false returns process.env.CLAUDE_API_KEY; otherwise calls AWS Secrets Manager GetSecretValueCommand for secret 'prod/proto-portal/claude-api-key'. Resolved key passed as 'x-api-key' header in node-fetch POST to https://api.anthropic.com/v1/messages." },
      ],
      outputExcerpt: `claude-service.js:7: this.apiKey = apiKey || process.env.CLAUDE_API_KEY;
claude-service.js:8: this.apiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
claude-service.js:33: if (process.env.AWS_SECRETS_ENABLED === 'false') return process.env.CLAUDE_API_KEY;
claude-service.js:38: const command = new GetSecretValueCommand({ SecretId: this.secretName });
claude-service.js:42: const response = await this.secretsClient.send(command);
claude-service.js:45: return secret.apiKey || secret.CLAUDE_API_KEY;
claude-service.js:100: const response = await fetch(this.apiUrl, {
claude-service.js:104: 'x-api-key': requestApiKey,`,
      coverage: 80,
      stepsCount: 3,
      estimatedMinutes: 4,
      missedItems: [
        "How the env var is injected into the process in production (ECS task definition, SSM Parameter Store, or .env file)",
        "Which code path instantiates ClaudeService and whether a key is passed at construction vs. resolved lazily",
        "Whether ANTHROPIC_API_KEY is accepted as an alias anywhere (only CLAUDE_API_KEY observed in this service)",
      ],
    },
    with: {
      approach: "gitnexus_context({name: 'ClaudeService'}) then gitnexus_context({uid: 'Method:...ClaudeService.getClaudeApiKey#0'})",
      steps: [
        { type: "command", content: "gitnexus_query({query: 'Claude API key ANTHROPIC_API_KEY environment variable HTTP request'})" },
        { type: "command", content: "gitnexus_context({name: 'ClaudeService'})" },
        { type: "command", content: "gitnexus_context({uid: 'Method:shared/api/src/services/claude-service.js:ClaudeService.getClaudeApiKey#0'})" },
      ],
      outputExcerpt: `gitnexus_query: { processes: [], process_symbols: [], definitions: [] }

ClaudeService: incoming.calls=[documentation.js, ai-analysis.js]
  incoming.imports=[documentation.js, ai-analysis.js]
  outgoing.has_method=[constructor, getClaudeApiKey, analyzeSkills, analyzeJustInTimeRequest,
    assessHomeLendingUnderstanding, analyzeDocumentationQuestionWithFiles, ...]

getClaudeApiKey: incoming.calls=[analyzeSkills, analyzeJustInTimeRequest,
  assessHomeLendingUnderstanding, analyzeDocumentationQuestionWithFiles]
  outgoing={}  ← env var / AWS Secrets chain not in graph`,
      coverage: 50,
      stepsCount: 3,
      estimatedMinutes: 0.3,
      missedItems: [
        "The env var resolution and AWS Secrets Manager chain inside getClaudeApiKey — outgoing edges are absent",
        "process.env.CLAUDE_API_KEY and AWS_SECRETS_ENABLED branch logic not represented",
        "Production injection path (ECS task definition / SSM) not surfaced",
        "gitnexus_query returned empty — no execution flow named for this path",
      ],
    },
    verdict: "The graph added value grep missed: it immediately surfaced which 4 methods call getClaudeApiKey and which 2 route files instantiate ClaudeService — but the internal key-resolution chain (env var → AWS Secrets → x-api-key header) was invisible because the method's outgoing edges were empty.",
  },
];
