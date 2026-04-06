# Flow Analysis Tools for Design Tokens MCP Server

## Context

The design-tokens MCP server (`shared/mcp-servers/design-tokens/`) currently provides 7 tools for working with tokens, themes, contrast, and components. We're adding **flow analysis** capabilities: Playwright-powered screenshot capture of user flows, structured narrative write-up about information hierarchy and CTAs for a specific persona/JTBD, and before/after comparison support.

The immediate use case is analyzing Code Dojo flows for the "aspiring AI builder" persona, but the tools are generic. The Codecademy screenshots at `apps/code-dojo/project-scoping/Codecademy web Nov 2025/` serve as the reference framework for how to identify information hierarchy patterns (urgency banner → hero CTA → value prop → social proof → content discovery).

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `shared/mcp-servers/design-tokens/src/flow-tools.ts` | 3 new tool definitions + handlers |
| `shared/mcp-servers/design-tokens/src/utils/flow-capture.ts` | Playwright browser lifecycle, step execution, screenshot capture |

### Modified Files

| File | Change |
|------|--------|
| `shared/mcp-servers/design-tokens/src/tools.ts` | Import flow tools, merge into ListTools and CallTool handlers |
| `shared/mcp-servers/design-tokens/src/prompts.ts` | Add `flow_analysis` prompt (5th prompt) |
| `shared/mcp-servers/design-tokens/package.json` | Add `playwright` dependency |

### Unchanged Files

`server.ts`, `resources.ts`, `index.ts`, `utils/color-theory.ts` — no changes needed.

## Implementation

### Step 1: Add Playwright dependency

Add `"playwright": "^1.54.1"` to `shared/mcp-servers/design-tokens/package.json` dependencies. Run `yarn install`. Run `npx playwright install chromium` to get the browser binary.

### Step 2: Create `utils/flow-capture.ts`

Encapsulates all Playwright logic. Exports one main function:

```typescript
export interface FlowStep {
  action: "navigate" | "click" | "scroll" | "type" | "wait" | "screenshot_only";
  label: string;
  url?: string;
  selector?: string;
  text?: string;
  scroll_y?: number;
  wait_ms?: number;
  timeout_ms?: number;
}

export interface CaptureOptions {
  flowName: string;
  baseUrl: string;
  steps: FlowStep[];
  viewport?: { width: number; height: number };
  outputDir: string;
  phase: string;
}

export interface StepResult {
  label: string;
  action: string;
  url: string;
  screenshotPath: string;
  screenshotBase64: string;
  durationMs: number;
  error?: string;
}

export interface CaptureResult {
  timestamp: string;       // YYYY-MM-DD_HHmmss
  screenshotDir: string;
  steps: StepResult[];
  totalDurationMs: number;
}

export async function captureFlow(options: CaptureOptions): Promise<CaptureResult>;
```

Key decisions:
- **Dynamic import**: `const { chromium } = await import("playwright")` — server starts fine even if Playwright isn't installed; error surfaces only when tool is called
- **Launch-per-call**: Fresh headless Chromium per invocation, closed in `finally`. No stale state, no zombie processes
- **Viewport-only screenshots** (not fullPage): 1280x800 default. Matches what user sees; keeps image sizes reasonable for Claude's context (~100-500KB per PNG)
- **Step execution**: switch/case over action type. `navigate` uses `waitUntil: "domcontentloaded"` (not `networkidle` — SPAs with websockets may never reach networkidle). Each step wrapped in try/catch — errors are recorded but don't stop the flow
- **File layout**: `{outputDir}/{phase}/{flowName}/{timestamp}/step-{nn}-{slug}.png`

### Step 3: Create `flow-tools.ts`

Three tools exported as arrays + handler map, following the pattern in `tools.ts`:

#### Tool: `capture_flow`
- **Input**: `flow_name`, `base_url`, `steps[]` (action, label, url/selector/text/scroll_y/wait_ms), `viewport?`, `output_dir?` (default: `<repo>/flow-analysis/`), `phase?` (before/after/exploratory)
- **Returns**: Per step — one `{ type: "text" }` with metadata + one `{ type: "image", data: base64, mimeType: "image/png" }` with screenshot. Final text summary with file paths and timing.

