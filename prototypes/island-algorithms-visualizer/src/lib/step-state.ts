import type { CellRole, CellView, Grid } from "@/types";

export interface StepState {
  /** role per cell index — parallel to Grid.cells */
  roles: Uint8Array;
  /** island id per cell index, 255 = none */
  islands: Uint8Array;
  /** auxiliary numeric value for display (e.g. distance, DP value) */
  values: Int32Array;
  /** cells with a non-default value should be rendered with their label */
  labelMask: Uint8Array;
  /** index of the outer-loop scan cursor, or -1 if no scan in progress */
  scanCursor: number;
}

const ROLE_EMPTY = 0;
const ROLE_FILLED = 1;
const ROLE_VISITED = 2;
const ROLE_FRONTIER = 3;
const ROLE_CURRENT = 4;
const ROLE_PATH = 5;

export const ROLE_CODES = {
  empty: ROLE_EMPTY,
  filled: ROLE_FILLED,
  visited: ROLE_VISITED,
  frontier: ROLE_FRONTIER,
  current: ROLE_CURRENT,
  path: ROLE_PATH,
} as const;

export function roleFromCode(code: number): CellRole {
  switch (code) {
    case ROLE_FILLED:
      return "filled";
    case ROLE_VISITED:
      return "visited";
    case ROLE_FRONTIER:
      return "frontier";
    case ROLE_CURRENT:
      return "current";
    case ROLE_PATH:
      return "path";
    default:
      return "empty";
  }
}

export function initialStepState(grid: Grid): StepState {
  const n = grid.cells.length;
  const roles = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    roles[i] = grid.cells[i] ? ROLE_FILLED : ROLE_EMPTY;
  }
  const islands = new Uint8Array(n).fill(255);
  const values = new Int32Array(n);
  const labelMask = new Uint8Array(n);
  return { roles, islands, values, labelMask, scanCursor: -1 };
}

export function cloneStepState(s: StepState): StepState {
  return {
    roles: new Uint8Array(s.roles),
    islands: new Uint8Array(s.islands),
    values: new Int32Array(s.values),
    labelMask: new Uint8Array(s.labelMask),
    scanCursor: s.scanCursor,
  };
}

export function materializeCells(grid: Grid, s: StepState): CellView[] {
  const n = grid.cells.length;
  const out: CellView[] = new Array(n);
  const width = grid.width;
  const height = grid.height;
  for (let i = 0; i < n; i++) {
    let x = 0;
    let y = 0;
    let z = 0;
    if (grid.mode === "2d") {
      x = i % width;
      y = Math.floor(i / width);
    } else {
      const plane = width * height;
      z = Math.floor(i / plane);
      const rem = i - z * plane;
      y = Math.floor(rem / width);
      x = rem % width;
    }
    const role = roleFromCode(s.roles[i]);
    const islandId = s.islands[i] === 255 ? null : s.islands[i];
    const intensity =
      role === "current"
        ? 1
        : role === "frontier"
          ? 0.85
          : role === "path"
            ? 0.9
            : role === "visited"
              ? 0.7
              : role === "filled"
                ? 0.55
                : 0.12;
    out[i] = {
      index: i,
      x,
      y,
      z,
      role,
      islandId,
      intensity,
      isScanCursor: s.scanCursor === i,
      label: s.labelMask[i] ? String(s.values[i]) : undefined,
    };
  }
  return out;
}
