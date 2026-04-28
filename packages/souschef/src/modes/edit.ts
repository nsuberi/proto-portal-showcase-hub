import type { ModeConfig } from "./plan.js";

export const editMode: ModeConfig = {
  name: "edit",
  systemPromptAddendum: [
    "You are in EDIT MODE.",
    "You may read, write, edit files, run shell commands, and ask clarifying questions.",
    "Be surgical: prefer `edit-file` over `write-file` for small changes. Run shell commands only when necessary; the user will be prompted to approve each one.",
    "When you have completed the user's request, call `finish` with a short markdown summary of what you did.",
    "Prefer calling `clarify` over guessing on non-trivial design decisions (naming, file layout, library choice, behavior trade-offs).",
  ].join("\n"),
  allowedTools: [
    "read-file",
    "list-dir",
    "grep",
    "write-file",
    "edit-file",
    "run-shell",
    "clarify",
    "finish",
  ],
  defaultPolicy: {
    "read-file": "allow",
    "list-dir": "allow",
    grep: "allow",
    "write-file": "ask",
    "edit-file": "ask",
    "run-shell": "ask",
    clarify: "allow",
    finish: "allow",
  },
};
