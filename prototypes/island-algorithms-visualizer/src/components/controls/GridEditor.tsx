import { useVisualizerStore } from "@/store/useVisualizerStore";
import { PRESETS_2D } from "@/data/grid-presets-2d";
import { PRESETS_3D } from "@/data/grid-presets-3d";
import clsx from "clsx";

export function GridEditor() {
  const viewMode = useVisualizerStore((s) => s.viewMode);
  const preset2DId = useVisualizerStore((s) => s.preset2DId);
  const preset3DId = useVisualizerStore((s) => s.preset3DId);
  const loadPreset = useVisualizerStore((s) => s.loadPreset);

  const presets = viewMode === "2d" ? PRESETS_2D : PRESETS_3D;
  const currentId = viewMode === "2d" ? preset2DId : preset3DId;
  const currentPreset = presets.find((p) => p.id === currentId);

  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-cyan">
        Grid preset
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => loadPreset(p.id)}
            className={clsx(
              "rounded border px-3 py-1.5 text-left text-xs transition",
              currentId === p.id
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-border bg-surface text-text-mid hover:border-cyan-dim hover:text-text",
            )}
          >
            <div className="font-mono font-medium">{p.label}</div>
          </button>
        ))}
      </div>
      {currentPreset && (
        <p className="mt-2 text-[11px] leading-relaxed text-text-mid">
          {currentPreset.description}
        </p>
      )}
      {viewMode === "2d" && (
        <p className="mt-2 text-[10px] uppercase tracking-widest text-text-dim">
          Click a cell to toggle
        </p>
      )}
    </div>
  );
}
