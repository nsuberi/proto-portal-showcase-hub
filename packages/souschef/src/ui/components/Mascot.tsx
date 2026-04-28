import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

export type MascotState = "idle" | "thinking" | "done";

interface MascotProps {
  variant: "banner" | "compact";
  state?: MascotState;
}

const FACES: Record<MascotState, string> = {
  idle: "o_o",
  thinking: "-.-",
  done: "^_^",
};

const BANNER_TEMPLATE = (face: string) => [
  "    .---.",
  `   /     \\    souschef`,
  `  | (${face}) |   what shall we cook?`,
  "   `-----'",
];

export function Mascot({ variant, state = "idle" }: MascotProps): React.ReactElement {
  const face = FACES[state];

  if (variant === "banner") {
    const lines = BANNER_TEMPLATE(face);
    return (
      <Box flexDirection="column" marginBottom={1}>
        {lines.map((line, i) => (
          <Text key={i} color={theme.banner}>
            {line}
          </Text>
        ))}
      </Box>
    );
  }

  return <Text color={theme.banner}>{`( ${face} )^`}</Text>;
}
