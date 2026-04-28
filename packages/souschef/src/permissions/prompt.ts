import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ToolUseBlock } from "../model/types.js";

export type PermissionAnswer = "allow" | "always-allow" | "deny";

/**
 * Readline-based fallback used when running headless (`--no-tui` or non-TTY stdout).
 * The Ink TUI uses `PermissionPrompt.tsx` instead; both end up resolving the same
 * promise on Session.
 */
export async function readlinePermissionPrompt(
  call: ToolUseBlock,
  canonicalArg: string | undefined
): Promise<PermissionAnswer> {
  const rl = readline.createInterface({ input, output });
  try {
    const argLine = canonicalArg ? `\n  ${canonicalArg}` : "";
    output.write(
      `\n[souschef] tool requested: ${call.name}${argLine}\n` +
        `  [y] allow once  [a] always allow  [n] deny  (default: deny)\n`
    );
    const answer = (await rl.question("? ")).trim().toLowerCase();
    if (answer === "y" || answer === "yes") return "allow";
    if (answer === "a" || answer === "always") return "always-allow";
    return "deny";
  } finally {
    rl.close();
  }
}
