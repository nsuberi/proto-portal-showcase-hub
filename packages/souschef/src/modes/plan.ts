import type { ModeName } from "../model/types.js";
import type { Policy } from "../permissions/policy.js";

export interface ModeConfig {
  name: ModeName;
  systemPromptAddendum: string;
  allowedTools: string[];
  defaultPolicy: Policy;
}

export const planMode: ModeConfig = {
  name: "plan",
  systemPromptAddendum: [
    "You are in PLAN MODE.",
    "You MAY: read files, list directories, search for text, and ask clarifying questions.",
    "You MAY NOT: write files, edit files, or run shell commands. The mutating tools are not even available.",
    "When you are confident you have enough information, call the `finish` tool with a complete markdown plan as the `summary`. Do NOT modify any files; the user will execute the plan separately.",
    "Prefer calling `clarify` over guessing on non-trivial design decisions.",
  ].join("\n"),
  allowedTools: ["read-file", "list-dir", "grep", "clarify", "finish"],
  defaultPolicy: { "*": "allow" },
};
