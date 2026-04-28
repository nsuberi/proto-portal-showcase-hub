import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type {
  ToolEvent,
  Run,
  RunWithCalls,
  AttentionLayer,
} from "../types/tool-calls";
import { buildRunsWithCalls } from "../utils/tool-call-transform";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

interface UseRunMonitorResult {
  /** All runs with enriched tool call data */
  runs: RunWithCalls[];
  /** The currently active (running) run, if any */
  activeRun: RunWithCalls | null;
  /** Highest attention level across all runs */
  attentionLevel: AttentionLayer;
  /** Whether polling is active */
  polling: boolean;
  /** Toggle polling on/off */
  setPolling: (p: boolean) => void;
  /** Stop a specific run */
  stopRun: (id: string) => Promise<void>;
  /** Clear the activity log */
  clearLog: () => Promise<void>;
}

export function useRunMonitor(): UseRunMonitorResult {
  const [rawEvents, setRawEvents] = useState<ToolEvent[]>([]);
  const [rawRuns, setRawRuns] = useState<Run[]>([]);
  const [polling, setPolling] = useState(true);
  const hasActiveRef = useRef(false);

  // Poll activity + runs
  useEffect(() => {
    if (!polling) return;

    const poll = async () => {
      try {
        const [actRes, runRes] = await Promise.all([
          fetch(`${BASE_URL}/api/vault/activity`),
          fetch(`${BASE_URL}/api/vault/runs`),
        ]);
        if (actRes.ok) {
          const data = await actRes.json();
          setRawEvents(data.events || []);
        }
        if (runRes.ok) {
          const data = await runRes.json();
          const runs = data.runs || [];
          setRawRuns(runs);
          hasActiveRef.current = runs.some(
            (r: Run) => r.status === "running",
          );
        }
      } catch {
        // ignore network errors
      }
    };

    poll();
    // Poll faster (1s) when a run is active, otherwise 2s
    const interval = setInterval(poll, hasActiveRef.current ? 1000 : 2000);
    return () => clearInterval(interval);
  }, [polling]);

  // Transform raw data into enriched RunWithCalls
  const runs = useMemo(
    () => buildRunsWithCalls(rawEvents, rawRuns),
    [rawEvents, rawRuns],
  );

  // Find active run
  const activeRun = useMemo(
    () => runs.find((r) => r.status === "running") || null,
    [runs],
  );

  // Compute highest attention level
  const attentionLevel = useMemo<AttentionLayer>(() => {
    if (runs.length === 0) return "ambient";
    // Attention > Progress > Summary > Ambient
    if (runs.some((r) => r.attentionLevel === "attention")) return "attention";
    if (runs.some((r) => r.attentionLevel === "progress")) return "progress";
    if (runs.some((r) => r.attentionLevel === "summary")) return "summary";
    return "ambient";
  }, [runs]);

  const stopRun = useCallback(async (id: string) => {
    await fetch(`${BASE_URL}/api/vault/runs/${id}`, {
      method: "DELETE",
    }).catch(() => {});
  }, []);

  const clearLog = useCallback(async () => {
    setRawEvents([]);
    await fetch(`${BASE_URL}/api/vault/activity`, {
      method: "DELETE",
    }).catch(() => {});
  }, []);

  return {
    runs,
    activeRun,
    attentionLevel,
    polling,
    setPolling,
    stopRun,
    clearLog,
  };
}
