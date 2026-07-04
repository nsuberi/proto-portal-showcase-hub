import { useState, useEffect, useMemo, useCallback } from "react";
import { useRunMonitor } from "../../hooks/useRunMonitor";
import AmbientStatusBar from "./AmbientStatusBar";
import RunTabBar from "./RunTabBar";
import ToolCallStream from "./ToolCallStream";
import RunSummaryView from "./RunSummaryView";
import { Trash2, Shield } from "lucide-react";

interface AgentActivityStripProps {
  /** Whether the panel is in its expanded (tall) state */
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export default function AgentActivityStrip({
  isExpanded,
  onToggleExpanded,
}: AgentActivityStripProps) {
  const { runs, attentionLevel, polling, setPolling, stopRun, clearLog } =
    useRunMonitor();

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [closedRunIds, setClosedRunIds] = useState<Set<string>>(new Set());
  const [showSummary, setShowSummary] = useState<Record<string, boolean>>({});

  // Filter out closed runs for tab display
  const visibleRuns = useMemo(
    () => runs.filter((r) => !closedRunIds.has(r.id)),
    [runs, closedRunIds],
  );

  // Auto-select new running runs
  useEffect(() => {
    const handler = (e: Event) => {
      const { runId } = (e as CustomEvent).detail;
      setSelectedRunId(runId);
      // Also auto-expand the strip
      if (!isExpanded) onToggleExpanded();
    };
    window.addEventListener("run-started", handler);
    return () => window.removeEventListener("run-started", handler);
  }, [isExpanded, onToggleExpanded]);

  // Auto-select if only one run and nothing selected
  useEffect(() => {
    if (!selectedRunId && visibleRuns.length > 0) {
      setSelectedRunId(visibleRuns[0].id);
    }
  }, [selectedRunId, visibleRuns]);

  // Auto-show summary when a run completes
  useEffect(() => {
    for (const run of runs) {
      if (
        (run.status === "completed" || run.status === "failed") &&
        showSummary[run.id] === undefined
      ) {
        setShowSummary((prev) => ({ ...prev, [run.id]: true }));
      }
    }
  }, [runs, showSummary]);

  const handleCloseRun = useCallback((id: string) => {
    setClosedRunIds((prev) => new Set(prev).add(id));
    setSelectedRunId((prev) => (prev === id ? null : prev));
  }, []);

  const selectedRun = useMemo(
    () => runs.find((r) => r.id === selectedRunId) || null,
    [runs, selectedRunId],
  );

  // If collapsed, show just the ambient bar
  if (!isExpanded) {
    return (
      <div className="h-full flex items-center">
        <AmbientStatusBar
          runs={runs}
          attentionLevel={attentionLevel}
          isExpanded={false}
          onToggle={onToggleExpanded}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <div className="glass-header flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-on-surface-variant/80" />
          <span className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80">
            Agent Activity
          </span>
          {runs.some((r) => r.status === "running") && (
            <span className="flex items-center gap-1 font-label text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPolling(!polling)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-label transition-colors ${
              polling
                ? "text-accent-success bg-accent-success/10"
                : "text-on-surface-variant/65 bg-on-surface/[0.04]"
            }`}
          >
            {polling ? "Live" : "Paused"}
          </button>
          <button
            onClick={clearLog}
            className="p-0.5 text-on-surface-variant/65 hover:text-error transition-colors"
            title="Clear log"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Run tabs */}
      <RunTabBar
        runs={visibleRuns}
        activeRunId={selectedRunId}
        onSelectRun={setSelectedRunId}
        onCloseRun={handleCloseRun}
        onStopRun={stopRun}
      />

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedRun ? (
          showSummary[selectedRun.id] &&
          selectedRun.status !== "running" ? (
            <RunSummaryView
              run={selectedRun}
              onShowDetails={() =>
                setShowSummary((prev) => ({
                  ...prev,
                  [selectedRun.id]: false,
                }))
              }
            />
          ) : (
            <ToolCallStream toolCalls={selectedRun.toolCalls} />
          )
        ) : visibleRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Shield className="w-8 h-8 text-on-surface-variant/15 mb-2" />
            <p className="font-label text-[10px] text-on-surface-variant/60">
              Agent tool use is audited here.
            </p>
            <p className="font-label text-[10px] text-on-surface-variant/20 mt-1">
              Click the play button on an intention to run it.
            </p>
          </div>
        ) : (
          <ToolCallStream toolCalls={[]} />
        )}
      </div>

      {/* Ambient bar at bottom for collapse toggle */}
      <AmbientStatusBar
        runs={runs}
        attentionLevel={attentionLevel}
        isExpanded={true}
        onToggle={onToggleExpanded}
      />
    </div>
  );
}
