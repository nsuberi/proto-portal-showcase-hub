import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";

export interface SelectItem<T = string> {
  value: T;
  label: string;
  hint?: string;
}

interface SelectProps<T> {
  items: SelectItem<T>[];
  onSelect: (value: T) => void;
  initialIndex?: number;
}

export function Select<T>({ items, onSelect, initialIndex = 0 }: SelectProps<T>): React.ReactElement {
  const [index, setIndex] = useState(initialIndex);

  useInput((_input, key) => {
    if (key.upArrow) setIndex((i) => (i - 1 + items.length) % items.length);
    else if (key.downArrow) setIndex((i) => (i + 1) % items.length);
    else if (key.return) onSelect(items[index].value);
  });

  return (
    <Box flexDirection="column">
      {items.map((item, i) => {
        const active = i === index;
        return (
          <Box key={i}>
            <Text color={active ? theme.accent : theme.muted}>{active ? "❯ " : "  "}</Text>
            <Text color={active ? theme.accent : theme.assistant} bold={active}>
              {item.label}
            </Text>
            {item.hint ? <Text color={theme.muted}>  {item.hint}</Text> : null}
          </Box>
        );
      })}
    </Box>
  );
}

interface MultiSelectProps<T> {
  items: SelectItem<T>[];
  onSubmit: (values: T[]) => void;
}

export function MultiSelect<T>({ items, onSubmit }: MultiSelectProps<T>): React.ReactElement {
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useInput((input, key) => {
    if (key.upArrow) setIndex((i) => (i - 1 + items.length) % items.length);
    else if (key.downArrow) setIndex((i) => (i + 1) % items.length);
    else if (input === " ") {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    } else if (key.return) {
      const values = Array.from(checked).map((i) => items[i].value);
      onSubmit(values);
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, i) => {
        const active = i === index;
        const isChecked = checked.has(i);
        return (
          <Box key={i}>
            <Text color={active ? theme.accent : theme.muted}>{active ? "❯ " : "  "}</Text>
            <Text color={isChecked ? theme.success : theme.muted}>{isChecked ? "[x] " : "[ ] "}</Text>
            <Text color={active ? theme.accent : theme.assistant} bold={active}>
              {item.label}
            </Text>
            {item.hint ? <Text color={theme.muted}>  {item.hint}</Text> : null}
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text color={theme.muted}>↑↓ to move · space to toggle · enter to submit</Text>
      </Box>
    </Box>
  );
}
