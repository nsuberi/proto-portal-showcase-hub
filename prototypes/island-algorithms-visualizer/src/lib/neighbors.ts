import type { Grid2D, Grid3D } from "@/types";
import { inBounds2D, inBounds3D } from "./grid";

const DIRS_2D: ReadonlyArray<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const DIRS_3D: ReadonlyArray<[number, number, number]> = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export function* neighbors2D(
  g: Grid2D,
  x: number,
  y: number,
): Generator<[number, number]> {
  for (const [dx, dy] of DIRS_2D) {
    const nx = x + dx;
    const ny = y + dy;
    if (inBounds2D(g, nx, ny)) yield [nx, ny];
  }
}

export function* neighbors3D(
  g: Grid3D,
  x: number,
  y: number,
  z: number,
): Generator<[number, number, number]> {
  for (const [dx, dy, dz] of DIRS_3D) {
    const nx = x + dx;
    const ny = y + dy;
    const nz = z + dz;
    if (inBounds3D(g, nx, ny, nz)) yield [nx, ny, nz];
  }
}
