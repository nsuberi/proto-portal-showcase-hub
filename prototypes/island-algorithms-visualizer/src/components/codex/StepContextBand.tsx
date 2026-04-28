import { useStepMaterialization } from "@/hooks/useStepMaterialization";

export function StepContextBand() {
  const { step } = useStepMaterialization();
  if (!step) return null;
  return (
    <div className="rounded border-l-2 border-cyan bg-surface/70 px-3 py-2 text-sm leading-relaxed text-text">
      {step.reason}
    </div>
  );
}
