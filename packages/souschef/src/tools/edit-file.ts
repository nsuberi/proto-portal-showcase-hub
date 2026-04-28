import { promises as fs } from "node:fs";
import path from "node:path";
import type { ToolDefinition } from "./types.js";
import { ok, err } from "./types.js";

export const editFileTool: ToolDefinition = {
  mutating: true,
  canonicalArg: (call) => (call.input.path as string | undefined) ?? undefined,
  schema: {
    name: "edit-file",
    description:
      "Replace an exact substring in a file. The `old_string` must occur exactly once " +
      "or the call fails (use replace_all to override). Prefer this over write-file " +
      "for small changes.",
    input_schema: {
      type: "object",
      required: ["path", "old_string", "new_string"],
      properties: {
        path: { type: "string" },
        old_string: { type: "string", description: "Exact text to replace" },
        new_string: { type: "string", description: "Replacement text" },
        replace_all: { type: "boolean", description: "Replace every occurrence" },
      },
    },
  },
  async execute(call, ctx) {
    const rel = call.input.path as string | undefined;
    const oldStr = call.input.old_string as string | undefined;
    const newStr = call.input.new_string as string | undefined;
    const replaceAll = Boolean(call.input.replace_all);
    if (!rel) return err(call, "missing required 'path'");
    if (typeof oldStr !== "string") return err(call, "missing required 'old_string'");
    if (typeof newStr !== "string") return err(call, "missing required 'new_string'");

    const abs = path.isAbsolute(rel) ? rel : path.resolve(ctx.cwd, rel);
    let original: string;
    try {
      original = await fs.readFile(abs, "utf8");
    } catch (e) {
      return err(call, `failed to read ${rel}: ${(e as Error).message}`);
    }

    const occurrences = countOccurrences(original, oldStr);
    if (occurrences === 0) return err(call, `old_string not found in ${rel}`);
    if (occurrences > 1 && !replaceAll) {
      return err(
        call,
        `old_string occurs ${occurrences}× in ${rel}; pass replace_all=true or add more context`
      );
    }

    const updated = replaceAll
      ? original.split(oldStr).join(newStr)
      : original.replace(oldStr, newStr);
    try {
      await fs.writeFile(abs, updated, "utf8");
      return ok(
        call,
        `edited ${rel} (${replaceAll ? occurrences : 1} replacement${
          replaceAll && occurrences > 1 ? "s" : ""
        })`
      );
    } catch (e) {
      return err(call, `failed to write ${rel}: ${(e as Error).message}`);
    }
  },
};

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}
