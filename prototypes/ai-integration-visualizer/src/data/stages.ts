import type { StageDefinition } from "../types";

// design-token-lint-ignore
export const STAGES: StageDefinition[] = [
  {
    id: "intake",
    label: "INTAKE",
    description: "Capturing and ingesting data from customers and systems",
    color: "#d97706",
    readinessLevel: 1,
    readinessTitle: "Understand Your Data",
    readinessNarrative:
      "Before applying AI, understand what data enters the system and how. Make intake structured, observable, and spec-compliant.",
    nodeIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 48, 49],
  },
  {
    id: "transform",
    label: "TRANSFORMATION",
    description: "Enriching, classifying, and storing data reliably",
    color: "#8b5cf6",
    readinessLevel: 2,
    readinessTitle: "Build Reliable Specs",
    readinessNarrative:
      "Build pipelines that classify, parse, enrich, and warehouse data. Create the single source of truth that AI models draw from.",
    nodeIds: [13, 14, 15, 16, 23, 38, 39, 40, 41, 42, 43, 44, 45],
  },
  {
    id: "decide",
    label: "DECISION",
    description: "Scoring, compliance, approvals, and intelligent routing",
    color: "#3b82f6",
    readinessLevel: 3,
    readinessTitle: "Apply Intelligence",
    readinessNarrative:
      "Clean data enables intelligent decisions. Replace hardcoded rules with models that learn. This is where AI has the highest-leverage impact.",
    nodeIds: [10, 11, 17, 18, 24, 25, 26, 27, 28, 29, 33, 34, 35, 36, 47],
  },
  {
    id: "act",
    label: "ACTION",
    description: "Communications, services, delivery, and new products",
    color: "#10b981",
    readinessLevel: 4,
    readinessTitle: "Build New Experiences",
    readinessNarrative:
      "With solid AI foundations, create customer-facing capabilities that were previously impossible. New products and interfaces that accomplish business goals.",
    nodeIds: [19, 20, 21, 22, 30, 31, 32, 37, 46, 50, 51, 52, 53, 54],
  },
];

export function getStageForNode(
  nodeId: number
): StageDefinition | undefined {
  return STAGES.find((s) => s.nodeIds.includes(nodeId));
}

export function getStageColor(nodeId: number): string {
  return getStageForNode(nodeId)?.color ?? "#52525b";
}
