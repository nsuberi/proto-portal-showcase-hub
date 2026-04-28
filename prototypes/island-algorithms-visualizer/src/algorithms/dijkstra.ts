import type { Grid, Grid2D, Grid3D } from "@/types";
import { indexOf2D, indexOf3D } from "@/lib/grid";
import { neighbors2D, neighbors3D } from "@/lib/neighbors";
import { cloneStepState, initialStepState, ROLE_CODES } from "@/lib/step-state";
import type { AlgorithmStep, AuxItem, AuxView } from "./types";

/**
 * Line numbers in src/data/pseudocode.ts → dijkstra.
 * Bump these when the Python text is edited.
 */
const LINE = {
  init: 4, // heap = [(0, src)]
  pop: 6, // d, u = heappop(heap)
  stale: 8, // continue
  reachedGoal: 10, // return d, reconstruct(parent, dst)
  relax: 16, // heappush(heap, (nd, v))
  exhausted: 17, // return float('inf'), []
} as const;

function idxOf(grid: Grid, x: number, y: number, z: number): number {
  if (grid.mode === "2d") return indexOf2D(grid as Grid2D, x, y);
  return indexOf3D(grid as Grid3D, x, y, z);
}

function coordLabel(grid: Grid, x: number, y: number, z: number): string {
  return grid.mode === "3d" ? `(${x},${y},${z})` : `(${x},${y})`;
}

function* neighborsOf(
  grid: Grid,
  x: number,
  y: number,
  z: number,
): Generator<[number, number, number]> {
  if (grid.mode === "2d") {
    for (const [nx, ny] of neighbors2D(grid, x, y)) yield [nx, ny, 0];
  } else {
    yield* neighbors3D(grid, x, y, z);
  }
}

interface HeapEntry {
  x: number;
  y: number;
  z: number;
  dist: number;
}

function findSourceAndSink(grid: Grid): { src: number; dst: number } | null {
  let first = -1;
  let last = -1;
  for (let i = 0; i < grid.cells.length; i++) {
    if (grid.cells[i]) {
      if (first === -1) first = i;
      last = i;
    }
  }
  if (first === -1 || first === last) return null;
  return { src: first, dst: last };
}

function coordOf(grid: Grid, i: number): { x: number; y: number; z: number } {
  const w = grid.width;
  if (grid.mode === "2d") {
    return { x: i % w, y: Math.floor(i / w), z: 0 };
  }
  const plane = grid.width * grid.height;
  const z = Math.floor(i / plane);
  const rem = i - z * plane;
  return { x: rem % w, y: Math.floor(rem / w), z };
}