#### Tool: `write_flow_narrative`
- **Input**: `flow_name`, `phase`, `persona`, `jtbd`, `narrative_markdown`, `output_dir?`, `capture_timestamp?`
- **Action**: Writes Markdown file with YAML frontmatter to `{output_dir}/{flow_name}/{flow_name}-{phase}.md`
- **Frontmatter**: flow, phase, persona, jtbd, date, capture_timestamp, screenshots_dir (relative path)
- **Returns**: Confirmation with file path

#### Tool: `compare_flow_narratives`
- **Input**: `flow_name`, `before_path?`, `after_path?`, `include_screenshots?` (default false), `output_dir?`
- **Action**: Reads both narrative files. If `include_screenshots` is true, also loads and returns screenshots from both captures.
- **Returns**: Both narratives as text content, optionally with image content. Includes a structured template for Claude to write the comparison.

### Step 4: Wire flow tools into `tools.ts`

Minimal modification to `tools.ts`:

1. Import from `flow-tools.ts`:
   ```typescript
   import { flowToolDefinitions, handleFlowToolCall } from "./flow-tools.js";
   ```

2. In `ListToolsRequestSchema` handler — spread flow tools into the array:
   ```typescript
   tools: [ ...existingTools, ...flowToolDefinitions ]
   ```

3. In `CallToolRequestSchema` handler — add fallback before the `default` case:
   ```typescript
   default: {
     const flowResult = await handleFlowToolCall(name, args);
     if (flowResult) return flowResult;
     return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
   }
   ```

This keeps the refactor minimal — no structural changes to tools.ts, just 3 additions.

### Step 5: Add `flow_analysis` prompt to `prompts.ts`

A new prompt that teaches Claude the analytical framework. Arguments: `persona` (required), `jtbd` (required).

The prompt covers:

1. **Information Hierarchy Analysis** — For each screenshot: what draws the eye (visual weight via size/color/contrast/position), reading flow (does scan path match priority?), CTA prominence rating (primary/secondary/tertiary)
2. **CTA-to-JTBD Mapping** — For each CTA: what action it promises, how it serves the persona's JTBD, is the label specific enough, is it positioned at the right moment
3. **Flow Coherence** — Across all steps: progressive disclosure, dead ends, narrative arc (hook → orient → activate)
4. **Reference Patterns from Codecademy** — Landing hierarchy (urgency → hero CTA → value prop → social proof), dashboard hierarchy (resume learning → weekly target → catalog), CTA patterns (yellow = primary action, "Resume" > "Explore"), progress patterns (bars, rings, streaks, XP)
5. **Output Format** — Structured Markdown template: Flow Overview, Step-by-Step Analysis (first impression, hierarchy, CTAs, strengths, gaps per step), Flow Coherence, CTA Effectiveness table, Recommendations

### Step 6: Build and verify

```bash
yarn workspace @proto-portal/mcp-server-design-tokens build
node shared/mcp-cli/dist/cli.js info design-tokens
# Should show 10 tools, 5 prompts, 14 resources
```

## Intended Workflow (for Claude + user)

### Before analysis (baseline)
1. User asks Claude to analyze a flow
2. Claude calls `flow_analysis` prompt to get the analytical framework
3. Claude calls `capture_flow` with phase "before", gets screenshots back as images
4. Claude analyzes the screenshots using the framework
5. Claude calls `write_flow_narrative` to save the baseline narrative

### After implementation (comparison)
1. User makes UI changes
2. Claude calls `capture_flow` with phase "after"
3. Claude calls `compare_flow_narratives` to load both narratives
4. Claude writes comparison analysis
5. Claude calls `write_flow_narrative` with the comparison (or writes to a separate comparison file)

## Verification

1. Build: `yarn workspace @proto-portal/mcp-server-design-tokens build` compiles without errors
2. Info: `node shared/mcp-cli/dist/cli.js info design-tokens` shows 10 tools, 5 prompts
3. Capture test: Start Code Dojo (`cd apps/code-dojo && python3 app.py`), then use Claude to call `capture_flow` with 2-3 steps against `http://localhost:5002`
4. Narrative test: Call `write_flow_narrative` and verify the Markdown file is written to `flow-analysis/` at repo root
5. Existing tools: Verify `get_tokens`, `review_contrast`, etc. still work (regression check)
