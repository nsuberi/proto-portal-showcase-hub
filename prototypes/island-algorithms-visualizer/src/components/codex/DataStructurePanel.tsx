import { useStepMaterialization } from "@/hooks/useStepMaterialization";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { ALGORITHMS } from "@/algorithms/registry";
import { islandCssVar } from "@/lib/color-mapping";
import type { AuxView } from "@/algorithms/types";
import clsx from "clsx";

export function DataStructurePanel() {
  const { step } = useStepMaterialization();
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const meta = ALGORITHMS[algorithm].meta;
  const aux: AuxView = step?.aux ?? { kind: "none" };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cyan">
          Data structure
        </span>
        <span className="font-mono text-[11px] text-text-mid">{meta.dataStructure}</span>
      </div>
      <AuxBody aux={aux} />
    </div>
  );
}

function AuxBody({ aux }: { aux: AuxView }) {
  if (aux.kind === "none") {
    return <div className="text-xs text-text-mid">— idle —</div>;
  }
  if (aux.kind === "stack" || aux.kind === "queue" || aux.kind === "heap") {
    if (aux.items.length === 0) {
      return <div className="text-xs text-text-mid">— empty —</div>;
    }
    const dirLabel =
      aux.kind === "stack" ? "top →" : aux.kind === "queue" ? "head →" : "min →";
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-mid">
          {dirLabel}
        </span>
        {aux.items.map((item, i) => (
          <span
            key={i}
            className={clsx(
              "rounded border px-2 py-0.5 font-mono text-[11px]",
              i === 0
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-border bg-surface text-text",
            )}
          >
            {item.label}
          </span>
        ))}
      </div>
    );
  }
  if (aux.kind === "dsu") {
    return (
      <div className="space-y-1">
        {aux.components.map((c) => (
          <div key={c.root} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: islandCssVar(c.color) }}
            />
            <span className="font-mono text-text-mid">root</span>
            <span className="font-mono text-text">{c.root}</span>
            <span className="ml-auto font-mono text-cyan">size {c.size}</span>
          </div>
        ))}
      </div>
    );
  }
  if (aux.kind === "dp-grid") {
    return (
      <div className="overflow-x-auto">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${aux.width}, minmax(0, 1fr))` }}
        >
          {aux.values.map((v, i) => (
            <div
              key={i}
              className="flex h-6 w-full items-center justify-center rounded-sm border font-mono text-[10px]"
              style={{
                borderColor: v === aux.best && v > 0 ? "var(--cyan)" : "var(--border)",
                color: v > 0 ? "var(--cyan)" : "var(--text-dim)",
                backgroundColor: "var(--surface)",
              }}
            >
              {v}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
