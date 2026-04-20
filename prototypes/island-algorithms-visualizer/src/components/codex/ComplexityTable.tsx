import { useVisualizerStore } from "@/store/useVisualizerStore";
import { ALGORITHMS } from "@/algorithms/registry";

export function ComplexityTable() {
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const meta = ALGORITHMS[algorithm].meta;
  return (
    <div className="grid grid-cols-2 gap-2 font-mono">
      <Stat label="Time" value={meta.bigO.time} />
      <Stat label="Space" value={meta.bigO.space} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-surface px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-text-mid">{label}</div>
      <div className="mt-0.5 text-sm text-cyan">{value}</div>
    </div>
  );
}
