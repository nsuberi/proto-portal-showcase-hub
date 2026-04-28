import type { ModeName, ToolSchema, ToolUseBlock, ToolResultBlock } from "../model/types.js";
import type { ToolDefinition, ToolContext } from "./types.js";
import { err } from "./types.js";

import { readFileTool } from "./read-file.js";
import { listDirTool } from "./list-dir.js";
import { grepTool } from "./grep.js";
import { writeFileTool } from "./write-file.js";
import { editFileTool } from "./edit-file.js";
import { runShellTool } from "./run-shell.js";
import { clarifyTool } from "./clarify.js";
import { finishTool } from "./finish.js";

const ALL_TOOLS: Record<string, ToolDefinition> = {
  "read-file": readFileTool,
  "list-dir": listDirTool,
  grep: grepTool,
  "write-file": writeFileTool,
  "edit-file": editFileTool,
  "run-shell": runShellTool,
  clarify: clarifyTool,
  finish: finishTool,
};

export interface ModeRegistry {
  mode: ModeName;
  tools: ToolDefinition[];
  schemas: ToolSchema[];
  get(name: string): ToolDefinition | undefined;
  execute(call: ToolUseBlock, ctx: ToolContext): Promise<ToolResultBlock>;
  canonicalArg(call: ToolUseBlock): string | undefined;
}

export function forMode(mode: ModeName, allowedTools: string[]): ModeRegistry {
  const tools = allowedTools
    .map((name) => ALL_TOOLS[name])
    .filter((t): t is ToolDefinition => Boolean(t));

  return {
    mode,
    tools,
    schemas: tools.map((t) => t.schema),
    get(name) {
      return tools.find((t) => t.schema.name === name);
    },
    async execute(call, ctx) {
      const tool = this.get(call.name);
      if (!tool) return err(call, `tool '${call.name}' not available in ${mode} mode`);
      return tool.execute(call, ctx);
    },
    canonicalArg(call) {
      return this.get(call.name)?.canonicalArg(call);
    },
  };
}

export function isMutating(name: string): boolean {
  return ALL_TOOLS[name]?.mutating ?? false;
}

export function allToolNames(): string[] {
  return Object.keys(ALL_TOOLS);
}
