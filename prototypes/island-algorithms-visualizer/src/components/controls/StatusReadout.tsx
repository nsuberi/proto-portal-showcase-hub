import { useStepMaterialization } from "@/hooks/useStepMaterialization";
import { useVisualizerStore } from "@/store/useVisualizerStore";

export function StatusReadout() {
  const { step } = useStepMaterialization();
  const index = useVisualizerStore((s) => s.currentIndex);
  const total = useVisualizerStore((s) => s.steps.length);

  return (
    <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-widest text-text-mid">
      <span>
        Step <span className="text-cyan">{index + 1}</span> / {total}
      </span>
      {step?.islandsFound != null && (
        <span>
          Islands <span className="text-cyan">{step.islandsFound}</span>
        </span>
      )}
      {step?.metric && (
        <span>
          {step.metric.label} <span className="text-cyan">{step.metric.value}</span>
        </span>
      )}
    </div>
  );
}
