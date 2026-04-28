import type { Message } from "../model/types.js";
import type { ModeConfig } from "../modes/plan.js";
import { buildSystemPrompt } from "./system-prompt.js";

const DEFAULT_BUDGET_CHARS = 200_000;

export interface AssembleInput {
  transcript: Message[];
  mode: ModeConfig;
  cwd: string;
  toolNames: string[];
  budgetChars?: number;
}

export interface AssembleOutput {
  system: string;
  messages: Message[];
}

/**
 * Build the {system, messages} payload for an Anthropic call. Truncation strategy:
 * keep the first user message (the original prompt) and the most recent N messages
 * until we're under budget. Drops oldest tool-result-bearing user messages first.
 */
export function assembleContext({
  transcript,
  mode,
  cwd,
  toolNames,
  budgetChars = DEFAULT_BUDGET_CHARS,
}: AssembleInput): AssembleOutput {
  const system = buildSystemPrompt({ mode, cwd, toolNames });
  const messages = truncateTranscript(transcript, budgetChars - system.length);
  return { system, messages };
}

function truncateTranscript(transcript: Message[], budget: number): Message[] {
  const total = approxSize(transcript);
  if (total <= budget) return transcript;
  if (transcript.length === 0) return transcript;

  const head = transcript[0];
  const tail = transcript.slice(1);
  const kept: Message[] = [];
  let used = approxMessageSize(head);

  for (let i = tail.length - 1; i >= 0; i--) {
    const m = tail[i];
    const size = approxMessageSize(m);
    if (used + size > budget && kept.length > 0) break;
    kept.unshift(m);
    used += size;
  }

  // Ensure assistant/user pairing is preserved at the boundary: if the first kept
  // message is a `user` with tool_results, drop it (orphaned without its assistant).
  while (kept.length > 0 && isOrphanedToolResults(kept[0])) {
    kept.shift();
  }

  return [head, ...kept];
}

function isOrphanedToolResults(m: Message): boolean {
  if (m.role !== "user" || typeof m.content === "string") return false;
  return m.content.every((b) => b.type === "tool_result");
}

function approxSize(transcript: Message[]): number {
  let n = 0;
  for (const m of transcript) n += approxMessageSize(m);
  return n;
}

function approxMessageSize(m: Message): number {
  if (typeof m.content === "string") return m.content.length;
  let n = 0;
  for (const b of m.content) {
    if (b.type === "text") n += b.text.length;
    else if (b.type === "tool_use") n += JSON.stringify(b.input).length + b.name.length;
    else if (b.type === "tool_result") n += (b.content?.length ?? 0) + 16;
  }
  return n;
}
