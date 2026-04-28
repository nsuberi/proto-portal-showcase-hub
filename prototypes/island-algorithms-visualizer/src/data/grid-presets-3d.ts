import type { Grid3D } from "@/types";
import { createGrid3D, indexOf3D } from "@/lib/grid";

export interface Preset3D {
  id: string;
  label: string;
  description: string;
  grid: Grid3D;
}

function sparseCube(size: number, density: number, seed = 1): Grid3D {
  const g = createGrid3D(size, size, size);
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < g.cells.length; i++) {
    g.cells[i] = rand() < density ? 1 : 0;
  }
  return g;
}

function twoBlobs(): Grid3D {
  const g = createGrid3D(6, 6, 6);
  const fill = (x: number, y: number, z: number) => {
    if (x < 0 || y < 0 || z < 0 || x >= 6 || y >= 6 || z >= 6) return;
    g.cells[indexOf3D(g, x, y, z)] = 1;
  };
  // blob A at (1,1,1) radius 1
  for (let dz = -1; dz <= 1; dz++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) fill(1 + dx, 1 + dy, 1 + dz);
  // blob B at (4,4,4) radius 1
  for (let dz = -1; dz <= 1; dz++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) fill(4 + dx, 4 + dy, 4 + dz);
  return g;
}

function tunnelBridge(): Grid3D {
  const g = createGrid3D(6, 6, 6);
  // Left cube
  for (let z = 1; z <= 3; z++)
    for (let y = 1; y <= 3; y++) g.cells[indexOf3D(g, 0, y, z)] = 1;
  // Right cube
  for (let z = 1; z <= 3; z++)
    for (let y = 1; y <= 3; y++) g.cells[indexOf3D(g, 5, y, z)] = 1;
  // single-cell bridge
  g.cells[indexOf3D(g, 1, 2, 2)] = 1;
  g.cells[indexOf3D(g, 2, 2, 2)] = 1;
  g.cells[indexOf3D(g, 3, 2, 2)] = 1;
  g.cells[indexOf3D(g, 4, 2, 2)] = 1;
  return g;
}

export const PRESETS_3D: Preset3D[] = [
  {
    id: "sparse-cube",
    label: "Sparse Cube",
    description: "Random scatter — how many components emerge?",
    grid: sparseCube(6, 0.3, 7),
  },
  {
    id: "two-blobs",
    label: "Two Blobs",
    description: "Two disjoint 3×3×3 cubes — answer should be 2.",
    grid: twoBlobs(),
  },
  {
    id: "tunnel-bridge",
    label: "Tunnel Bridge",
    description: "Two slabs joined by a one-cell-wide tunnel — one connected region.",
    grid: tunnelBridge(),
  },
];
