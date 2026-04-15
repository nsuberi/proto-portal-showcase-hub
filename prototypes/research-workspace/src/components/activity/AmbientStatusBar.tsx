import type { RunWithCalls, AttentionLayer } from "../../types/tool-calls";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins > 0) return `${mins}m ${remSecs}s`;
  return `${secs}s`;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

interface AmbientStatusBarProps {
  runs: RunWithCalls[];
  attentionLevel: AttentionLayer;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function AmbientStatusBar({
  runs,
  attentionLevel,
  isExpanded,
  onToggle,
}: AmbientStatusBarProps) {
  const activeRun = runs.find((r) => r.status === "running");
  const lastFinished = runs
    .filter((r) => r.status !== "running" && r.finishedAt)
    .sort(
      (a, b) =>
        new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime(),
    )[0];

  const totalToolCalls = runs.reduce((sum, r) => sum + r.toolCalls.length, 0);

  // Determine bar styling based on attention level
  const barClass =
    attentionLevel === "attention"
      ? "activity-bar attention"
      : "activity-bar";

  return (
    <button
      onClick={onToggle}
      className={`${barClass} w-full flex items-center gap-3 px-4 py-2 glass-header hover:bg-white/[0.04] transition-all cursor-pointer`}
    >
      {/* Status indicator */}
      {activeRun ? (
        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
      ) : attentionLevel === "attention" ? (
        <AlertTriangle className="w-3.5 h-3.5 text-tertiary flex-shrink-0" />
      ) : lastFinished ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-accent-success/50 flex-shrink-0" />
      ) : (
        <span className="ambient-dot flex-shrink-0" />
      )}

      {/* Status text */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {activeRun ? (
          <>
            <span className="font-label text-[11px] text-white/60 truncate">
              Running "{activeRun.title}"
            </span>
            <span className="font-label text-[10px] text-white/30">
              {activeRun.toolCalls.length > 0 &&
                activeRun.toolCalls[activeRun.toolCalls.length - 1]
                  .description}
            </span>
          </>
        ) : lastFinished ? (
          <>
            <span className="font-label text-[11px] text-white/40">
              Last run: "{lastFinished.title}"
            </span>
            <span className="font-label text-[10px] text-white/25">
              {lastFinished.status === "completed"
                ? "completed"
                : lastFinished.status}{" "}
              {lastFinished.finishedAt && formatTimeAgo(lastFinished.finishedAt)}
            </span>
          </>
        ) : (
          <span className="font-label text-[11px] text-white/30">
            Ready
          </span>
        )}
      </div>

      {/* Right side stats */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {activeRun && (
          <span className="font-mono text-[10px] text-white/25">
            {formatElapsed(activeRun.elapsedMs)}
          </span>
        )}
        {totalToolCalls > 0 && (
          <span className="font-label text-[9px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded-full">
            {totalToolCalls} tools
          </span>
        )}
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-white/20" />
        ) : (
          <ChevronUp className="w-3 h-3 text-white/20" />
        )}
      </div>
    </button>
  );
}
