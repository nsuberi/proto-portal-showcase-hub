import React from "react";
import { Box, Text } from "ink";
import type { AssistantContentBlock } from "../../model/types.js";
import { theme } from "../theme.js";

interface AssistantMessageProps {
  content: AssistantContentBlock[];
}

export function AssistantMessage({ content }: AssistantMessageProps): React.ReactElement {
  const textBlocks = content.filter((b): b is { type: "text"; text: string } => b.type === "text");
  if (textBlocks.length === 0) return <></>;
  const text = textBlocks.map((b) => b.text).join("\n\n").trim();
  if (!text) return <></>;
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={theme.accent}>souschef </Text>
        <Text color={theme.muted}>›</Text>
      </Box>
      <Box paddingLeft={2}>
        <Text color={theme.assistant}>{text}</Text>
      </Box>
    </Box>
  );
}
