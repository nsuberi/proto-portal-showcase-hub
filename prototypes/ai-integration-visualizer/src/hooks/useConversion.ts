import { useRef } from "react";
import type { TeamMode } from "../types";

export const PILLAR_CYCLE = 20 / 3;
export const SQUAD_CYCLE = 8 / 3;
export const P3 = 1 / 3;

export interface PillarPhase {
  start: number;
  end: number;
  id: string;
  who: "pm" | "eng" | "biz" | null;
  action: "observe" | "write" | "doc";
  from?: "pm" | "eng" | "biz";
  to?: "pm" | "eng" | "biz";
  label: string;
}

export const PILLAR_PHASES: PillarPhase[] = [
  { start: 0 * P3, end: 2.5 * P3, id: "pm_observe", who: "pm", action: "observe", label: "\u25b8 Product observes target node" },
  { start: 2.5 * P3, end: 4 * P3, id: "pm_write", who: "pm", action: "write", label: "\u25b8 Product writes requirements doc" },
  { start: 4 * P3, end: 5.5 * P3, id: "doc_pm_eng", who: null, action: "doc", from: "pm", to: "eng", label: "\u25b8 Requirements doc \u2192 Engineering" },
  { start: 5.5 * P3, end: 8 * P3, id: "eng_observe1", who: "eng", action: "observe", label: "\u25b8 Engineering observes target node" },
  { start: 8 * P3, end: 9.5 * P3, id: "eng_write1", who: "eng", action: "write", label: "\u25b8 Engineering writes technical spec" },
  { start: 9.5 * P3, end: 11 * P3, id: "doc_eng_biz", who: null, action: "doc", from: "eng", to: "biz", label: "\u25b8 Technical spec \u2192 Business" },
  { start: 11 * P3, end: 13 * P3, id: "biz_validate", who: "biz", action: "observe", label: "\u25b8 Business validates against target node" },
  { start: 13 * P3, end: 14 * P3, id: "biz_write", who: "biz", action: "write", label: "\u25b8 Business writes approval" },
  { start: 14 * P3, end: 15.5 * P3, id: "doc_biz_eng", who: null, action: "doc", from: "biz", to: "eng", label: "\u25b8 Approval \u2192 Engineering" },
  { start: 15.5 * P3, end: 17 * P3, id: "eng_observe2", who: "eng", action: "observe", label: "\u25b8 Engineering implements changes" },
  { start: 17 * P3, end: 18 * P3, id: "eng_write2", who: "eng", action: "write", label: "\u25b8 Engineering writes completion update" },
  { start: 18 * P3, end: 19 * P3, id: "doc_eng_pm", who: null, action: "doc", from: "eng", to: "pm", label: "\u25b8 Update \u2192 Product for review" },
  { start: 19 * P3, end: 20 * P3, id: "pm_review", who: "pm", action: "observe", label: "\u25b8 Product reviews \u2014 node converting green \u2713" },
];

export function getCurrentPhase(
  phases: PillarPhase[],
  t: number
): PillarPhase {
  return (
    phases.find((p) => t >= p.start && t < p.end) ||
    phases[phases.length - 1]
  );
}

interface ConversionResult {
  greenCount: number;
  allDone: boolean;
  cycleTime: number;
  cycleDur: number;
}

/**
 * Tracks how many nodes have been converted. Persists across team mode
 * switches. Handles variable nodes-per-cycle (1 for pillared, N for squads).
 */
export function useConversion(
  totalSec: number,
  teamMode: TeamMode,
  totalNodes: number,
  squadCount: number = 3
): ConversionResult {
  const convertedRef = useRef(0);
  const prevModeRef = useRef(teamMode);
  const modeStartRef = useRef(totalSec);
  const lastCycleRef = useRef(-1);

  // Mode switch: reset cycle timer, keep green count
  if (prevModeRef.current !== teamMode) {
    prevModeRef.current = teamMode;
    modeStartRef.current = totalSec;
    lastCycleRef.current = -1;
  }

  const elapsed = totalSec - modeStartRef.current;
  const cycleDur = teamMode === "pillared" ? PILLAR_CYCLE : SQUAD_CYCLE;
  const completedCycles = Math.floor(elapsed / cycleDur);
  const cycleTime = elapsed % cycleDur;

  // Advance one cycle at a time to properly handle variable batch sizes
  if (
    completedCycles > lastCycleRef.current &&
    convertedRef.current < totalNodes
  ) {
    const newCycles = completedCycles - Math.max(0, lastCycleRef.current);
    for (let c = 0; c < newCycles && convertedRef.current < totalNodes; c++) {
      const nodesThisCycle =
        teamMode === "pillared"
          ? 1
          : Math.min(squadCount, totalNodes - convertedRef.current);
      convertedRef.current += nodesThisCycle;
    }
    lastCycleRef.current = completedCycles;
  }

  const greenCount = Math.min(convertedRef.current, totalNodes);
  const allDone = greenCount >= totalNodes;

  // Reset after all done + one extra cycle pause
  if (allDone && completedCycles > lastCycleRef.current) {
    convertedRef.current = 0;
    lastCycleRef.current = -1;
    modeStartRef.current = totalSec;
  }

  return { greenCount, allDone, cycleTime, cycleDur };
}
