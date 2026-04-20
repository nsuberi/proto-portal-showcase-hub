import { useVisualizerStore } from "@/store/useVisualizerStore";
import { ALGORITHMS, ALGORITHM_ORDER } from "@/algorithms/registry";
import clsx from "clsx";

export function AlgorithmPicker() {
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const setAlgorithm = useVisualizerStore((s) => s.setAlgorithm);

  return (
    <div className="flex flex-wrap gap-1.5">
      {ALGORITHM_ORDER.map((id) => {
        const entry = ALGORITHMS[id];
        const active = algorithm === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setAlgorithm(id)}
            className={clsx(
              "rounded border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition",
              active
                ? "border-cyan bg-cyan/10 text-cyan shadow-glow"
                : "border-border bg-surface text-text-mid hover:border-cyan-dim hover:text-text",
            )}
          >
            {entry.meta.label}
          </button>
        );
      })}
    </div>
  );
}
