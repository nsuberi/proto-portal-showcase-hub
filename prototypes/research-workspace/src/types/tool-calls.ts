export type ToolCallStatus = "pending" | "running" | "completed" | "blocked" | "failed";

export type RiskLevel = "safe" | "modifiable" | "caution" | "destructive";

export type AttentionLayer = "ambient" | "progress" | "attention" | "summary";

export interface ToolEvent {
  timestamp: string;
  tool: string;
  input: Record<string, unknown>;
  decision: "allow" | "block";
  reason?: string;
  runId?: string;
  runTitle?: string;
}

export interface Run {
  id: string;
  title: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  finishedAt: string | null;
  toolCount: number;
  intentionId: string | null;
}

export interface ToolCall {
  id: string;
  runId: string;
  tool: string;
  input: Record<string, unknown>;
  decision: "allow" | "block";
  reason?: string;
  timestamp: string;
  status: ToolCallStatus;
  description: string;
  riskLevel: RiskLevel;
  durationMs?: number;
}

export interface RunWithCalls {
  id: string;
  title: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  finishedAt: string | null;
  toolCalls: ToolCall[];
  elapsedMs: number;
  attentionLevel: AttentionLayer;
}

export interface RunSummary {
  totalCalls: number;
  byTool: Record<string, number>;
  blockedCount: number;
  filesRead: string[];
  filesWritten: string[];
}