export function* dijkstraSteps(grid: Grid): Generator<AlgorithmStep> {
  let state = initialStepState(grid);
  const endpoints = findSourceAndSink(grid);
  const visited: { label: string; cellIndex: number; islandId?: number }[] = [];

  if (!endpoints) {
    yield {
      reason: "Need at least two filled cells to run Dijkstra — place a source and a sink.",
      sourceLine: LINE.init,
      state: cloneStepState(state),
      aux: distMapAux(grid, new Float64Array(0), new Int32Array(0), new Uint8Array(0), []),
      visited,
    };
    return;
  }

  const { src, dst } = endpoints;
  const n = grid.cells.length;
  const start = coordOf(grid, src);
  const goal = coordOf(grid, dst);
  const INF = Number.POSITIVE_INFINITY;
  const dist = new Float64Array(n).fill(INF);
  const parent = new Int32Array(n).fill(-1);
  const touched = new Uint8Array(n); // 1 if a dist has ever been recorded
  const finalized = new Uint8Array(n); // 1 if popped and committed
  dist[src] = 0;
  touched[src] = 1;

  const heap: HeapEntry[] = [{ ...start, dist: 0 }];
  state = cloneStepState(state);
  state.roles[src] = ROLE_CODES.frontier;
  state.values[src] = 0;
  state.labelMask[src] = 1;

  yield {
    reason: `Source ${coordLabel(grid, start.x, start.y, start.z)} cost 0; goal ${coordLabel(grid, goal.x, goal.y, goal.z)}. Push source onto min-heap.`,
    sourceLine: LINE.init,
    state: cloneStepState(state),
    aux: distMapAux(grid, dist, parent, touched, heap, finalized),
    visited: [...visited],
  };

  while (heap.length) {
    heap.sort((a, b) => a.dist - b.dist);
    const cur = heap.shift()!;
    const ci = idxOf(grid, cur.x, cur.y, cur.z);

    if (cur.dist > dist[ci]) {
      yield {
        reason: `Stale entry for ${coordLabel(grid, cur.x, cur.y, cur.z)} — a shorter path already reached it; skip.`,
        sourceLine: LINE.stale,
        state: cloneStepState(state),
        aux: distMapAux(grid, dist, parent, touched, heap, finalized),
        visited: [...visited],
      };
      continue;
    }

    state = cloneStepState(state);
    state.roles[ci] = ROLE_CODES.current;
    yield {
      reason: `Pop ${coordLabel(grid, cur.x, cur.y, cur.z)} with cost ${cur.dist} — shortest so far is now finalized.`,
      sourceLine: LINE.pop,
      state: cloneStepState(state),
      aux: distMapAux(grid, dist, parent, touched, heap, finalized),
      visited: [...visited],
    };

    if (ci === dst) {
      const path = reconstruct(parent, dst);
      state = cloneStepState(state);
      for (const p of path) state.roles[p] = ROLE_CODES.path;
      finalized[ci] = 1;
      visited.push({
        label: `${coordLabel(grid, cur.x, cur.y, cur.z)}·${cur.dist}`,
        cellIndex: ci,
      });
      yield {
        reason: `Goal reached — highlight path. Total cost ${cur.dist}.`,
        sourceLine: LINE.reachedGoal,
        state: cloneStepState(state),
        aux: distMapAux(grid, dist, parent, touched, heap, finalized),
        visited: [...visited],
        metric: { label: "Shortest cost", value: String(cur.dist) },
      };
      return;
    }

    for (const [nx, ny, nz] of neighborsOf(grid, cur.x, cur.y, cur.z)) {
      const ni = idxOf(grid, nx, ny, nz);
      if (!grid.cells[ni]) continue;
      const w = grid.cells[ni];
      const nd = cur.dist + w;
      if (nd < dist[ni]) {
        dist[ni] = nd;
        parent[ni] = ci;
        touched[ni] = 1;
        heap.push({ x: nx, y: ny, z: nz, dist: nd });
        state = cloneStepState(state);
        state.roles[ni] = ROLE_CODES.frontier;
        state.values[ni] = nd;
        state.labelMask[ni] = 1;
        yield {
          reason: `Relax → ${coordLabel(grid, nx, ny, nz)} cost ${nd} (edge weight ${w}).`,
          sourceLine: LINE.relax,
          state: cloneStepState(state),
          aux: distMapAux(grid, dist, parent, touched, heap, finalized),
          visited: [...visited],
        };
      }
    }

    state = cloneStepState(state);
    state.roles[ci] = ROLE_CODES.visited;
    finalized[ci] = 1;
    visited.push({
      label: `${coordLabel(grid, cur.x, cur.y, cur.z)}·${cur.dist}`,
      cellIndex: ci,
    });
  }

  yield {
    reason: "Heap exhausted without reaching the goal.",
    sourceLine: LINE.exhausted,
    state: cloneStepState(state),
    aux: distMapAux(grid, dist, parent, touched, heap, finalized),
    visited: [...visited],
  };
}

function reconstruct(parent: Int32Array, dst: number): number[] {
  const out: number[] = [];
  let cur = dst;
  while (cur !== -1) {
    out.push(cur);
    cur = parent[cur];
  }
  return out;
}

function distMapAux(
  grid: Grid,
  dist: Float64Array,
  parent: Int32Array,
  touched: Uint8Array,
  heap: HeapEntry[],
  finalized?: Uint8Array,
): AuxView {
  const rows: {
    label: string;
    cellIndex: number;
    dist: number;
    parent: string | null;
    finalized: boolean;
  }[] = [];
  for (let i = 0; i < touched.length; i++) {
    if (!touched[i]) continue;
    const c = coordOf(grid, i);
    const p = parent[i];
    rows.push({
      label: coordLabel(grid, c.x, c.y, c.z),
      cellIndex: i,
      dist: dist[i],
      parent: p === -1 ? null : coordLabel(grid, coordOf(grid, p).x, coordOf(grid, p).y, coordOf(grid, p).z),
      finalized: finalized ? finalized[i] === 1 : false,
    });
  }
  rows.sort((a, b) => a.dist - b.dist);
  const top = [...heap]
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 6)
    .map<AuxItem>((h) => ({
      label: `${coordLabel(grid, h.x, h.y, h.z)}·${h.dist}`,
      cellIndex: idxOf(grid, h.x, h.y, h.z),
      priority: h.dist,
    }));
  return { kind: "dist-map", rows: rows.slice(0, 24), heapTop: top };
}
