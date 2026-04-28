import React from "react";
import { Box, Text } from "ink";
import type { ToolResultBlock, ToolUseBlock } from "../../model/types.js";
import type { SessionEvent } from "../events.js";
import { theme } from "../theme.js";
import { AssistantMessage } from "./AssistantMessage.js";
import { ToolCallCard } from "./ToolCallCard.js";
import { FinishPanel } from "./FinishPanel.js";

interface TranscriptViewProps {
  events: SessionEvent[];
  /** Set of tool_use_ids that the user has expanded via browse mode. */
  expanded?: Set<string>;
  /** The tool_use_id currently focused by the browse-mode cursor (if any). */
  cursorId?: string | null;
  /** How many events were trimmed from the top of the visible window. */
  hiddenAbove?: number;
  /** How many events were trimmed from the bottom of the visible window. */
  hiddenBelow?: number;
}

interface RenderItem {
  key: string;
  node: React.ReactNode;
}

export function TranscriptView({
  events,
  expanded,
  cursorId,
  hiddenAbove = 0,
  hiddenBelow = 0,
}: TranscriptViewProps): React.ReactElement {
  const items = renderEvents(events, expanded ?? new Set(), cursorId ?? null);
  return (
    <Box flexDirection="column">
      {hiddenAbove > 0 ? (
        <Box marginBottom={1}>
          <Text color={theme.muted}>
            ▲ {hiddenAbove} hidden above (press esc, arrows to browse)
          </Text>
        </Box>
      ) : null}
      {items.map((item) => (
        <React.Fragment key={item.key}>{item.node}</React.Fragment>
      ))}
      {hiddenBelow > 0 ? (
        <Box>
          <Text color={theme.muted}>▼ {hiddenBelow} hidden below</Text>
        </Box>
      ) : null}
    </Box>
  );
}

function renderEvents(
  events: SessionEvent[],
  expanded: Set<string>,
  cursorId: string | null
): RenderItem[] {
  const out: RenderItem[] = [];
  const pendingResults = new Map<string, ToolResultBlock>();

  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type === "tool-result") {
      pendingResults.set(e.call.id, e.result);
    }
  }

  events.forEach((event, idx) => {
    const key = `${idx}-${event.type}`;
    switch (event.type) {
      case "user-message":
        out.push({
          key,
          node: (
            <Box flexDirection="column" marginBottom={1}>
              <Box>
                <Text color={theme.user}>you </Text>
                <Text color={theme.muted}>›</Text>
              </Box>
              <Box paddingLeft={2}>
                <Text color={theme.assistant}>{event.text}</Text>
              </Box>
            </Box>
          ),
        });
        break;
      case "assistant-message":
        out.push({ key, node: <AssistantMessage content={event.content} /> });
        break;
      case "tool-call": {
        const call: ToolUseBlock = event.call;
        const result = pendingResults.get(call.id);
        if (call.name === "finish") {
          out.push({ key, node: <FinishPanel call={call} result={result} /> });
        } else {
          out.push({
            key,
            node: (
              <ToolCallCard
                call={call}
                result={result}
                expanded={expanded.has(call.id)}
                cursored={cursorId === call.id}
              />
            ),
          });
        }
        break;
      }
      case "tool-result":
        // already paired with its tool-call above
        break;
      case "info":
        out.push({
          key,
          node: (
            <Box marginBottom={1}>
              <Text color={theme.muted}>· {event.text}</Text>
            </Box>
          ),
        });
        break;
      case "error":
        out.push({
          key,
          node: (
            <Box marginBottom={1}>
              <Text color={theme.error}>! {event.text}</Text>
            </Box>
          ),
        });
        break;
      case "mode-changed":
        out.push({
          key,
          node: (
            <Box marginBottom={1}>
              <Text color={theme.muted}>· mode → </Text>
              <Text color={theme.accent}>{event.mode}</Text>
            </Box>
          ),
        });
        break;
      case "transcript-cleared":
        out.push({
          key,
          node: (
            <Box marginBottom={1}>
              <Text color={theme.muted}>· transcript cleared</Text>
            </Box>
          ),
        });
        break;
      case "stop":
        out.push({
          key,
          node: (
            <Box marginBottom={1}>
              <Text color={theme.muted}>· stop ({event.reason})</Text>
            </Box>
          ),
        });
        break;
      default:
        break;
    }
  });

  return out;
}
