import { useVisualizerStore } from "@/store/useVisualizerStore";
import type { Grid } from "@/types";
import clsx from "clsx";

export function DigitsGridView() {
  const grid = useVisualizerStore((s) => s.grid);
  const toggleCell = useVisualizerStore((s) => s.toggleCell);

  return (
    <div className="flex h-full w-full flex-col overflow-auto rounded-lg border border-border bg-bg p-4">
      <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-text-mid">
        <span>Raw grid values — no algorithm overlay</span>
        <span>{grid.mode === "2d" ? "click a cell to toggle" : "read-only in 3D"}</span>
      </div>
      {grid.mode === "2d" ? (
        <Slice2D grid={grid} interactive onToggle={(x, y) => toggleCell(x, y)} />
      ) : (
        <Stack3D grid={grid} />
      )}
    </div>
  );
}

function Slice2D({
  grid,
  zOffset = 0,
  zLayer = 0,
  interactive = false,
  onToggle,
}: {
  grid: Grid;
  zOffset?: number;
  zLayer?: number;
  interactive?: boolean;
  onToggle?: (x: number, y: number) => void;
}) {
  const cells: number[] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const i = zOffset + y * grid.width + x;
      cells.push(grid.cells[i]);
    }
  }

  return (
    <div className="inline-block">
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${grid.width}, minmax(1.5rem, 1fr))`,
        }}
      >
        {cells.map((v, i) => {
          const x = i % grid.width;
          const y = Math.floor(i / grid.width);
          const content = (
            <span
              className={clsx(
                "flex h-7 w-full items-center justify-center rounded-sm border font-mono text-sm",
                v > 0
                  ? "border-cyan/40 bg-cyan/5 text-cyan"
                  : "border-border bg-surface text-text-dim",
              )}
            >
              {v}
            </span>
          );
          if (!interactive) {
            return (
              <div key={`${zLayer}-${i}`} className="flex w-full items-center justify-center">
                {content}
              </div>
            );
          }
          return (
            <button
              key={`${zLayer}-${i}`}
              type="button"
              onClick={() => onToggle?.(x, y)}
              className="flex w-full items-center justify-center transition hover:opacity-80"
              aria-label={`Toggle (${x},${y})`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stack3D({ grid }: { grid: Grid }) {
  if (grid.mode !== "3d") return null;
  const plane = grid.width * grid.height;
  const slices = Array.from({ length: grid.depth }, (_, z) => z);
  return (
    <div className="flex flex-wrap gap-4">
      {slices.map((z) => (
        <div key={z} className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-cyan">
            z = {z}
          </div>
          <Slice2D grid={grid} zOffset={z * plane} zLayer={z} />
        </div>
      ))}
    </div>
  );
}
