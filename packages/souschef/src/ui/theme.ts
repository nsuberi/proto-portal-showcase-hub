/**
 * The single source of truth for terminal colors used by the Ink UI. The repo's
 * design-token rules forbid hardcoded hex/rgb in TS/TSX outside of token files —
 * this file IS that token file for souschef's TUI. Everything else imports from here.
 */

export const theme = {
  accent: "cyan",
  muted: "gray",
  user: "cyan",
  assistant: "white",
  toolName: "magenta",
  toolArg: "gray",
  success: "green",
  error: "red",
  warning: "yellow",
  banner: "yellow",
  prompt: "cyan",
  subtle: "gray",
} as const;

export type ThemeColor = (typeof theme)[keyof typeof theme];
