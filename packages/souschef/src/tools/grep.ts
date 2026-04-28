import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ToolDefinition } from "./types.js";
import { ok, err } from "./types.js";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".yarn",
  "coverage",
]);

export const grepTool: ToolDefinition = {
  mutating: false,
  canonicalArg: (call) => (call.input.pattern as string | undefined) ?? undefined,
  schema: {
    name: "grep",
    description:
      "Recursive text search. Uses ripgrep (`rg`) when available; otherwise falls back " +
      "to a JS scan. Skips node_modules, .git, dist by default.",
    input_schema: {
      type: "object",
      required: ["pattern"],
      properties: {
        pattern: { type: "string", description: "Substring or regex to search for" },
        path: { type: "string", description: "Directory to search (defaults to cwd)" },
        max_results: { type: "number", description: "Cap matches (default 200)" },
      },
    },
  },
  async execute(call, ctx) {
    const pattern = call.input.pattern as string | undefined;
    if (!pattern) return err(call, "missing required 'pattern'");
    const rel = (call.input.path as string | undefined) ?? ".";
    const abs = path.isAbsolute(rel) ? rel : path.resolve(ctx.cwd, rel);
    const max = Number(call.input.max_results ?? 200);

    const rgOut = await tryRipgrep(pattern, abs, max);
    if (rgOut !== null) return ok(call, rgOut || "(no matches)");

    try {
      const matches = await jsScan(pattern, abs, max);
      return ok(call, matches.join("\n") || "(no matches)");
    } catch (e) {
      return err(call, `grep failed: ${(e as Error).message}`);
    }
  },
};

async function tryRipgrep(
  pattern: string,
  cwd: string,
  max: number
): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(
      "rg",
      ["--hidden", "--no-heading", "--line-number", "--max-count", String(max), pattern, "."],
      { cwd, stdio: ["ignore", "pipe", "pipe"] }
    );
    let out = "";
    let errored = false;
    child.stdout.on("data", (d) => {
      out += d.toString();
    });
    child.on("error", () => {
      errored = true;
      resolve(null);
    });
    child.on("close", (code) => {
      if (errored) return;
      // rg exits 1 when no matches; treat as empty success.
      if (code === 0 || code === 1) resolve(out.trim());
      else resolve(null);
    });
  });
}

async function jsScan(pattern: string, root: string, max: number): Promise<string[]> {
  const re = new RegExp(pattern);
  const matches: string[] = [];
  const stack: string[] = [root];
  while (stack.length && matches.length < max) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (matches.length >= max) break;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) stack.push(full);
      } else if (e.isFile()) {
        try {
          const text = await fs.readFile(full, "utf8");
          const lines = text.split("\n");
          for (let i = 0; i < lines.length && matches.length < max; i++) {
            if (re.test(lines[i])) matches.push(`${full}:${i + 1}:${lines[i].trim()}`);
          }
        } catch {
          // skip binary or unreadable
        }
      }
    }
  }
  return matches;
}
