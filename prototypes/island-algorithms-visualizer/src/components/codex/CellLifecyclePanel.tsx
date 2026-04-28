import { useVisualizerStore } from "@/store/useVisualizerStore";
import { islandCssVar } from "@/lib/color-mapping";

export function CellLifecyclePanel() {
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const isBFS = algorithm === "bfs";

  return (
    <div className="space-y-3 text-xs leading-relaxed text-text">
      <p>
        During a traversal, each cell is touched in two distinct moments —
        that is why you see the same dot change color twice:
      </p>

      <ol className="space-y-2">
        <li className="flex gap-2">
          <Chip variant="white" />
          <div>
            <div className="font-medium">
              1. White — <span className="text-text-mid">being processed right now</span>
            </div>
            <div className="text-text-mid">
              {isBFS
                ? "The cell has just been dequeued. The algorithm is looking at its neighbors to decide what to enqueue next."
                : "The cell is on top of the stack. The algorithm is about to look at its neighbors, or has just arrived here."}
            </div>
          </div>
        </li>

        {isBFS && (
          <li className="flex gap-2">
            <Chip variant="mixed" />
            <div>
              <div className="font-medium">
                2. Tinted (island color + white) — <span className="text-text-mid">in the queue, waiting</span>
              </div>
              <div className="text-text-mid">
                The cell has been discovered and enqueued, but its neighbors
                haven't been scanned yet.
              </div>
            </div>
          </li>
        )}

        <li className="flex gap-2">
          <Chip variant="island" />
          <div>
            <div className="font-medium">
              {isBFS ? "3" : "2"}. Island color —{" "}
              <span className="text-text-mid">finalized, belongs to component N</span>
            </div>
            <div className="text-text-mid">
              {isBFS
                ? "The cell has been processed — its neighbors are already in the queue or finalized. It now shows the color of its connected component."
                : "The cell has been popped off the stack; the algorithm has fully explored from it and backtracked. It now shows the color of its connected component."}
            </div>
          </div>
        </li>
      </ol>

      <p className="text-text-mid">
        The first color tells you <em>where the algorithm is looking</em>. The
        second color tells you <em>which connected component the cell belongs to</em>.
      </p>
    </div>
  );
}

type ChipVariant = "white" | "mixed" | "island";

function Chip({ variant }: { variant: ChipVariant }) {
  const style: React.CSSProperties =
    variant === "mixed"
      ? {
          backgroundImage: `linear-gradient(135deg, ${islandCssVar(0)} 0%, var(--cell-current) 100%)`,
        }
      : variant === "white"
        ? { backgroundColor: "var(--cell-current)" }
        : { backgroundColor: islandCssVar(0) };
  return (
    <span
      className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full border border-border"
      style={style}
    />
  );
}
