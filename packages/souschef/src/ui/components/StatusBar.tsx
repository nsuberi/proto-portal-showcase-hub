import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { ModeName } from "../../model/types.js";
import { theme } from "../theme.js";
import { Mascot, type MascotState } from "./Mascot.js";

interface StatusBarProps {
  mode: ModeName;
  model: string;
  turn: number | null;
  maxTurns: number;
  state: MascotState;
  showMascot: boolean;
}

export function StatusBar({
  mode,
  model,
  turn,
  maxTurns,
  state,
  showMascot,
}: StatusBarProps): React.ReactElement {
  const turnLabel = turn === null ? "—" : `${turn + 1}/${maxTurns}`;
  return (
    <Box marginTop={1}>
      {showMascot ? (
        <Box marginRight={1}>
          <Mascot variant="compact" state={state} />
        </Box>
      ) : null}
      <Text color={theme.muted}>
        souschef · <Text color={theme.accent}>{mode}</Text> · {model} · turn {turnLabel} ·{" "}
      </Text>
      {state === "thinking" ? (
        <Text color={theme.accent}>
          <Spinner type="dots" />
          <Text> thinking</Text>
        </Text>
      ) : state === "done" ? (
        <Text color={theme.success}>done</Text>
      ) : (
        <Text color={theme.muted}>idle</Text>
      )}
    </Box>
  );
}
