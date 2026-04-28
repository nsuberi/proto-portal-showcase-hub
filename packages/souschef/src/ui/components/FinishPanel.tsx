import React from "react";
import { Box, Text } from "ink";
import type { ToolResultBlock, ToolUseBlock } from "../../model/types.js";
import { theme } from "../theme.js";

interface FinishPanelProps {
  call: ToolUseBlock;
  result?: ToolResultBlock;
}

/**
 * Renders the model's `finish` tool call as a bordered panel with the FULL
 * markdown summary visible. This is distinct from the collapsed `ToolCallCard`
 * that other tools use — `finish` carries the user-facing answer/plan and must
 * not be truncated to a single line.
 */
export function FinishPanel({ call, result }: FinishPanelProps): React.ReactElement {
  const summary = pickSummary(call, result);
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={1} marginBottom={1}>
      <Box>
        <Text color={theme.accent} bold>
          ✓ final answer
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={theme.assistant}>{summary}</Text>
      </Box>
    </Box>
  );
}

function pickSummary(call: ToolUseBlock, result?: ToolResultBlock): string {
  // The session passes the model's `summary` input through as the result content,
  // so either source has the same text. Fall back if both are missing.
  if (result && !result.is_error && result.content) return result.content;
  const fromInput = call.input.summary;
  if (typeof fromInput === "string" && fromInput.length > 0) return fromInput;
  return "(finish called with no summary)";
}
