import type {
  ToolEvent,
  Run,
  ToolCall,
  RiskLevel,
  RunWithCalls,
  AttentionLayer,
  RunSummary,
} from "../types/tool-calls";

// ---------------------------------------------------------------------------
// Risk classification (color-coded reversibility)
// ---------------------------------------------------------------------------

const SAFE_TOOLS = new Set(["Read", "Grep", "Glob", "WebFetch", "WebSearch", "TaskList", "TaskGet"]);
const MODIFIABLE_TOOLS = new Set(["Write", "Edit", "Agent", "Skill", "NotebookEdit"]);

const DESTRUCTIVE_BASH_PATTERNS =
  /\brm\s|sudo\s|chmod\s|chown\s|git\s+(reset\s+--hard|push\s+--force|checkout\s+--)|drop\s+table|truncate\s/i;

const SAFE_BASH_PATTERNS =
  /^\s*(ls|cat|head|tail|echo|pwd|which|find|git\s+(status|log|diff|branch|show)|node\s+-e|yarn\s+|npm\s+(run|test|list)|python3?\s+-c)\b/;

export function classifyRisk(
  tool: string,
  input: Record<string, unknown>,
): RiskLevel {
  if (SAFE_TOOLS.has(tool)) return "safe";
  if (MODIFIABLE_TOOLS.has(tool)) return "modifiable";

  if (tool === "Bash") {
    const cmd = String(input.command || "");
    if (DESTRUCTIVE_BASH_PATTERNS.test(cmd)) return "destructive";
    if (SAFE_BASH_PATTERNS.test(cmd)) return "safe";
    return "caution";
  }

  return "caution";
}

// ---------------------------------------------------------------------------
// Natural language description generation
// ---------------------------------------------------------------------------

function fileName(path: string): string {
  return path.split("/").pop() || path;
}

export function generateDescription(
  tool: string,
  input: Record<string, unknown>,
): string {
  const filePath = String(input.file_path || "");

  switch (tool) {
    case "Read": {
      const name = fileName(filePath);
      if (input.offset || input.limit) {
        const start = Number(input.offset) || 0;
        const end = start + (Number(input.limit) || 0);
        return `Reading lines ${start}–${end} of ${name}`;
      }
      return `Reading ${name}`;
    }
    case "Write": {
      const name = fileName(filePath);
      const len = String(input.content || "").length;
      if (len > 1024) {
        return `Writing ${name} (${(len / 1024).toFixed(1)}KB)`;
      }
      return `Writing ${name}`;
    }
    case "Edit": {
      const name = fileName(filePath);
      if (input.replace_all) return `Replacing all occurrences in ${name}`;
      return `Editing ${name}`;
    }
    case "Bash": {
      const cmd = String(input.command || "");
      const first = cmd.trim().split(/\s+/)[0];
      if (first === "npm" || first === "yarn") return `Running ${cmd.slice(0, 60)}`;
      if (first === "git") return `Git: ${cmd.slice(4, 60)}`;
      if (first === "ls") return "Listing directory contents";
      if (first === "cd") return "Changing directory";
      if (first === "find") return "Searching for files";
      if (input.description) return String(input.description);
      return `Running: ${cmd.slice(0, 60)}${cmd.length > 60 ? "…" : ""}`;
    }
    case "Grep":
      return `Searching for "${input.pattern}"${input.path ? ` in ${fileName(String(input.path))}` : ""}`;
    case "Glob":
      return `Finding files matching ${input.pattern}`;
    case "WebFetch":
      return `Fetching ${String(input.url || "").replace(/^https?:\/\//, "").slice(0, 50)}`;
    case "WebSearch":
      return `Searching web for "${input.query}"`;
    case "Agent":
      return String(input.description || "Delegating to sub-agent");
    case "Skill":
      return `Using skill: ${input.skill}`;
    case "TaskCreate":
      return `Creating task: ${input.subject || ""}`;
    default:
      return `${tool} tool call`;
  }
}

