import type { Grid, Grid2D, Grid3D } from "@/types";
import { indexOf2D, indexOf3D } from "@/lib/grid";
import { neighbors2D, neighbors3D } from "@/lib/neighbors";
import { cloneStepState, initialStepState, ROLE_CODES } from "@/lib/step-state";
import type { AlgorithmStep, AuxView } from "./types";

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

// DSU max-area of island
export function* dpMaxAreaSteps(grid: Grid): Generator<AlgorithmStep> {
  const n = grid.cells.length;
  const parent = new Int32Array(n);
  const size = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    parent[i] = i;
    size[i] = grid.cells[i] ? 1 : 0;
  }
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };

  let state = initialStepState(grid);
  const visited: { label: string; cellIndex: number; islandId?: number }[] = [];
  yield {
    reason: "Union-Find: each land cell starts as its own component of size 1.",
    sourceLine: 2,
    state: cloneStepState(state),
    aux: dsuAux(parent, size, grid),
    visited: [...visited],
  };

  const width = grid.width;
  const height = grid.height;
  const depth = grid.mode === "3d" ? grid.depth : 1;
  let best = 0;

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = idxOf(grid, x, y, z);
        state = cloneStepState(state);
        state.scanCursor = i;

        if (!grid.cells[i]) {
          yield {
            reason: `Scan ${coordLabel(grid, x, y, z)} — water, nothing to union.`,
            sourceLine: 8,
            state: cloneStepState(state),
            aux: dsuAux(parent, size, grid),
            visited: [...visited],
            metric: { label: "Max area", value: String(best) },
          };
          continue;
        }

        yield {
          reason: `Scan ${coordLabel(grid, x, y, z)} — try to merge with any land neighbor already in a component.`,
          sourceLine: 8,
          state: cloneStepState(state),
          aux: dsuAux(parent, size, grid),
          visited: [...visited],
          metric: { label: "Max area", value: String(best) },
        };

        for (const [nx, ny, nz] of neighborsOf(grid, x, y, z)) {
          const ni = idxOf(grid, nx, ny, nz);
          if (!grid.cells[ni]) continue;
          const ra = find(i);
          const rb = find(ni);
          if (ra === rb) continue;
          if (size[ra] < size[rb]) {
            parent[ra] = rb;
            size[rb] += size[ra];
            size[ra] = 0;
          } else {
            parent[rb] = ra;
            size[ra] += size[rb];
            size[rb] = 0;
          }
          const root = find(i);
          best = Math.max(best, size[root]);
          state = cloneStepState(state);
          state.scanCursor = i;
          for (let k = 0; k < n; k++) {
            if (grid.cells[k] && find(k) === root) {
              state.roles[k] = ROLE_CODES.current;
              state.islands[k] = root % 8;
            }
          }
          visited.push({
            label: `${coordLabel(grid, x, y, z)}↔${coordLabel(grid, nx, ny, nz)}`,
            cellIndex: i,
            islandId: root % 8,
          });
          yield {
            reason: `Union ${coordLabel(grid, x, y, z)} with ${coordLabel(grid, nx, ny, nz)} — component now size ${size[root]}.`,
            sourceLine: 10,
            state: cloneStepState(state),
            aux: dsuAux(parent, size, grid),
            visited: [...visited],
            metric: { label: "Max area", value: String(best) },
          };
        }
      }
    }
  }

  // paint components with distinct island ids
  state = cloneStepState(state);
  state.scanCursor = -1;
  const rootToId = new Map<number, number>();
  let nextId = 0;
  for (let i = 0; i < n; i++) {
    if (!grid.cells[i]) continue;
    const r = find(i);
    if (!rootToId.has(r)) rootToId.set(r, nextId++);
    state.islands[i] = rootToId.get(r)! % 8;
    state.roles[i] = ROLE_CODES.filled;
  }

  yield {
    reason: `DSU complete. Largest component: ${best} cells. ${nextId} islands total.`,
    sourceLine: 14,
    state: cloneStepState(state),
    aux: dsuAux(parent, size, grid),
    visited: [...visited],
    islandsFound: nextId,
    metric: { label: "Max area", value: String(best) },
  };
}

