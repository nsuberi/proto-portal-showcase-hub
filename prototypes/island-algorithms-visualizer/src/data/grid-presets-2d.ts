import type { Grid2D } from "@/types";
import { createGrid2D } from "@/lib/grid";

function fromRows(rows: string[], weights?: (c: string) => number): Grid2D {
  const h = rows.length;
  const w = rows[0].length;
  const g = createGrid2D(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      g.cells[y * w + x] = weights ? weights(c) : c === "1" ? 1 : 0;
    }
  }
  return g;
}

export interface Preset2D {
  id: string;
  label: string;
  description: string;
  grid: Grid2D;
  weighted?: boolean;
}

export const PRESETS_2D: Preset2D[] = [
  {
    id: "two-islands",
    label: "Two Islands",
    description: "Two clear components — the canonical sanity check for island counting.",
    grid: fromRows([
      "0000000000",
      "0111000000",
      "0110000000",
      "0100000000",
      "0000000000",
      "0000001100",
      "0000011110",
      "0000011110",
      "0000000100",
      "0000000000",
    ]),
  },
  {
    id: "archipelago",
    label: "Archipelago",
    description: "Five small islands scattered — good for seeing BFS vs DFS start order.",
    grid: fromRows([
      "1100000110",
      "1000000010",
      "0000010000",
      "0000011000",
      "0110000000",
      "0010001100",
      "0000001000",
      "0100000000",
      "1100000011",
      "0000000001",
    ]),
  },
  {
    id: "one-mass",
    label: "One Mass",
    description: "One large connected region — great for watching the frontier expand.",
    grid: fromRows([
      "0011110000",
      "0111110000",
      "0111111000",
      "0011111100",
      "0001111110",
      "0001111100",
      "0000111100",
      "0000011000",
      "0000010000",
      "0000000000",
    ]),
  },
  {
    id: "diagonal",
    label: "Diagonal Trick",
    description: "Diagonally adjacent cells are NOT connected under 4-way rules. Count them.",
    grid: fromRows([
      "1000000000",
      "0100000000",
      "0010000000",
      "0001000000",
      "0000100000",
      "0000010000",
      "0000001000",
      "0000000100",
      "0000000010",
      "0000000001",
    ]),
  },
  {
    id: "weighted-terrain",
    label: "Weighted Terrain",
    description: "Costs 1–4 per cell — Dijkstra picks the cheap corridor, not the shortest hop count.",
    grid: fromRows(
      [
        "1112223333",
        "1112223333",
        "1112223333",
        "1114443333",
        "1114443333",
        "1114443333",
        "1111113333",
        "1111113333",
        "1111111113",
        "1111111111",
      ],
      (c) => {
        const n = parseInt(c, 10);
        return isNaN(n) ? 0 : n;
      },
    ),
    weighted: true,
  },
];
