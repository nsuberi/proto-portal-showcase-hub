import type { RunWithCalls, RunSummary } from "../../types/tool-calls";
import { computeRunSummary } from "../../utils/tool-call-transform";
import {
  CheckCircle2,
  XCircle,
  FileText,
  PenLine,
  ShieldX,
} from "lucide-react";

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins > 0) return `${mins}m ${remSecs}s`;
  return `${remSecs}s`;
}

function ToolBreakdownBar({ byTool }: { byTool: Record<string, number> }) {
  const total = Object.values(byTool).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const TOOL_BAR_COLORS: Record<string, string> = {
    Read: "bg-primary/60",
    Write: "bg-tertiary/60",
    Edit: "bg-tertiary/40",
    Bash: "bg-secondary/60",
    Grep: "bg-white/20",
    Glob: "bg-white/15",
    WebFetch: "bg-accent-success/50",
    WebSearch: "bg-accent-success/40",
    Agent: "bg-primary/40",
  };

  const entries = Object.entries(byTool).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
        {entries.map(([tool, count]) => (
          <div
            key={tool}
            className={`${TOOL_BAR_COLORS[tool] || "bg-white/20"} transition-all`}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${tool}: ${count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {entries.map(([tool, count]) => (
          <span
            key={tool}
            className="font-label text-[9px] text-white/40"
          >
            {tool} <span className="text-white/25">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

interface RunSummaryViewProps {
  run: RunWithCalls;
  onShowDetails: () => void;
}

export default function RunSummaryView({
  run,
  onShowDetails,
}: RunSummaryViewProps) {
  const summary: RunSummary = computeRunSummary(run);
  const isSuccess = run.status === "completed";

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Status banner */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          isSuccess
            ? "bg-accent-success/[0.06] border border-accent-success/10"
            : "bg-error/[0.06] border border-error/10"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-accent-success" />
        ) : (
          <XCircle className="w-4 h-4 text-error/70" />
        )}
        <span className="font-label text-sm text-white/70">
          {isSuccess ? "Completed" : "Failed"} in{" "}
          {formatElapsed(run.elapsedMs)}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-white/40 font-label text-[11px]">
        <span className="flex items-center gap-1">
          <span className="text-white/60 font-medium">
            {summary.totalCalls}
          </span>{" "}
          tool calls
        </span>
        {summary.filesRead.length > 0 && (
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {summary.filesRead.length} read
          </span>
        )}
        {summary.filesWritten.length > 0 && (
          <span className="flex items-center gap-1">
            <PenLine className="w-3 h-3" />
            {summary.filesWritten.length} written
          </span>
        )}
        {summary.blockedCount > 0 && (
          <span className="flex items-center gap-1 text-error/60">
            <ShieldX className="w-3 h-3" />
            {summary.blockedCount} blocked
          </span>
        )}
      </div>

      {/* Tool breakdown */}
      <ToolBreakdownBar byTool={summary.byTool} />

      {/* Show details button */}
      <button
        onClick={onShowDetails}
        className="self-start font-label text-[10px] text-primary/70 hover:text-primary transition-colors"
      >
        Show all tool calls
      </button>
    </div>
  );
}
