import { useMemo } from "react";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { initialStepState, materializeCells } from "@/lib/step-state";
import type { CellView } from "@/types";
import type { AlgorithmStep } from "@/algorithms/types";

export interface Materialized {
  cells: CellView[];
  step: AlgorithmStep | null;
}

export function useStepMaterialization(): Materialized {
  const grid = useVisualizerStore((s) => s.grid);
  const steps = useVisualizerStore((s) => s.steps);
  const index = useVisualizerStore((s) => s.currentIndex);

  return useMemo(() => {
    const step = steps[index] ?? null;
    const state = step?.state ?? initialStepState(grid);
    const cells = materializeCells(grid, state);
    return { cells, step };
  }, [grid, steps, index]);
}
