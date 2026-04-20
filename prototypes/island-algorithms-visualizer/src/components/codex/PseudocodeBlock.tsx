import { useStepMaterialization } from "@/hooks/useStepMaterialization";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { ALGORITHMS } from "@/algorithms/registry";
import { THREE_RGBA } from "@/lib/color-mapping";

export function PseudocodeBlock() {
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const meta = ALGORITHMS[algorithm].meta;
  const { step } = useStepMaterialization();
  const highlight = step?.sourceLine ?? -1;
  const lines = meta.pseudocode.split("\n");

  return (
    <pre className="overflow-x-auto rounded border border-border bg-bg p-3 text-[11px] leading-[1.5]">
      {lines.map((line, i) => {
        const isActive = i + 1 === highlight;
        return (
          <code
            key={i}
            className="block whitespace-pre"
            style={{
              color: isActive ? "var(--cyan)" : "var(--text)",
              backgroundColor: isActive ? THREE_RGBA.pseudocodeHighlight : "transparent",
              borderLeft: isActive
                ? "2px solid var(--cyan)"
                : "2px solid transparent",
              paddingLeft: "0.5rem",
            }}
          >
            {line || " "}
          </code>
        );
      })}
    </pre>
  );
}
