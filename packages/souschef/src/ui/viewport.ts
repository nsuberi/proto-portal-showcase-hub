import type { SessionEvent } from "./events.js";

/**
 * Roughly estimate how many terminal rows an event will occupy when rendered.
 * Approximate is fine — we only use this to decide which slice of the transcript
 * fits on screen so the OS doesn't scroll the live render off the top.
 */
export function estimateRows(
  event: SessionEvent,
  expanded: boolean,
  width: number
): number {
  switch (event.type) {
    case "user-message":
      return 2 + wrappedLines(event.text, width - 2);
    case "assistant-message": {
      const text = event.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("\n\n");
      return 2 + wrappedLines(text, width - 2);
    }
    case "tool-call": {
      if (event.call.name === "finish") {
        const summary =
          typeof event.call.input.summary === "string" ? event.call.input.summary : "";
        return 4 + wrappedLines(summary, width - 4);
      }
      if (expanded) {
        const inputJson = JSON.stringify(event.call.input ?? {}, null, 2);
        return 6 + wrappedLines(inputJson, width - 4);
      }
      return 2;
    }
    case "tool-result":
      return 0;
    case "info":
    case "error":
    case "mode-changed":
    case "transcript-cleared":
    case "stop":
      return 1;
    default:
      return 0;
  }
}

function wrappedLines(text: string, width: number): number {
  if (!text) return 0;
  const cols = Math.max(20, width);
  let total = 0;
  for (const line of text.split("\n")) {
    total += Math.max(1, Math.ceil(line.length / cols));
  }
  return total;
}

/**
 * Compute the slice of `events` that should be shown given a height budget,
 * keeping the cursor (if any) visible. Returns indices and the cursor's
 * position within the slice so the caller can render with full context.
 */
export interface ViewportResult {
  start: number;
  end: number; // exclusive
  hiddenAbove: number;
  hiddenBelow: number;
}

export function computeViewport({
  events,
  expanded,
  cursorIndex,
  rows,
  cols,
}: {
  events: SessionEvent[];
  expanded: Set<string>;
  cursorIndex: number | null;
  rows: number;
  cols: number;
}): ViewportResult {
  if (events.length === 0) {
    return { start: 0, end: 0, hiddenAbove: 0, hiddenBelow: 0 };
  }

  const heights = events.map((e) =>
    estimateRows(e, e.type === "tool-call" ? expanded.has(e.call.id) : false, cols)
  );

  const anchorIdx = cursorIndex !== null ? cursorIndex : events.length - 1;

  // Walk backward from anchor accumulating up to ~70% of budget, then forward to fill.
  const upperBudget = Math.floor(rows * 0.7);
  let used = heights[anchorIdx] ?? 0;
  let start = anchorIdx;
  let end = anchorIdx + 1;

  while (start > 0 && used + heights[start - 1] <= upperBudget) {
    start -= 1;
    used += heights[start];
  }
  while (end < events.length && used + heights[end] <= rows) {
    used += heights[end];
    end += 1;
  }
  while (start > 0 && used + heights[start - 1] <= rows) {
    start -= 1;
    used += heights[start];
  }

  return {
    start,
    end,
    hiddenAbove: start,
    hiddenBelow: events.length - end,
  };
}
