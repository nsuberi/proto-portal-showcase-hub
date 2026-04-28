import { useVisualizerStore } from "@/store/useVisualizerStore";
import clsx from "clsx";

export function ViewModeToggle() {
  const viewMode = useVisualizerStore((s) => s.viewMode);
  const setViewMode = useVisualizerStore((s) => s.setViewMode);

  return (
    <div className="inline-flex rounded border border-border bg-surface p-0.5 font-mono text-xs">
      {(["2d", "3d"] as const).map((m) => (
        <button
          key={m}
          type="button"
          className={clsx(
            "px-3 py-1.5 uppercase tracking-widest transition",
            viewMode === m
              ? "bg-cyan text-bg shadow-glow"
              : "text-text-mid hover:text-text",
          )}
          onClick={() => setViewMode(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
