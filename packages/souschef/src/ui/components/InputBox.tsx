import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { theme } from "../theme.js";

interface InputBoxProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
}

export function InputBox({ onSubmit, placeholder }: InputBoxProps): React.ReactElement {
  const [value, setValue] = useState("");

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <Box>
      <Text color={theme.prompt}>›  </Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={submit}
        placeholder={placeholder ?? "type a message, or /help for commands"}
      />
    </Box>
  );
}
