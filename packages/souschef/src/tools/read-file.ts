import { promises as fs } from "node:fs";
import path from "node:path";
import type { ToolDefinition } from "./types.js";
import { ok, err } from "./types.js";

const MAX_BYTES = 200_000;

export const readFileTool: ToolDefinition = {
  mutating: false,
  canonicalArg: (call) => (call.input.path as string | undefined) ?? undefined,
  schema: {
    name: "read-file",
    description:
      "Read a file from the workspace. Optionally slice by line range (1-indexed inclusive).",
    input_schema: {
      type: "object",
      required: ["path"],
      properties: {
        path: { type: "string", description: "Workspace-relative or absolute file path" },
        start_line: { type: "number", description: "First line to include (1-indexed)" },
        end_line: { type: "number", description: "Last line to include (1-indexed)" },
      },
    },
  },
  async execute(call, ctx) {
    const rel = call.input.path as string | undefined;
    if (!rel) return err(call, "missing required 'path'");

    const abs = path.isAbsolute(rel) ? rel : path.resolve(ctx.cwd, rel);
    try {
      const stat = await fs.stat(abs);
      if (!stat.isFile()) return err(call, `not a file: ${rel}`);
      if (stat.size > MAX_BYTES) {
        const buf = await fs.readFile(abs, { encoding: "utf8" });
        const sliced = buf.slice(0, MAX_BYTES);
        return ok(call, `(truncated to ${MAX_BYTES} bytes of ${stat.size})\n${sliced}`);
      }
      const text = await fs.readFile(abs, "utf8");
      const start = Number(call.input.start_line ?? 0);
      const end = Number(call.input.end_line ?? 0);
      if (start > 0 || end > 0) {
        const lines = text.split("\n");
        const a = Math.max(1, start || 1) - 1;
        const b = Math.min(lines.length, end || lines.length);
        return ok(call, lines.slice(a, b).join("\n"));
      }
      return ok(call, text);
    } catch (e) {
      return err(call, `failed to read ${rel}: ${(e as Error).message}`);
    }
  },
};
