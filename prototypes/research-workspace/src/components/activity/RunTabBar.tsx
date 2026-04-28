import type { RunWithCalls } from "../../types/tool-calls";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Square,
} from "lucide-react";

interface RunTabBarProps {
  runs: RunWithCalls[];
  activeRunId: string | null;
  onSelectRun: (id: string) => void;
  onCloseRun: (id: string) => void;
  onStopRun: (id: string) => void;
}

export default function RunTabBar({
  runs,
  activeRunId,
  onSelectRun,
  onCloseRun,
  onStopRun,
}: RunTabBarProps) {
  if (runs.length === 0) return null;

  return (
    <div className="flex items-center gap-0 px-1 overflow-x-auto border-b border-outline-variant/20">
      {runs.map((run) => (
        <div
          key={run.id}
          className={`flex items-center gap-1 px-2 py-1.5 border-b-2 transition-colors ${
            activeRunId === run.id
              ? "border-primary text-on-primary"
              : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant"
          }`}
        >
          <button
            onClick={() => onSelectRun(run.id)}
            className="flex items-center gap-1 text-[11px] font-label whitespace-nowrap max-w-[140px]"
          >
            {run.status === "running" ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin text-primary flex-shrink-0" />
            ) : run.status === "completed" ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-accent-success flex-shrink-0" />
            ) : (
              <XCircle className="w-2.5 h-2.5 text-error/60 flex-shrink-0" />
            )}
            <span className="truncate">{run.title}</span>
          </button>

          {run.status === "running" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStopRun(run.id);
              }}
              className="p-0.5 text-on-surface-variant/30 hover:text-error transition-colors"
              title="Stop run"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
          )}

          {run.status !== "running" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseRun(run.id);
              }}
              className="p-0.5 text-on-surface-variant/30 hover:text-on-surface-variant/80 transition-colors"
              title="Close tab"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
