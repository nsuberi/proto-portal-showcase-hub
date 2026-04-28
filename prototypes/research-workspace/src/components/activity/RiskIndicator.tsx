import type { RiskLevel } from "../../types/tool-calls";

const RISK_CLASSES: Record<RiskLevel, string> = {
  safe: "bg-accent-success",
  modifiable: "bg-tertiary",
  caution: "bg-tertiary",
  destructive: "bg-error",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  safe: "Read-only, safe",
  modifiable: "Modifiable, can be undone",
  caution: "Use caution",
  destructive: "Irreversible action",
};

export default function RiskIndicator({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${RISK_CLASSES[level]}`}
      title={RISK_LABELS[level]}
    />
  );
}
