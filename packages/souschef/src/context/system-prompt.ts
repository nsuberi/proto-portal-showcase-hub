import { execSync } from "node:child_process";
import type { ModeConfig } from "../modes/plan.js";

const BASE_PROMPT = `You are souschef, a small agentic coding assistant inspired by Claude Code.

You operate inside a developer's workspace and use tools to read and (in edit mode) modify files. Always prefer the smallest change that satisfies the user's request, and be explicit when you make assumptions.

Tool-use protocol:
- When you need to act, emit a tool_use block. The tool result will come back as the next user message.
- When you have completed the request, call the \`finish\` tool with a short markdown summary. Do not call \`finish\` until you've actually done the work.
- Use \`clarify\` to ask the user a structured design-decision question whenever you would otherwise have to guess on a non-trivial choice. Provide 2–5 distinct options with short labels.

Style:
- Be concise. Prefer code references and short prose over long explanations.
- Cite file paths the user can click. Don't fabricate paths or APIs.
- After tool errors, adapt — don't repeat the same call.`;

export interface SystemPromptInput {
  mode: ModeConfig;
  cwd: string;
  toolNames: string[];
}

export function buildSystemPrompt({ mode, cwd, toolNames }: SystemPromptInput): string {
  const parts = [BASE_PROMPT, "", mode.systemPromptAddendum, ""];

  parts.push(`Workspace root: ${cwd}`);

  const gitStatus = safeGitStatus(cwd);
  if (gitStatus) {
    parts.push("Recent local changes (git status --short, truncated):");
    parts.push(gitStatus);
  }

  parts.push("");
  parts.push(`Available tools: ${toolNames.join(", ")}`);

  return parts.join("\n");
}

function safeGitStatus(cwd: string): string | undefined {
  try {
    const out = execSync("git status --short", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
      timeout: 2000,
    }).trim();
    if (!out) return undefined;
    const lines = out.split("\n");
    if (lines.length > 30) return [...lines.slice(0, 30), `… (+${lines.length - 30} more)`].join("\n");
    return out;
  } catch {
    return undefined;
  }
}