// ---------------------------------------------------------------------------
// Status inference (without PostToolUse hook)
// ---------------------------------------------------------------------------

export function deriveStatuses(
  events: ToolEvent[],
  runs: Run[],
): Map<string, ToolCall[]> {
  // Group events by runId
  const byRun = new Map<string, ToolEvent[]>();
  for (const event of events) {
    const rid = event.runId || "__interactive__";
    const group = byRun.get(rid) || [];
    group.push(event);
    byRun.set(rid, group);
  }

  const runStatusMap = new Map(runs.map((r) => [r.id, r]));
  const result = new Map<string, ToolCall[]>();

  for (const [runId, runEvents] of byRun) {
    const calls: ToolCall[] = [];

    for (let i = 0; i < runEvents.length; i++) {
      const event = runEvents[i];
      const nextEvent = runEvents[i + 1];
      const run = runStatusMap.get(runId);

      // Determine status
      let status: ToolCall["status"];
      if (event.decision === "block") {
        status = "blocked";
      } else if (nextEvent) {
        // A subsequent event exists — this one completed
        status = "completed";
      } else if (run && (run.status === "completed" || run.status === "failed" || run.status === "cancelled")) {
        // Run is finished — last event completed
        status = run.status === "failed" ? "failed" : "completed";
      } else {
        // No next event, run still active — this one is running
        status = "running";
      }

      // Estimate duration from gap between consecutive events
      let durationMs: number | undefined;
      if (nextEvent) {
        durationMs = new Date(nextEvent.timestamp).getTime() - new Date(event.timestamp).getTime();
      }

      calls.push({
        id: `${runId}-${i}`,
        runId,
        tool: event.tool,
        input: event.input,
        decision: event.decision,
        reason: event.reason,
        timestamp: event.timestamp,
        status,
        description: generateDescription(event.tool, event.input),
        riskLevel: classifyRisk(event.tool, event.input),
        durationMs,
      });
    }

    result.set(runId, calls);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Build RunWithCalls from raw data
// ---------------------------------------------------------------------------

export function buildRunsWithCalls(
  events: ToolEvent[],
  runs: Run[],
): RunWithCalls[] {
  const callsByRun = deriveStatuses(events, runs);

  return runs.map((run) => {
    const toolCalls = callsByRun.get(run.id) || [];
    const hasBlocked = toolCalls.some((tc) => tc.status === "blocked");
    const hasRunning = toolCalls.some((tc) => tc.status === "running");
    const isFinished = run.status === "completed" || run.status === "failed" || run.status === "cancelled";

    let attentionLevel: AttentionLayer;
    if (isFinished) {
      attentionLevel = "summary";
    } else if (hasBlocked) {
      attentionLevel = "attention";
    } else if (hasRunning) {
      attentionLevel = "progress";
    } else {
      attentionLevel = "ambient";
    }

    const elapsedMs = run.finishedAt
      ? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
      : Date.now() - new Date(run.startedAt).getTime();

    return {
      id: run.id,
      title: run.title,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      toolCalls,
      elapsedMs,
      attentionLevel,
    };
  });
}

// ---------------------------------------------------------------------------
// Summary stats for completed runs
// ---------------------------------------------------------------------------

export function computeRunSummary(run: RunWithCalls): RunSummary {
  const byTool: Record<string, number> = {};
  const filesRead: string[] = [];
  const filesWritten: string[] = [];
  let blockedCount = 0;

  for (const tc of run.toolCalls) {
    byTool[tc.tool] = (byTool[tc.tool] || 0) + 1;
    if (tc.status === "blocked") blockedCount++;

    const filePath = String(tc.input.file_path || "");
    if (filePath) {
      if (tc.tool === "Read") filesRead.push(filePath);
      if (tc.tool === "Write" || tc.tool === "Edit") filesWritten.push(filePath);
    }
  }

  return {
    totalCalls: run.toolCalls.length,
    byTool,
    blockedCount,
    filesRead: [...new Set(filesRead)],
    filesWritten: [...new Set(filesWritten)],
  };
}
