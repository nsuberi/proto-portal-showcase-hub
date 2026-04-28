import type { ToolUseBlock } from "../model/types.js";

export type PermissionDecision = "allow" | "ask" | "deny";

/**
 * Policy keys are either `<tool-name>` or `<tool-name>:<arg-pattern>`. Patterns use
 * tiny glob syntax: `*` matches any single path segment / shell word, `**` matches
 * across path segments. Falls back to literal substring matching if no globs are
 * present.
 */
export type Policy = Record<string, PermissionDecision>;

export interface PolicyContext {
  /** Per-tool canonical arg (file path, command, etc.) used for pattern matching. */
  canonicalArg?: string;
}

/**
 * Resolve a permission decision for a tool call.
 *
 * Resolution order:
 *   1. Runtime overrides (session "always allow X").
 *   2. Exact `tool:pattern` matches with arg matching.
 *   3. Tool-name fallback.
 *   4. Wildcard `*`.
 *   5. Default to "ask".
 */
export function resolve(
  call: ToolUseBlock,
  base: Policy,
  runtime: Policy,
  ctx: PolicyContext
): PermissionDecision {
  const name = call.name;
  const arg = ctx.canonicalArg;

  const runtimeExact = lookupArgPattern(runtime, name, arg);
  if (runtimeExact) return runtimeExact;
  if (runtime[name]) return runtime[name];

  const exact = lookupArgPattern(base, name, arg);
  if (exact) return exact;
  if (base[name]) return base[name];
  if (base["*"]) return base["*"];

  return "ask";
}

function lookupArgPattern(
  policy: Policy,
  tool: string,
  arg: string | undefined
): PermissionDecision | undefined {
  if (!arg) return undefined;
  const prefix = `${tool}:`;
  for (const key of Object.keys(policy)) {
    if (!key.startsWith(prefix)) continue;
    const pattern = key.slice(prefix.length);
    if (matchPattern(pattern, arg)) return policy[key];
  }
  return undefined;
}

/**
 * Tiny glob matcher: `*` = any sequence of non-`/` chars, `**` = any sequence.
 * Anything without a `*` is treated as a substring match.
 */
export function matchPattern(pattern: string, value: string): boolean {
  if (!pattern.includes("*")) return value.includes(pattern);
  const re = new RegExp(
    "^" +
      pattern
        .split(/(\*\*|\*)/g)
        .map((part) => {
          if (part === "**") return ".*";
          if (part === "*") return "[^/]*";
          return escapeRegex(part);
        })
        .join("") +
      "$"
  );
  return re.test(value);
}

function escapeRegex(s: string): string {
  return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}
