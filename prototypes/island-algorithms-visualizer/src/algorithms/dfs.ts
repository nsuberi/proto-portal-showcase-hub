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

export function* dfsSteps(grid: Grid): Generator<AlgorithmStep> {
  let state = initialStepState(grid);
  let islandCount = 0;
  const width = grid.width;
  const height = grid.height;
  const depth = grid.mode === "3d" ? grid.depth : 1;
  const visited: { label: string; cellIndex: number; islandId?: number }[] = [];

  yield {
    reason: "Initialize: sweep every cell. Whenever we hit unvisited land, launch a DFS from it.",
    sourceLine: 2,
    state: cloneStepState(state),
    aux: { kind: "stack", items: [] },
    visited: [...visited],
  };

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const start = idxOf(grid, x, y, z);

        // Already-visited cells are filtered out silently — same as the real
        // algorithm's O(1) check — so the cursor never retreads a component.
        if (state.islands[start] !== 255) continue;

        // Scan step — visible outer-loop cursor
        state = cloneStepState(state);
        state.scanCursor = start;
        if (!grid.cells[start]) {
          yield {
            reason: `Scan ${coordLabel(grid, x, y, z)} — water, skip.`,
            sourceLine: 3,
            state: cloneStepState(state),
            aux: { kind: "stack", items: [] },
            visited: [...visited],
            islandsFound: islandCount,
          };
          continue;
        }

        // Start a fresh DFS from this land cell
        islandCount++;
        const islandId = islandCount - 1;
        const stack: { x: number; y: number; z: number }[] = [{ x, y, z }];
        state = cloneStepState(state);
        state.scanCursor = start;
        state.roles[start] = ROLE_CODES.current;
        state.islands[start] = islandId;

        yield {
          reason: `Scan ${coordLabel(grid, x, y, z)} — new island #${islandCount}! Push onto the stack.`,
          sourceLine: 5,
          state: cloneStepState(state),
          aux: stackAux(stack, grid),
          visited: [...visited],
          islandsFound: islandCount,
        };

        while (stack.length) {
          const top = stack[stack.length - 1];
          const ti = idxOf(grid, top.x, top.y, top.z);
          let pushed = false;

          for (const [nx, ny, nz] of neighborsOf(grid, top.x, top.y, top.z)) {
            const ni = idxOf(grid, nx, ny, nz);
            if (!grid.cells[ni]) continue;
            if (state.islands[ni] !== 255) continue;

            state = cloneStepState(state);
            state.scanCursor = start;
            state.roles[ni] = ROLE_CODES.current;
            state.islands[ni] = islandId;
            stack.push({ x: nx, y: ny, z: nz });
            pushed = true;

            yield {
              reason: `Push neighbor ${coordLabel(grid, nx, ny, nz)} — DFS dives deeper.`,
              sourceLine: 10,
              state: cloneStepState(state),
              aux: stackAux(stack, grid),
              visited: [...visited],
              islandsFound: islandCount,
            };
            break;
          }

          if (!pushed) {
            state = cloneStepState(state);
            state.scanCursor = start;
            state.roles[ti] = ROLE_CODES.visited;
            stack.pop();
            visited.push({
              label: coordLabel(grid, top.x, top.y, top.z),
              cellIndex: ti,
              islandId,
            });
            yield {
              reason: `No more neighbors — pop ${coordLabel(grid, top.x, top.y, top.z)} and backtrack.`,
              sourceLine: 13,
              state: cloneStepState(state),
              aux: stackAux(stack, grid),
              visited: [...visited],
              islandsFound: islandCount,
            };
          }
        }
      }
    }
  }

  state = cloneStepState(state);
  state.scanCursor = -1;
  yield {
    reason: `Scan complete — ${islandCount} connected component${islandCount === 1 ? "" : "s"} discovered.`,
    sourceLine: 16,
    state: cloneStepState(state),
    aux: { kind: "stack", items: [] },
    visited: [...visited],
    islandsFound: islandCount,
    metric: { label: "Islands", value: String(islandCount) },
  };
}

function stackAux(
  stack: { x: number; y: number; z: number }[],
  grid: Grid,
): AuxView {
  return {
    kind: "stack",
    items: stack.slice(-16).map((c) => ({
      label: coordLabel(grid, c.x, c.y, c.z),
      cellIndex: idxOf(grid, c.x, c.y, c.z),
    })),
  };
}
