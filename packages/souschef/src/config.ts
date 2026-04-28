import { promises as fs } from "node:fs";
import path from "node:path";
import type { Policy } from "./permissions/policy.js";
import type { HookConfig } from "./hooks/types.js";

export interface SouschefConfig {
  model?: string;
  maxTurns?: number;
  permissions?: Policy;
  hooks?: HookConfig[];
  mascot?: boolean;
}

const DEFAULT_PATH = ".souschef/config.json";

export async function loadConfig(cwd: string, override?: string): Promise<SouschefConfig> {
  const target = override ?? path.join(cwd, DEFAULT_PATH);
  try {
    const text = await fs.readFile(target, "utf8");
    const parsed = JSON.parse(text) as SouschefConfig;
    return parsed;
  } catch (e) {
    if (override) {
      throw new Error(`could not read config ${override}: ${(e as Error).message}`);
    }
    return {};
  }
}
