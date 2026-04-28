import { promises as fs } from "node:fs";
import path from "node:path";
import type { ToolDefinition } from "./types.js";
import { ok, err } from "./types.js";

export const listDirTool: ToolDefinition = {
  mutating: false,
  canonicalArg: (call) => (call.input.path as string | undefined) ?? ".",
  schema: {
    name: "list-dir",
    description: "Shallow directory listing. Returns one entry per line with type marker.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory to list (defaults to cwd)" },
      },
    },
  },
  async execute(call, ctx) {
    const rel = (call.input.path as string | undefined) ?? ".";
    const abs = path.isAbsolute(rel) ? rel : path.resolve(ctx.cwd, rel);
    try {
      const entries = await fs.readdir(abs, { withFileTypes: true });
      const lines = entries
        .filter((e) => !e.name.startsWith("."))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => {
          if (e.isDirectory()) return `dir   ${e.name}/`;
          if (e.isSymbolicLink()) return `link  ${e.name}`;
          return `file  ${e.name}`;
        });
      return ok(call, lines.join("\n") || "(empty)");
    } catch (e) {
      return err(call, `failed to list ${rel}: ${(e as Error).message}`);
    }
  },
};
