import { promises as fs } from "node:fs";
import path from "node:path";
import type { ToolDefinition } from "./types.js";
import { ok, err } from "./types.js";

export const writeFileTool: ToolDefinition = {
  mutating: true,
  canonicalArg: (call) => (call.input.path as string | undefined) ?? undefined,
  schema: {
    name: "write-file",
    description:
      "Create or overwrite a file. Use sparingly — prefer edit-file for small changes.",
    input_schema: {
      type: "object",
      required: ["path", "content"],
      properties: {
        path: { type: "string", description: "Workspace-relative path" },
        content: { type: "string", description: "Full file contents to write" },
      },
    },
  },
  async execute(call, ctx) {
    const rel = call.input.path as string | undefined;
    const content = call.input.content as string | undefined;
    if (!rel) return err(call, "missing required 'path'");
    if (typeof content !== "string") return err(call, "missing required 'content'");

    const abs = path.isAbsolute(rel) ? rel : path.resolve(ctx.cwd, rel);
    try {
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, content, "utf8");
      const lines = content.split("\n").length;
      const bytes = Buffer.byteLength(content, "utf8");
      return ok(call, `wrote ${rel} (${lines} lines, ${bytes} bytes)`);
    } catch (e) {
      return err(call, `failed to write ${rel}: ${(e as Error).message}`);
    }
  },
};
