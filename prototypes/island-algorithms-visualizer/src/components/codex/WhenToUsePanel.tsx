import { useVisualizerStore } from "@/store/useVisualizerStore";
import { ALGORITHMS } from "@/algorithms/registry";

export function WhenToUsePanel() {
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const meta = ALGORITHMS[algorithm].meta;
  return (
    <ul className="space-y-1 text-sm leading-relaxed text-text">
      {meta.whenToUse.map((line, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-cyan" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
