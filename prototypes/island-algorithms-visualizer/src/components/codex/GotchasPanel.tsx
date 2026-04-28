import { useVisualizerStore } from "@/store/useVisualizerStore";
import { ALGORITHMS } from "@/algorithms/registry";
import { PRESETS_2D } from "@/data/grid-presets-2d";

export function GotchasPanel() {
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const preset2DId = useVisualizerStore((s) => s.preset2DId);
  const viewMode = useVisualizerStore((s) => s.viewMode);
  const meta = ALGORITHMS[algorithm].meta;

  const preset = PRESETS_2D.find((p) => p.id === preset2DId);
  const dijkstraOnUnweighted =
    algorithm === "dijkstra" && viewMode === "2d" && preset && !preset.weighted;

  return (
    <div className="space-y-2">
      {dijkstraOnUnweighted && (
        <div className="rounded border border-magenta/50 bg-magenta/5 px-3 py-2 text-[12px] leading-relaxed text-text">
          All edges cost 1 here — Dijkstra degenerates to BFS with heap overhead.
          Try the <strong className="text-magenta">Weighted Terrain</strong> preset
          to see it earn its keep.
        </div>
      )}
      <ul className="space-y-1.5 text-sm leading-relaxed text-text">
        {meta.gotchas.map((g, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-magenta" />
            <span>{g}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
