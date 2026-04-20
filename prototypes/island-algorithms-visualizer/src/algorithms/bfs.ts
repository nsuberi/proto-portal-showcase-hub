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

export function* bfsSteps(grid: Grid): Generator<AlgorithmStep> {
  let state = initialStepState(grid);
  let islandCount = 0;
  const width = grid.width;
  const height = grid.height;
  const depth = grid.mode === "3d" ? grid.depth : 1;
  const visited: { label: string; cellIndex: number; islandId?: number }[] = [];

  yield {
    reason: "Sweep every cell; whenever we find unvisited land, drop a BFS wave from it.",
    sourceLine: 2,
    state: cloneStepState(state),
    aux: { kind: "queue", items: [] },
    visited: [...visited],
  };

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const start = idxOf(grid, x, y, z);

        // Already-visited cells are filtered out silently — same as the real
        // algorithm's O(1) check — so the cursor never retreads a component.
        if (state.islands[start] !== 255) continue;

        state = cloneStepState(state);
        state.scanCursor = start;

        if (!grid.cells[start]) {
          yield {
            reason: `Scan ${coordLabel(grid, x, y, z)} — water, skip.`,
            sourceLine: 3,
            state: cloneStepState(state),
            aux: { kind: "queue", items: [] },
            visited: [...visited],
            islandsFound: islandCount,
          };
          continue;
        }

        islandCount++;
        const islandId = islandCount - 1;
        const queue: { x: number; y: number; z: number; d: number }[] = [];
        queue.push({ x, y, z, d: 0 });
        state = cloneStepState(state);
        state.scanCursor = start;
        state.roles[start] = ROLE_CODES.frontier;
        state.islands[start] = islandId;
        state.values[start] = 0;
        state.labelMask[start] = 1;

        yield {
          reason: `Scan ${coordLabel(grid, x, y, z)} — new island #${islandCount}! Enqueue at distance 0.`,
          sourceLine: 5,
          state: cloneStepState(state),
          aux: queueAux(queue, grid),
          visited: [...visited],
          islandsFound: islandCount,
        };

        while (queue.length) {
          const head = queue.shift()!;
          const hi = idxOf(grid, head.x, head.y, head.z);
          state = cloneStepState(state);
          state.scanCursor = start;
          state.roles[hi] = ROLE_CODES.current;

          yield {
            reason: `Dequeue ${coordLabel(grid, head.x, head.y, head.z)} — process this wave cell.`,
            sourceLine: 9,
            state: cloneStepState(state),
            aux: queueAux(queue, grid),
            visited: [...visited],
            islandsFound: islandCount,
          };

          for (const [nx, ny, nz] of neighborsOf(grid, head.x, head.y, head.z)) {
            const ni = idxOf(grid, nx, ny, nz);
            if (!grid.cells[ni]) continue;
            if (state.islands[ni] !== 255) continue;

            state = cloneStepState(state);
            state.scanCursor = start;
            state.roles[ni] = ROLE_CODES.frontier;
            state.islands[ni] = islandId;
            state.values[ni] = head.d + 1;
            state.labelMask[ni] = 1;
            queue.push({ x: nx, y: ny, z: nz, d: head.d + 1 });

            yield {
              reason: `Enqueue ${coordLabel(grid, nx, ny, nz)} at distance ${head.d + 1}.`,
              sourceLine: 12,
              state: cloneStepState(state),
              aux: queueAux(queue, grid),
              visited: [...visited],
              islandsFound: islandCount,
            };
          }

          state = cloneStepState(state);
          state.scanCursor = start;
          state.roles[hi] = ROLE_CODES.visited;
          visited.push({
            label: coordLabel(grid, head.x, head.y, head.z),
            cellIndex: hi,
            islandId,
          });
        }
      }
    }
  }

  state = cloneStepState(state);
  state.scanCursor = -1;
  yield {
    reason: `BFS done — ${islandCount} component${islandCount === 1 ? "" : "s"}; labels show distance from each source.`,
    sourceLine: 17,
    state: cloneStepState(state),
    aux: { kind: "queue", items: [] },
    visited: [...visited],
    islandsFound: islandCount,
    metric: { label: "Islands", value: String(islandCount) },
  };
}

function queueAux(
  queue: { x: number; y: number; z: number; d: number }[],
  grid: Grid,
): AuxView {
  return {
    kind: "queue",
    items: queue.slice(0, 16).map((c) => ({
      label: `${coordLabel(grid, c.x, c.y, c.z)}·d${c.d}`,
      cellIndex: idxOf(grid, c.x, c.y, c.z),
      priority: c.d,
    })),
  };
}
