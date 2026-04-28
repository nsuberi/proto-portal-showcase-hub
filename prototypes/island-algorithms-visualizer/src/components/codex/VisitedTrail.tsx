import { useStepMaterialization } from "@/hooks/useStepMaterialization";
import { islandCssVar } from "@/lib/color-mapping";

const MAX_ITEMS = 24;

export function VisitedTrail() {
  const { step } = useStepMaterialization();
  const items = step?.visited ?? [];
  const total = items.length;
  const shown = items.slice(-MAX_ITEMS);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cyan">
          Visited / finalized
        </span>
        <span className="font-mono text-[11px] text-text-mid">
          {total} cell{total === 1 ? "" : "s"}
          {total > MAX_ITEMS && ` (showing last ${MAX_ITEMS})`}
        </span>
      </div>
      {shown.length === 0 ? (
        <div className="text-xs text-text-mid">— none yet —</div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {shown.map((it, i) => (
            <span
              key={`${it.cellIndex}-${i}`}
              className="inline-flex items-center gap-1 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text"
            >
              {it.islandId != null && (
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ backgroundColor: islandCssVar(it.islandId) }}
                />
              )}
              {it.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
