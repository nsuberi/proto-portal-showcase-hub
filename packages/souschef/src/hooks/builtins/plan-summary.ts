import type { StopPayload } from "../types.js";

/**
 * Built-in Stop hook for plan mode: extracts the most recent assistant `finish`
 * payload (or the last text block if no `finish` was called) and prints it
 * cleanly to stderr. Useful even with the TUI on, since the user's terminal
 * scrollback gets a clean copy of the plan after the session ends.
 */
export async function planSummaryHook(payload: StopPayload): Promise<void> {
  const summary = extractSummary(payload);
  if (!summary) return;
  process.stderr.write("\n[souschef:plan]\n");
  process.stderr.write(summary);
  process.stderr.write("\n");
}

function extractSummary(payload: StopPayload): string | undefined {
  for (let i = payload.transcript.length - 1; i >= 0; i--) {
    const msg = payload.transcript[i];
    if (msg.role !== "assistant") continue;
    for (let j = msg.content.length - 1; j >= 0; j--) {
      const block = msg.content[j];
      if (block.type === "tool_use" && block.name === "finish") {
        const summary = (block.input.summary as string | undefined) ?? "";
        return summary;
      }
    }
  }
  for (let i = payload.transcript.length - 1; i >= 0; i--) {
    const msg = payload.transcript[i];
    if (msg.role !== "assistant") continue;
    const text = msg.content
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();
    if (text) return text;
  }
  return undefined;
}
