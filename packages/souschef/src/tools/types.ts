import type { ToolSchema, ToolUseBlock, ToolResultBlock } from "../model/types.js";

export interface ToolContext {
  /** Workspace root — all tool paths are resolved against this. */
  cwd: string;
}

export interface ToolDefinition {
  schema: ToolSchema;
  /** Whether this tool mutates state (writes files, runs shell, etc.). */
  mutating: boolean;
  /**
   * The canonical "argument" used for permission policy matching, e.g. the path for
   * `read-file` or the command for `run-shell`. Returns undefined for tools where
   * arg-pattern matching doesn't make sense.
   */
  canonicalArg(call: ToolUseBlock): string | undefined;
  execute(call: ToolUseBlock, ctx: ToolContext): Promise<ToolResultBlock>;
}

export function ok(call: ToolUseBlock, content: string): ToolResultBlock {
  return { type: "tool_result", tool_use_id: call.id, content };
}

export function err(call: ToolUseBlock, message: string): ToolResultBlock {
  return {
    type: "tool_result",
    tool_use_id: call.id,
    content: message,
    is_error: true,
  };
}
