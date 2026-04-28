import React from "react";
import { Box, Text } from "ink";
import type { ToolResultBlock, ToolUseBlock } from "../../model/types.js";
import { theme } from "../theme.js";

interface ToolCallCardProps {
  call: ToolUseBlock;
  result?: ToolResultBlock;
  /** When true, render the full result content (and tool input args) instead of a 1-line summary. */
  expanded?: boolean;
  /** When true, this card is the focus target in browse mode — show a cursor marker. */
  cursored?: boolean;
}

const COLLAPSED_RESULT_PREVIEW = 100;
const EXPANDED_RESULT_PREVIEW = 4000;

export function ToolCallCard({
  call,
  result,
  expanded = false,
  cursored = false,
}: ToolCallCardProps): React.ReactElement {
  const arg = previewArg(call);
  const cursorMark = cursored ? "❯" : "▸";
  const cursorColor = cursored ? theme.accent : theme.muted;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={cursorColor}>{cursorMark} </Text>
        <Text color={theme.toolName} bold>
          {call.name}
        </Text>
        {arg ? <Text color={theme.toolArg}>  {arg}</Text> : null}
        {!expanded && hasMore(call, result) ? (
          <Text color={theme.muted}>  ⋯</Text>
        ) : null}
      </Box>

      {expanded ? <ExpandedInput call={call} /> : null}

      {result ? (
        expanded ? (
          <ExpandedResult result={result} />
        ) : (
          <CollapsedResult result={result} />
        )
      ) : (
        <Text color={theme.muted}>  …</Text>
      )}
    </Box>
  );
}

function CollapsedResult({ result }: { result: ToolResultBlock }): React.ReactElement {
  const summary = summarize(result.content ?? "", COLLAPSED_RESULT_PREVIEW);
  return (
    <Box paddingLeft={2}>
      {result.is_error ? (
        <Text color={theme.error}>✗ {summary}</Text>
      ) : (
        <Text color={theme.success}>✓ {summary}</Text>
      )}
    </Box>
  );
}

function ExpandedResult({ result }: { result: ToolResultBlock }): React.ReactElement {
  const content = (result.content ?? "").slice(0, EXPANDED_RESULT_PREVIEW);
  const truncated = (result.content?.length ?? 0) > EXPANDED_RESULT_PREVIEW;
  return (
    <Box flexDirection="column" paddingLeft={2}>
      <Text color={result.is_error ? theme.error : theme.success}>
        {result.is_error ? "✗ error" : "✓ result"}
      </Text>
      <Box paddingLeft={2} flexDirection="column">
        <Text color={theme.assistant}>{content}</Text>
        {truncated ? (
          <Text color={theme.muted}>… (truncated to {EXPANDED_RESULT_PREVIEW} chars)</Text>
        ) : null}
      </Box>
    </Box>
  );
}

function ExpandedInput({ call }: { call: ToolUseBlock }): React.ReactElement | null {
  const json = JSON.stringify(call.input, null, 2);
  if (!json || json === "{}") return null;
  return (
    <Box paddingLeft={2}>
      <Text color={theme.muted}>input: </Text>
      <Text color={theme.toolArg}>{json}</Text>
    </Box>
  );
}

function previewArg(call: ToolUseBlock): string {
  const i = call.input;
  const candidate = i.path ?? i.command ?? i.pattern ?? i.question;
  if (typeof candidate === "string") {
    return candidate.length > 80 ? `${candidate.slice(0, 80)}…` : candidate;
  }
  return "";
}

function summarize(content: string, max: number): string {
  const firstLine = content.split("\n", 1)[0] ?? "";
  return firstLine.length > max ? `${firstLine.slice(0, max)}…` : firstLine;
}

function hasMore(call: ToolUseBlock, result?: ToolResultBlock): boolean {
  if (!result) return false;
  const content = result.content ?? "";
  if (content.includes("\n")) return true;
  if (content.length > COLLAPSED_RESULT_PREVIEW) return true;
  if (Object.keys(call.input ?? {}).length > 1) return true;
  return false;
}
