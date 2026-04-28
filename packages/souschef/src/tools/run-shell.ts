import { spawn } from "node:child_process";
import type { ToolDefinition } from "./types.js";
import { ok, err } from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_OUTPUT = 10_000;

export const runShellTool: ToolDefinition = {
  mutating: true,
  canonicalArg: (call) => (call.input.command as string | undefined) ?? undefined,
  schema: {
    name: "run-shell",
    description:
      "Run a shell command from the workspace root. Combined stdout+stderr are returned, " +
      "truncated to 10k chars. Default timeout 30s.",
    input_schema: {
      type: "object",
      required: ["command"],
      properties: {
        command: { type: "string", description: "Shell command to execute" },
        timeout_ms: { type: "number", description: "Timeout in ms (default 30000)" },
      },
    },
  },
  async execute(call, ctx) {
    const command = call.input.command as string | undefined;
    if (!command) return err(call, "missing required 'command'");
    const timeoutMs = Number(call.input.timeout_ms ?? DEFAULT_TIMEOUT_MS);

    return new Promise((resolve) => {
      const child = spawn(command, {
        cwd: ctx.cwd,
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let out = "";
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, timeoutMs);

      child.stdout.on("data", (d) => {
        out += d.toString();
        if (out.length > MAX_OUTPUT) out = out.slice(0, MAX_OUTPUT);
      });
      child.stderr.on("data", (d) => {
        out += d.toString();
        if (out.length > MAX_OUTPUT) out = out.slice(0, MAX_OUTPUT);
      });
      child.on("error", (e) => {
        clearTimeout(timer);
        resolve(err(call, `spawn failed: ${e.message}`));
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        const header = timedOut
          ? `(timed out after ${timeoutMs}ms)`
          : `(exit ${code ?? "?"})`;
        const body = out || "(no output)";
        const text = `${header}\n${body}`;
        if (timedOut || (code !== null && code !== 0)) {
          resolve(err(call, text));
        } else {
          resolve(ok(call, text));
        }
      });
    });
  },
};
