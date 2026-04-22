import { useStepMaterialization } from "@/hooks/useStepMaterialization";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { ALGORITHMS } from "@/algorithms/registry";
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
  if (aux.kind === "dist-map") {
    return (
      <div className="space-y-3">
        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-mid">
            dist[] · parent[]
          </div>
          {aux.rows.length === 0 ? (
            <div className="text-xs text-text-mid">— empty —</div>
          ) : (
            <div className="overflow-hidden rounded border border-border">
              <table className="w-full font-mono text-[11px]">
                <thead className="bg-surface text-text-mid">
                  <tr>
                    <th className="px-2 py-1 text-left font-normal">cell</th>
                    <th className="px-2 py-1 text-right font-normal">dist</th>
                    <th className="px-2 py-1 text-left font-normal">parent</th>
                  </tr>
                </thead>
                <tbody>
                  {aux.rows.map((row) => (
                    <tr
                      key={row.cellIndex}
                      className={clsx(
                        "border-t border-border",
                        row.finalized && "bg-cyan/5 text-cyan",
                      )}
                    >
                      <td className="px-2 py-0.5">{row.label}</td>
                      <td className="px-2 py-0.5 text-right">
                        {Number.isFinite(row.dist) ? row.dist : "∞"}
                      </td>
                      <td className="px-2 py-0.5 text-text-mid">{row.parent ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {aux.heapTop.length > 0 && (
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-mid">
              heap (min →)
            </div>
            <div className="flex flex-wrap gap-1">
              {aux.heapTop.map((item, i) => (
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
          </div>
        )}
      </div>
    );
  }
  if (aux.kind === "dsu-arrays") {
    const n = aux.parent.length;
    const indices: number[] = [];
    for (let i = 0; i < n; i++) if (aux.gridMask[i]) indices.push(i);
    return (
      <div className="space-y-3">
        <ArrayStrip
          label="index"
          values={indices}
          formatter={(v) => String(v)}
          highlight={aux.highlight}
          muted
        />
        <ArrayStrip
          label="parent[]"
          values={indices.map((i) => aux.parent[i])}
          indices={indices}
          formatter={(v) => String(v)}
          highlight={aux.highlight}
        />
        <ArrayStrip
          label="size[]"
          values={indices.map((i) => aux.size[i])}
          indices={indices}
          formatter={(v) => String(v)}
          highlight={aux.highlight}
        />
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

function ArrayStrip({
  label,
  values,
  indices,
  formatter,
  highlight,
  muted = false,
}: {
  label: string;
  values: number[];
  indices?: number[];
  formatter: (v: number) => string;
  highlight: number;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-mid">
        {label}
      </div>
      <div className="flex flex-wrap gap-0.5">
        {values.map((v, i) => {
          const refIdx = indices ? indices[i] : v;
          const isHi = refIdx === highlight;
          return (
            <span
              key={i}
              className={clsx(
                "min-w-[1.75rem] rounded border px-1 py-0.5 text-center font-mono text-[10px]",
                isHi
                  ? "border-cyan bg-cyan/10 text-cyan"
                  : muted
                    ? "border-border bg-transparent text-text-mid"
                    : "border-border bg-surface text-text",
              )}
            >
              {formatter(v)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
