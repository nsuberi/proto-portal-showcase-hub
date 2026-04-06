/**
 * MCP tool definitions and handlers for flow analysis.
 *
 * Three tools:
 *   capture_flow          – Playwright screenshot capture of a user flow
 *   write_flow_narrative  – Persist a Markdown narrative to disk
 *   compare_flow_narratives – Read before/after narratives for comparison
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { captureFlow, type FlowStep } from "./utils/flow-capture.js";

// ── Repo root detection ──────────────────────────────────────────────────

function findRepoRoot(): string {
  let dir = resolve(import.meta.url.replace("file://", ""), "..");
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, ".git"))) return dir;
    dir = dirname(dir);
  }
  // Fallback: 4 levels up from src/ (shared/mcp-servers/design-tokens/src/)
  return resolve(import.meta.url.replace("file://", ""), "../../../../..");
}

const REPO_ROOT = findRepoRoot();

function defaultOutputDir(): string {
  return join(REPO_ROOT, "flow-analysis");
}

// ── Tool definitions (for ListToolsRequestSchema) ────────────────────────

export const flowToolDefinitions = [
  {
    name: "capture_flow",
    description:
      "Capture screenshots of a web flow using Playwright. Navigates through a sequence of steps (go to URL, click element, scroll, type text, wait) and takes a viewport screenshot after each step. Screenshots are saved to disk and returned as images for visual analysis. Launches headless Chromium.",
    inputSchema: {
      type: "object" as const,
      properties: {
        flow_name: {
          type: "string",
          description:
            "Short identifier for this flow (e.g., 'code-dojo-onboarding'). Used in file paths.",
        },
        base_url: {
          type: "string",
          description:
            "Base URL for the flow (e.g., 'http://localhost:5002'). Relative URLs in steps resolve against this.",
        },
        steps: {
          type: "array",
          description: "Ordered sequence of actions. A screenshot is taken after each step.",
          items: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["navigate", "click", "scroll", "type", "wait", "screenshot_only"],
                description:
                  "'navigate' goes to a URL. 'click' clicks a selector. 'scroll' scrolls to a selector or by pixels. 'type' fills an input. 'wait' pauses. 'screenshot_only' captures without action.",
              },
              label: {
                type: "string",
                description:
                  "Human-readable name for this step (e.g., 'Landing page hero'). Used in filenames and narrative.",
              },
              url: {
                type: "string",
                description: "URL for 'navigate' action. Can be relative to base_url.",
              },
              selector: {
                type: "string",
                description: "CSS or Playwright selector for click/scroll/type/wait.",
              },
              text: {
                type: "string",
                description: "Text to type (for 'type' action).",
              },
              scroll_y: {
                type: "number",
                description: "Pixels to scroll vertically (for 'scroll' without selector).",
              },
              wait_ms: {
                type: "number",
                description:
                  "Milliseconds to wait before screenshot (all actions) or duration (for 'wait' action). Default: 1000.",
              },
              timeout_ms: {
                type: "number",
                description: "Timeout for this step in ms. Default: 10000.",
              },
            },
            required: ["action", "label"],
          },
        },
        viewport: {
          type: "object",
          description: "Browser viewport size. Defaults to 1280x800.",
          properties: {
            width: { type: "number" },
            height: { type: "number" },
          },
        },
        output_dir: {
          type: "string",
          description:
            "Directory for screenshots. Defaults to '<repo>/flow-analysis/'. Created automatically.",
        },
        phase: {
          type: "string",
          enum: ["before", "after", "exploratory"],
          description:
            "'before' = baseline capture, 'after' = post-implementation, 'exploratory' = ad-hoc. Affects subdirectory. Default: 'exploratory'.",
        },
      },
      required: ["flow_name", "base_url", "steps"],
    },
  },
  {
    name: "write_flow_narrative",
    description:
      "Save a flow analysis narrative as a Markdown file with YAML frontmatter. Call this after analyzing screenshots from capture_flow. The narrative should cover information hierarchy, CTA mapping to persona JTBD, and flow coherence.",
    inputSchema: {
      type: "object" as const,
      properties: {
        flow_name: {
          type: "string",
          description: "Flow identifier matching the capture_flow flow_name.",
        },
        phase: {
          type: "string",
          enum: ["before", "after", "exploratory"],
          description: "Analysis phase.",
        },
        persona: {
          type: "string",
          description:
            "Target persona (e.g., 'Aspiring AI builder who wants to learn by doing').",
        },
        jtbd: {
          type: "string",
          description:
            "Job-to-be-done (e.g., 'Find a structured path from zero to shipping an AI-powered app').",
        },
        narrative_markdown: {
          type: "string",
          description:
            "Full Markdown narrative content (without frontmatter — frontmatter is generated from other fields).",
        },
        output_dir: {
          type: "string",
          description:
            "Directory for narrative files. Defaults to '<repo>/flow-analysis/'. Created automatically.",
        },
        capture_timestamp: {
          type: "string",
          description:
            "Timestamp from the capture session (e.g., '2026-04-05_143022'). Links narrative to specific screenshots.",
        },
      },
      required: ["flow_name", "phase", "persona", "jtbd", "narrative_markdown"],
    },
  },
  {
    name: "compare_flow_narratives",
    description:
      "Read before and after flow analysis narratives for comparison. Returns both narratives so you can synthesize a comparison highlighting changes in information hierarchy, CTA effectiveness, and flow coherence. Optionally loads associated screenshots.",
    inputSchema: {
      type: "object" as const,
      properties: {
        flow_name: {
          type: "string",
          description: "Flow identifier.",
        },
        before_path: {
          type: "string",
          description:
            "Path to 'before' narrative. If omitted, looks for '<output_dir>/<flow_name>/<flow_name>-before.md'.",
        },
        after_path: {
          type: "string",
          description:
            "Path to 'after' narrative. If omitted, looks for '<output_dir>/<flow_name>/<flow_name>-after.md'.",
        },
        include_screenshots: {
          type: "boolean",
          description:
            "If true, also return screenshots from both captures as images. Default: false.",
        },
        output_dir: {
          type: "string",
          description: "Base directory. Defaults to '<repo>/flow-analysis/'.",
        },
      },
      required: ["flow_name"],
    },
  },
];

// ── Tool result helpers ──────────────────────────────────────────────────

type ToolContent = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };
type ToolResult = { content: ToolContent[]; isError?: boolean };

function textContent(text: string): ToolContent {
  return { type: "text" as const, text };
}

function imageContent(base64: string): ToolContent {
  return { type: "image" as const, data: base64, mimeType: "image/png" };
}

function errorResult(msg: string): ToolResult {
  return { content: [textContent(msg)], isError: true };
}

// ── Tool handlers ────────────────────────────────────────────────────────

async function handleCaptureFlow(args: Record<string, unknown>): Promise<ToolResult> {
  const flowName = args.flow_name as string;
  const baseUrl = args.base_url as string;
  const steps = args.steps as FlowStep[];
  const viewport = args.viewport as { width: number; height: number } | undefined;
  const outputDir = (args.output_dir as string) || defaultOutputDir();
  const phase = (args.phase as string) || "exploratory";

  if (!flowName || !baseUrl || !steps?.length) {
    return errorResult("flow_name, base_url, and at least one step are required.");
  }

  try {
    const result = await captureFlow({ flowName, baseUrl, steps, viewport, outputDir, phase });

    const content: ToolContent[] = [];

    for (const step of result.steps) {
      // Metadata for this step
      const meta: Record<string, unknown> = {
        label: step.label,
        action: step.action,
        url: step.url,
        durationMs: step.durationMs,
        screenshotPath: step.screenshotPath,
      };
      if (step.error) meta.error = step.error;
      content.push(textContent(`### Step: ${step.label}\n\`\`\`json\n${JSON.stringify(meta, null, 2)}\n\`\`\``));

      // Screenshot image
      if (step.screenshotBase64) {
        content.push(imageContent(step.screenshotBase64));
      }
    }

    // Summary
    content.push(
      textContent(
        `\n---\n**Capture complete**: ${result.steps.length} steps in ${result.totalDurationMs}ms\n` +
          `**Screenshots saved to**: ${result.screenshotDir}\n` +
          `**Timestamp**: ${result.timestamp}\n` +
          `**Phase**: ${phase}\n\n` +
          `Use the \`flow_analysis\` prompt for a structured analytical framework, then call \`write_flow_narrative\` to save your analysis.`,
      ),
    );

    return { content };
  } catch (e) {
    return errorResult(`capture_flow failed: ${(e as Error).message}`);
  }
}

async function handleWriteFlowNarrative(args: Record<string, unknown>): Promise<ToolResult> {
  const flowName = args.flow_name as string;
  const phase = args.phase as string;
  const persona = args.persona as string;
  const jtbd = args.jtbd as string;
  const narrativeMarkdown = args.narrative_markdown as string;
  const outputDir = (args.output_dir as string) || defaultOutputDir();
  const captureTimestamp = args.capture_timestamp as string | undefined;

  if (!flowName || !phase || !persona || !jtbd || !narrativeMarkdown) {
    return errorResult("flow_name, phase, persona, jtbd, and narrative_markdown are all required.");
  }

  const flowDir = join(outputDir, flowName);
  mkdirSync(flowDir, { recursive: true });

  const filename = `${flowName}-${phase}.md`;
  const filePath = join(flowDir, filename);
  const today = new Date().toISOString().split("T")[0];

  // Build relative screenshots path if we can find one
  let screenshotsDir = "";
  if (captureTimestamp) {
    screenshotsDir = `./captures/${phase}/${flowName}/${captureTimestamp}/`;
  } else {
    // Try to find the most recent capture for this phase
    const capturesDir = join(outputDir, phase, flowName);
    if (existsSync(capturesDir)) {
      const entries = readdirSync(capturesDir).sort().reverse();
      if (entries.length > 0) {
        screenshotsDir = relative(flowDir, join(capturesDir, entries[0])) + "/";
      }
    }
  }

  const frontmatter = [
    "---",
    `flow: ${flowName}`,
    `phase: ${phase}`,
    `persona: "${persona.replace(/"/g, '\\"')}"`,
    `jtbd: "${jtbd.replace(/"/g, '\\"')}"`,
    `date: ${today}`,
    ...(captureTimestamp ? [`capture_timestamp: "${captureTimestamp}"`] : []),
    ...(screenshotsDir ? [`screenshots_dir: "${screenshotsDir}"`] : []),
    "---",
    "",
  ].join("\n");

  const content = frontmatter + narrativeMarkdown + "\n";
  writeFileSync(filePath, content, "utf-8");

  return {
    content: [
      textContent(
        `Narrative written to: ${filePath}\n\n` +
          `**Frontmatter:**\n\`\`\`yaml\n${frontmatter}\`\`\`\n` +
          `**Size:** ${content.length} characters`,
      ),
    ],
  };
}

async function handleCompareFlowNarratives(args: Record<string, unknown>): Promise<ToolResult> {
  const flowName = args.flow_name as string;
  const outputDir = (args.output_dir as string) || defaultOutputDir();
  const includeScreenshots = (args.include_screenshots as boolean) ?? false;

  if (!flowName) {
    return errorResult("flow_name is required.");
  }

  const flowDir = join(outputDir, flowName);
  const beforePath = (args.before_path as string) || join(flowDir, `${flowName}-before.md`);
  const afterPath = (args.after_path as string) || join(flowDir, `${flowName}-after.md`);

  // Read narratives
  if (!existsSync(beforePath)) {
    return errorResult(`Before narrative not found at: ${beforePath}`);
  }
  if (!existsSync(afterPath)) {
    return errorResult(`After narrative not found at: ${afterPath}`);
  }

  const beforeContent = readFileSync(beforePath, "utf-8");
  const afterContent = readFileSync(afterPath, "utf-8");

  const content: ToolContent[] = [
    textContent(`# Before/After Comparison: ${flowName}\n\n## BEFORE Narrative\n\n${beforeContent}`),
    textContent(`\n---\n\n## AFTER Narrative\n\n${afterContent}`),
  ];

  // Optionally load screenshots
  if (includeScreenshots) {
    for (const [label, narrativeContent] of [["BEFORE", beforeContent], ["AFTER", afterContent]] as const) {
      // Extract screenshots_dir from frontmatter
      const match = narrativeContent.match(/screenshots_dir:\s*"?([^"\n]+)"?/);
      if (match) {
        const screenshotsPath = resolve(dirname(label === "BEFORE" ? beforePath : afterPath), match[1]);
        if (existsSync(screenshotsPath)) {
          const pngs = readdirSync(screenshotsPath)
            .filter((f) => f.endsWith(".png"))
            .sort();
          content.push(textContent(`\n### ${label} Screenshots (${pngs.length} images)`));
          for (const png of pngs) {
            const imgPath = join(screenshotsPath, png);
            const base64 = readFileSync(imgPath).toString("base64");
            content.push(textContent(`**${png}**`));
            content.push(imageContent(base64));
          }
        }
      }
    }
  }

  content.push(
    textContent(
      "\n---\n\n## Comparison Template\n\n" +
        "Write your comparison narrative covering:\n" +
        "1. **Information hierarchy changes** — What moved up/down in visual weight?\n" +
        "2. **CTA effectiveness** — Were CTAs added, removed, or repositioned? Are labels more specific?\n" +
        "3. **Flow coherence** — Did the narrative arc improve (hook → orient → activate)?\n" +
        "4. **JTBD alignment** — Does the flow better serve the persona's goals?\n" +
        "5. **Remaining gaps** — What still needs attention?\n\n" +
        "Then call `write_flow_narrative` with phase 'after' to persist the comparison.",
    ),
  );

  return { content };
}

// ── Public API for tools.ts integration ──────────────────────────────────

/**
 * Handle a flow tool call. Returns the tool result, or null if the tool
 * name is not a flow tool (so the caller can fall through to other handlers).
 */
export async function handleFlowToolCall(
  name: string,
  args: unknown,
): Promise<ToolResult | null> {
  switch (name) {
    case "capture_flow":
      return handleCaptureFlow(args as Record<string, unknown>);
    case "write_flow_narrative":
      return handleWriteFlowNarrative(args as Record<string, unknown>);
    case "compare_flow_narratives":
      return handleCompareFlowNarratives(args as Record<string, unknown>);
    default:
      return null;
  }
}
