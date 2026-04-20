import { create } from "zustand";
import type { AlgorithmId, Grid, ViewMode } from "@/types";
import type { AlgorithmStep } from "@/algorithms/types";
import { ALGORITHMS } from "@/algorithms/registry";
import { PRESETS_2D } from "@/data/grid-presets-2d";
import { PRESETS_3D } from "@/data/grid-presets-3d";
import { toggleCell2D, toggleCell3D } from "@/lib/grid";

interface StoreState {
  viewMode: ViewMode;
  algorithm: AlgorithmId;
  preset2DId: string;
  preset3DId: string;
  grid: Grid;
  steps: AlgorithmStep[];
  currentIndex: number;
  isPlaying: boolean;
  fps: number;

  setViewMode: (mode: ViewMode) => void;
  setAlgorithm: (id: AlgorithmId) => void;
  loadPreset: (id: string) => void;
  toggleCell: (x: number, y: number, z?: number) => void;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setIndex: (i: number) => void;
  setFps: (f: number) => void;
  reset: () => void;
}

function runAlgorithm(id: AlgorithmId, grid: Grid): AlgorithmStep[] {
  const entry = ALGORITHMS[id];
  return Array.from(entry.runner(grid));
}

const initial2D = PRESETS_2D[0];
const initialSteps = runAlgorithm("dfs", initial2D.grid);

export const useVisualizerStore = create<StoreState>((set, get) => ({
  viewMode: "2d",
  algorithm: "dfs",
  preset2DId: initial2D.id,
  preset3DId: PRESETS_3D[0].id,
  grid: initial2D.grid,
  steps: initialSteps,
  currentIndex: 0,
  isPlaying: false,
  fps: 6,

  setViewMode: (mode) => {
    const { algorithm } = get();
    const preset = mode === "2d" ? PRESETS_2D[0] : PRESETS_3D[0];
    const grid = preset.grid;
    const steps = runAlgorithm(algorithm, grid);
    set({
      viewMode: mode,
      grid,
      preset2DId: mode === "2d" ? preset.id : get().preset2DId,
      preset3DId: mode === "3d" ? preset.id : get().preset3DId,
      steps,
      currentIndex: 0,
      isPlaying: false,
    });
  },

  setAlgorithm: (id) => {
    const { grid } = get();
    const steps = runAlgorithm(id, grid);
    set({ algorithm: id, steps, currentIndex: 0, isPlaying: false });
  },

  loadPreset: (id) => {
    const { viewMode, algorithm } = get();
    const pool = viewMode === "2d" ? PRESETS_2D : PRESETS_3D;
    const preset = pool.find((p) => p.id === id);
    if (!preset) return;
    const steps = runAlgorithm(algorithm, preset.grid);
    set({
      grid: preset.grid,
      preset2DId: viewMode === "2d" ? id : get().preset2DId,
      preset3DId: viewMode === "3d" ? id : get().preset3DId,
      steps,
      currentIndex: 0,
      isPlaying: false,
    });
  },

  toggleCell: (x, y, z = 0) => {
    const { grid, algorithm } = get();
    const next =
      grid.mode === "2d"
        ? toggleCell2D(grid, x, y)
        : toggleCell3D(grid, x, y, z);
    const steps = runAlgorithm(algorithm, next);
    set({ grid: next, steps, currentIndex: 0, isPlaying: false });
  },

  play: () => {
    const { currentIndex, steps } = get();
    if (currentIndex >= steps.length - 1) set({ currentIndex: 0 });
    set({ isPlaying: true });
  },
  pause: () => set({ isPlaying: false }),
  togglePlay: () => (get().isPlaying ? get().pause() : get().play()),
  stepForward: () => {
    const { currentIndex, steps } = get();
    if (currentIndex < steps.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      set({ isPlaying: false });
    }
  },
  stepBackward: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1, isPlaying: false });
  },
  setIndex: (i) => {
    const { steps } = get();
    const clamped = Math.max(0, Math.min(steps.length - 1, i));
    set({ currentIndex: clamped, isPlaying: false });
  },
  setFps: (f) => set({ fps: Math.max(1, Math.min(60, f)) }),
  reset: () => set({ currentIndex: 0, isPlaying: false }),
}));
