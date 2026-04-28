import type { Grid, Grid2D, Grid3D } from "@/types";

export function createGrid2D(width: number, height: number): Grid2D {
  return { mode: "2d", width, height, cells: new Uint8Array(width * height) };
}

export function createGrid3D(width: number, height: number, depth: number): Grid3D {
  return {
    mode: "3d",
    width,
    height,
    depth,
    cells: new Uint8Array(width * height * depth),
  };
}

export function indexOf2D(g: Grid2D, x: number, y: number): number {
  return y * g.width + x;
}

export function indexOf3D(g: Grid3D, x: number, y: number, z: number): number {
  return z * g.width * g.height + y * g.width + x;
}

export function inBounds2D(g: Grid2D, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < g.width && y < g.height;
}

export function inBounds3D(g: Grid3D, x: number, y: number, z: number): boolean {
  return (
    x >= 0 &&
    y >= 0 &&
    z >= 0 &&
    x < g.width &&
    y < g.height &&
    z < g.depth
  );
}

export function cloneGrid(g: Grid): Grid {
  if (g.mode === "2d") {
    return { ...g, cells: new Uint8Array(g.cells) };
  }
  return { ...g, cells: new Uint8Array(g.cells) };
}

export function toggleCell2D(g: Grid2D, x: number, y: number): Grid2D {
  const next = cloneGrid(g) as Grid2D;
  const i = indexOf2D(next, x, y);
  next.cells[i] = next.cells[i] ? 0 : 1;
  return next;
}

export function toggleCell3D(g: Grid3D, x: number, y: number, z: number): Grid3D {
  const next = cloneGrid(g) as Grid3D;
  const i = indexOf3D(next, x, y, z);
  next.cells[i] = next.cells[i] ? 0 : 1;
  return next;
}

export function randomize(g: Grid, density = 0.45, weighted = false): Grid {
  const next = cloneGrid(g);
  for (let i = 0; i < next.cells.length; i++) {
    if (Math.random() < density) {
      next.cells[i] = weighted ? 1 + Math.floor(Math.random() * 4) : 1;
    } else {
      next.cells[i] = 0;
    }
  }
  return next;
}

export function totalCells(g: Grid): number {
  return g.cells.length;
}
