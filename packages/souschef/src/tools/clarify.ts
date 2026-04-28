import type { ToolDefinition } from "./types.js";
import { err } from "./types.js";

/**
 * The `clarify` tool is a "virtual" tool — its `execute` is never actually called by
 * the registry. The Session intercepts calls to `clarify`, emits a `clarify-request`
 * event, and feeds the user's UI response back as the tool result.
 *
 * It still appears in the registry so that:
 *   1. It shows up in `tools` sent to the model (so Claude knows it exists).
 *   2. Mode filtering treats it like any other tool.
 *   3. The schema lives in one place.
 */
export const clarifyTool: ToolDefinition = {
  mutating: false,
  canonicalArg: () => undefined,
  schema: {
    name: "clarify",
    description:
      "Ask the user a clarifying design-decision question. Use this BEFORE making " +
      "non-obvious architectural or stylistic choices. Provide 2–5 distinct options " +
      "with a short label each. Skip clarify only when the answer is obvious from " +
      "the user's prompt.",
    input_schema: {
      type: "object",
      required: ["question", "options"],
      properties: {
        question: { type: "string", description: "The decision being asked about" },
        context: {
          type: "string",
          description: "1–2 sentences explaining why this matters",
        },
        options: {
          type: "array",
          minItems: 2,
          maxItems: 5,
          items: {
            type: "object",
            required: ["id", "label"],
            properties: {
              id: { type: "string", description: "Stable identifier for the option" },
              label: { type: "string", description: "Short description shown to user" },
            },
          },
        },
        allow_multiple: {
          type: "boolean",
          description: "If true, the user may select multiple options",
          default: false,
        },
      },
    },
  },
  async execute(call) {
    return err(call, "clarify tool must be handled by the session, not the registry");
  },
};
