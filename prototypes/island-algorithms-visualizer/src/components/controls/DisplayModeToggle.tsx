import { useVisualizerStore } from "@/store/useVisualizerStore";
import clsx from "clsx";

export function DisplayModeToggle() {
  const displayMode = useVisualizerStore((s) => s.displayMode);
  const setDisplayMode = useVisualizerStore((s) => s.setDisplayMode);

  const OPTIONS: { id: "dots" | "digits"; label: string }[] = [
    { id: "dots", label: "Dots" },
    { id: "digits", label: "1 / 0" },
  ];

  return (
    <div className="inline-flex rounded border border-border bg-surface p-0.5 font-mono text-xs">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          className={clsx(
            "px-3 py-1.5 uppercase tracking-widest transition",
            displayMode === o.id
              ? "bg-cyan text-bg shadow-glow"
              : "text-text-mid hover:text-text",
          )}
          onClick={() => setDisplayMode(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
