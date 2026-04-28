import React from "react";
import { Box, Text } from "ink";
import type { PermissionRequestPayload } from "../events.js";
import type { PermissionAnswer } from "../../permissions/prompt.js";
import { theme } from "../theme.js";
import { Select } from "./Select.js";

interface PermissionPromptProps {
  payload: PermissionRequestPayload;
  onDecide: (answer: PermissionAnswer) => void;
}

const ITEMS = [
  { value: "allow" as const, label: "Allow once", hint: "run this call only" },
  {
    value: "always-allow" as const,
    label: "Always allow this tool for the session",
    hint: "skip future prompts for the same tool",
  },
  { value: "deny" as const, label: "Deny", hint: "return an error to the model" },
];

export function PermissionPrompt({ payload, onDecide }: PermissionPromptProps): React.ReactElement {
  const { call, canonicalArg } = payload;
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.warning} paddingX={1}>
      <Text color={theme.warning} bold>
        permission requested
      </Text>
      <Box marginTop={1}>
        <Text color={theme.muted}>tool: </Text>
        <Text color={theme.toolName}>{call.name}</Text>
      </Box>
      {canonicalArg ? (
        <Box>
          <Text color={theme.muted}>arg:  </Text>
          <Text color={theme.assistant}>{canonicalArg}</Text>
        </Box>
      ) : null}
      <Box marginTop={1}>
        <Select items={ITEMS} onSelect={onDecide} />
      </Box>
    </Box>
  );
}
