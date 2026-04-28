/**
 * Anthropic Messages API tool-use protocol types — the minimal subset souschef needs.
 *
 * We intentionally don't depend on @anthropic-ai/sdk to keep the package light. The
 * shapes here mirror what `https://api.anthropic.com/v1/messages` returns when tool
 * use is in play.
 */

export type ModeName = "plan" | "edit";

export type StopReason =
  | "end_turn"
  | "tool_use"
  | "max_tokens"
  | "stop_sequence"
  | "max_turns";

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type AssistantContentBlock = TextBlock | ToolUseBlock;
export type UserContentBlock = TextBlock | ToolResultBlock;
export type ContentBlock = AssistantContentBlock | UserContentBlock;

export interface AssistantMessage {
  role: "assistant";
  content: AssistantContentBlock[];
}

export interface UserMessage {
  role: "user";
  /** Either a plain string (initial prompt) or structured content (tool results). */
  content: string | UserContentBlock[];
}

export type Message = AssistantMessage | UserMessage;

export interface ToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface MessagesRequest {
  model: string;
  system?: string;
  messages: Message[];
  tools?: ToolSchema[];
  max_tokens: number;
  temperature?: number;
}

export interface MessagesResponse {
  id: string;
  role: "assistant";
  model: string;
  content: AssistantContentBlock[];
  stop_reason: StopReason;
  stop_sequence: string | null;
  usage?: { input_tokens: number; output_tokens: number };
}
