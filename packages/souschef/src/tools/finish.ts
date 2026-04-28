import type { ToolDefinition } from "./types.js";
import { ok } from "./types.js";

/**
 * `finish` is a soft-stop tool the model can call to declare "I'm done with this turn"
 * with a structured payload. The session treats a `finish` call as equivalent to
 * `stop_reason: "end_turn"` — Stop hooks fire and we return to awaiting user input.
 *
 * The session intercepts `finish` (like `clarify`) so the schema's `execute` is never
 * invoked, but we keep it stub-compliant.
 */
export const finishTool: ToolDefinition = {
  mutating: false,
  canonicalArg: () => undefined,
  schema: {
    name: "finish",
    description:
      "Call this when you have completed the user's request. The `summary` will be " +
      "shown to the user and passed to the Stop hook. In plan mode, include the full " +
      "plan as markdown in the summary.",
    input_schema: {
      type: "object",
      required: ["summary"],
      properties: {
        summary: {
          type: "string",
          description: "Final answer or plan, in markdown.",
        },
      },
    },
  },
  async execute(call) {
    return ok(call, (call.input.summary as string) ?? "(finished)");
  },
};
