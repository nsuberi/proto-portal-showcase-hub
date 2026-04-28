import type { Message, StopReason, ToolResultBlock, ToolUseBlock, ModeName } from "../model/types.js";

export type HookEvent = "PreToolUse" | "PostToolUse" | "Stop";

export interface PreToolUsePayload {
  call: ToolUseBlock;
  mode: ModeName;
}

export interface PostToolUsePayload {
  call: ToolUseBlock;
  result: ToolResultBlock;
  mode: ModeName;
}

export interface StopPayload {
  transcript: Message[];
  reason: StopReason;
  mode: ModeName;
}

export interface PreToolUseResult {
  /** If true, skip the tool call and return an error result to the model. */
  deny?: boolean;
  /** Reason surfaced to the model and audit log. */
  reason?: string;
}

export type HookFn =
  | ((payload: PreToolUsePayload) => Promise<PreToolUseResult | void> | PreToolUseResult | void)
  | ((payload: PostToolUsePayload) => Promise<void> | void)
  | ((payload: StopPayload) => Promise<void> | void);

export interface HookConfig {
  event: HookEvent;
  /** Path to a JS module exporting a default function. */
  module: string;
  /** Optional matchers (e.g. only fire in plan mode). */
  matcher?: {
    mode?: ModeName;
    tool?: string;
  };
}
