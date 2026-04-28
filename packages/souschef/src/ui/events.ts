import type {
  AssistantContentBlock,
  ModeName,
  StopReason,
  ToolResultBlock,
  ToolUseBlock,
} from "../model/types.js";

export interface ClarifyOption {
  id: string;
  label: string;
}

export interface ClarifyRequestPayload {
  id: string;
  question: string;
  context?: string;
  options: ClarifyOption[];
  allowMultiple: boolean;
}

export interface PermissionRequestPayload {
  id: string;
  call: ToolUseBlock;
  canonicalArg?: string;
}

export type SessionEvent =
  | { type: "session-start"; mode: ModeName; model: string }
  | { type: "session-end" }
  | { type: "awaiting-user-input" }
  | { type: "user-message"; text: string }
  | { type: "turn-started"; turn: number }
  | { type: "assistant-message"; content: AssistantContentBlock[] }
  | { type: "tool-call"; call: ToolUseBlock }
  | { type: "tool-result"; call: ToolUseBlock; result: ToolResultBlock }
  | { type: "permission-request"; payload: PermissionRequestPayload }
  | { type: "clarify-request"; payload: ClarifyRequestPayload }
  | { type: "mode-changed"; mode: ModeName }
  | { type: "transcript-cleared" }
  | { type: "info"; text: string }
  | { type: "error"; text: string }
  | { type: "stop"; reason: StopReason };

export type SessionEventType = SessionEvent["type"];
