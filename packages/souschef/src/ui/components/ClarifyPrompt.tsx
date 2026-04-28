import React from "react";
import { Box, Text } from "ink";
import type { ClarifyRequestPayload } from "../events.js";
import { theme } from "../theme.js";
import { MultiSelect, Select } from "./Select.js";

interface ClarifyPromptProps {
  payload: ClarifyRequestPayload;
  onAnswer: (answerIds: string[]) => void;
}

export function ClarifyPrompt({ payload, onAnswer }: ClarifyPromptProps): React.ReactElement {
  const items = payload.options.map((o) => ({ value: o.id, label: o.label }));
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={1}>
      <Text color={theme.accent} bold>
        souschef has a question
      </Text>
      <Box marginTop={1}>
        <Text color={theme.assistant}>{payload.question}</Text>
      </Box>
      {payload.context ? (
        <Box marginTop={1}>
          <Text color={theme.muted}>{payload.context}</Text>
        </Box>
      ) : null}
      <Box marginTop={1}>
        {payload.allowMultiple ? (
          <MultiSelect items={items} onSubmit={(values) => onAnswer(values)} />
        ) : (
          <Select items={items} onSelect={(value) => onAnswer([value])} />
        )}
      </Box>
    </Box>
  );
}
