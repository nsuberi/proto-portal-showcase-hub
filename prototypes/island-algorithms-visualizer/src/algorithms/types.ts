import type { AlgorithmId, Grid } from "@/types";
import type { StepState } from "@/lib/step-state";

export interface AlgorithmStep {
  /** One-line narration for the step context band. */
  reason: string;
  /** Line number in the pseudocode block to highlight. */
  sourceLine: number;
  /** Full snapshot of cell state after this step. */
  state: StepState;
  /** Primary aux data structure representation (queue/stack/heap/DP table). */
  aux: AuxView;
  /** Running trail of cells that have been finalized / visited, most-recent last. */
  visited: { label: string; cellIndex: number; islandId?: number }[];
  /** Optional count to update headline status text. */
  islandsFound?: number;
  /** Optional total weighted cost or DP answer. */
  metric?: { label: string; value: string };
}

export type AuxView =
  | { kind: "none" }
  | { kind: "stack"; items: AuxItem[] }
  | { kind: "queue"; items: AuxItem[] }
  | { kind: "heap"; items: AuxItem[] }
  | {
      kind: "dist-map";
      rows: { label: string; cellIndex: number; dist: number; parent: string | null; finalized: boolean }[];
      heapTop: AuxItem[];
    }
  | {
      kind: "dsu-arrays";
      parent: number[];
      size: number[];
      gridMask: Uint8Array;
      highlight: number; // index the scan cursor is currently on (-1 = none)
    }
  | { kind: "dp-grid"; width: number; height: number; values: number[]; best: number };

export interface AuxItem {
  label: string;
  cellIndex?: number;
  priority?: number;
}

export interface AlgorithmRunner {
  (grid: Grid): Generator<AlgorithmStep>;
}

export interface AlgorithmMeta {
  id: AlgorithmId;
  label: string;
  tagline: string;
  bigO: { time: string; space: string };
  dataStructure: string;
  whenToUse: string[];
  gotchas: string[];
  pseudocode: string;
  requiresWeighted?: boolean;
  requires3DAware?: boolean;
}

export interface AlgorithmEntry {
  meta: AlgorithmMeta;
  runner: AlgorithmRunner;
}
