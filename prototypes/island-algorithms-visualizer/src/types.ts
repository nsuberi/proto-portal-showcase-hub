export type ViewMode = "2d" | "3d";

export type CellCoord2D = { x: number; y: number };
export type CellCoord3D = { x: number; y: number; z: number };
export type CellCoord = CellCoord2D | CellCoord3D;

export interface Grid2D {
  mode: "2d";
  width: number;
  height: number;
  /** Flat array of weights. 0 = empty, >0 = filled with that cost. */
  cells: Uint8Array;
}

export interface Grid3D {
  mode: "3d";
  width: number;
  height: number;
  depth: number;
  cells: Uint8Array;
}

export type Grid = Grid2D | Grid3D;

export type CellRole =
  | "empty"
  | "filled"
  | "visited"
  | "frontier"
  | "current"
  | "path";

export interface CellView {
  index: number;
  x: number;
  y: number;
  z: number;
  role: CellRole;
  islandId: number | null;
  /** 0..1 intensity for glow. */
  intensity: number;
  /** True when the outer-loop scan cursor is on this cell. */
  isScanCursor: boolean;
  /** Optional auxiliary label (e.g. distance, DP value). */
  label?: string;
}

export type AlgorithmId = "dfs" | "bfs" | "dijkstra" | "dp-max-area" | "dp-square";