// Largest square of 1s (2D only — classic LeetCode 221)
export function* dpMaxSquareSteps(grid: Grid): Generator<AlgorithmStep> {
  if (grid.mode !== "2d") {
    const state = initialStepState(grid);
    yield {
      reason: "Largest-Square DP is a 2D-only demonstration. Switch to 2D view.",
      sourceLine: 1,
      state,
      aux: { kind: "dp-grid", width: 0, height: 0, values: [], best: 0 },
      visited: [],
    };
    return;
  }
  const g = grid;
  const W = g.width;
  const H = g.height;
  const dp = new Int32Array(W * H);
  let state = initialStepState(g);
  let best = 0;
  const visited: { label: string; cellIndex: number; islandId?: number }[] = [];

  yield {
    reason: "Build DP table. dp[y][x] = side length of the largest square ending at (x,y).",
    sourceLine: 2,
    state: cloneStepState(state),
    aux: dpAux(dp, W, H, best),
    visited: [...visited],
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      state = cloneStepState(state);
      state.scanCursor = i;

      if (!g.cells[i]) {
        state.values[i] = 0;
        state.labelMask[i] = 1;
        yield {
          reason: `Scan (${x},${y}) — cell is 0, dp stays 0.`,
          sourceLine: 4,
          state: cloneStepState(state),
          aux: dpAux(dp, W, H, best),
          visited: [...visited],
          metric: { label: "Side", value: String(best) },
        };
        continue;
      }

      const top = y > 0 ? dp[(y - 1) * W + x] : 0;
      const left = x > 0 ? dp[y * W + (x - 1)] : 0;
      const diag = x > 0 && y > 0 ? dp[(y - 1) * W + (x - 1)] : 0;
      dp[i] = Math.min(top, left, diag) + 1;
      best = Math.max(best, dp[i]);

      state = cloneStepState(state);
      state.scanCursor = i;
      state.roles[i] = ROLE_CODES.current;
      state.values[i] = dp[i];
      state.labelMask[i] = 1;
      visited.push({ label: `(${x},${y})=${dp[i]}`, cellIndex: i });

      yield {
        reason: `Scan (${x},${y}) — dp = min(${top},${left},${diag}) + 1 = ${dp[i]}.`,
        sourceLine: 7,
        state: cloneStepState(state),
        aux: dpAux(dp, W, H, best),
        visited: [...visited],
        metric: { label: "Side", value: String(best) },
      };
    }
  }

  // paint the best square
  state = cloneStepState(state);
  state.scanCursor = -1;
  outer: for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      if (dp[y * W + x] === best) {
        for (let dy = 0; dy < best; dy++) {
          for (let dx = 0; dx < best; dx++) {
            state.roles[(y - dy) * W + (x - dx)] = ROLE_CODES.path;
          }
        }
        break outer;
      }
    }
  }

  yield {
    reason: `Largest square side = ${best} (${best * best} cells).`,
    sourceLine: 10,
    state: cloneStepState(state),
    aux: dpAux(dp, W, H, best),
    visited: [...visited],
    metric: { label: "Side", value: String(best) },
  };
}

function dsuAux(parent: Int32Array, size: Int32Array, grid: Grid): AuxView {
  const seen = new Set<number>();
  const comps: { root: number; size: number; color: number }[] = [];
  for (let i = 0; i < parent.length; i++) {
    if (!grid.cells[i]) continue;
    let r = i;
    while (parent[r] !== r) r = parent[r];
    if (!seen.has(r)) {
      seen.add(r);
      comps.push({ root: r, size: size[r], color: r % 8 });
    }
  }
  comps.sort((a, b) => b.size - a.size);
  return { kind: "dsu", components: comps.slice(0, 8) };
}

function dpAux(dp: Int32Array, W: number, H: number, best: number): AuxView {
  return {
    kind: "dp-grid",
    width: W,
    height: H,
    values: Array.from(dp),
    best,
  };
}
