import type { PostToolUsePayload } from "../types.js";

/**
 * Built-in PostToolUse hook: logs every tool call to stderr in a single line. Stays
 * out of stdout so the TUI can keep ownership of the rendering surface.
 */
export async function auditHook(payload: PostToolUsePayload): Promise<void> {
  const { call, result } = payload;
  const status = result.is_error ? "error" : "ok";
  const argPreview = previewArg(call.input);
  process.stderr.write(`[souschef:audit] ${call.name}${argPreview ? ` ${argPreview}` : ""} → ${status}\n`);
}

function previewArg(input: Record<string, unknown>): string {
  const candidate = input.path ?? input.command ?? input.pattern;
  if (typeof candidate === "string") {
    return candidate.length > 60 ? `${candidate.slice(0, 60)}…` : candidate;
  }
  return "";
}
