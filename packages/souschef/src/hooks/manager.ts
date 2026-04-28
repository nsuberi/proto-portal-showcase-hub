import path from "node:path";
import { pathToFileURL } from "node:url";
import type {
  HookConfig,
  HookEvent,
  HookFn,
  PostToolUsePayload,
  PreToolUsePayload,
  PreToolUseResult,
  StopPayload,
} from "./types.js";
import { auditHook } from "./builtins/audit.js";
import { planSummaryHook } from "./builtins/plan-summary.js";

type Loaded = { config: HookConfig; fn: HookFn };

export class HookManager {
  private hooks: Loaded[] = [];

  static async load(configs: HookConfig[], cwd: string): Promise<HookManager> {
    const mgr = new HookManager();
    for (const cfg of configs) {
      const fn = await loadHookFn(cfg.module, cwd);
      mgr.hooks.push({ config: cfg, fn });
    }
    return mgr;
  }

  /** Add a built-in hook directly without going through dynamic import. */
  add(config: Omit<HookConfig, "module">, fn: HookFn): void {
    this.hooks.push({ config: { ...config, module: "<builtin>" }, fn });
  }

  /** Convenience for the default set: audit on every PostToolUse, plan-summary on Stop in plan mode. */
  addBuiltins(opts: { audit?: boolean; planSummary?: boolean } = {}): void {
    if (opts.audit !== false) {
      this.add({ event: "PostToolUse" }, auditHook as HookFn);
    }
    if (opts.planSummary !== false) {
      this.add({ event: "Stop", matcher: { mode: "plan" } }, planSummaryHook as HookFn);
    }
  }

  async runPreToolUse(payload: PreToolUsePayload): Promise<PreToolUseResult | undefined> {
    for (const { config, fn } of this.matching("PreToolUse", payload.mode, payload.call.name)) {
      try {
        const result = await (fn as (p: PreToolUsePayload) => Promise<PreToolUseResult | void>)(
          payload
        );
        if (result?.deny) return result;
      } catch (e) {
        process.stderr.write(`[souschef] PreToolUse hook failed (${config.module}): ${(e as Error).message}\n`);
      }
    }
    return undefined;
  }

  async runPostToolUse(payload: PostToolUsePayload): Promise<void> {
    for (const { config, fn } of this.matching("PostToolUse", payload.mode, payload.call.name)) {
      try {
        await (fn as (p: PostToolUsePayload) => Promise<void>)(payload);
      } catch (e) {
        process.stderr.write(`[souschef] PostToolUse hook failed (${config.module}): ${(e as Error).message}\n`);
      }
    }
  }

  async runStop(payload: StopPayload): Promise<void> {
    for (const { config, fn } of this.matching("Stop", payload.mode)) {
      try {
        await (fn as (p: StopPayload) => Promise<void>)(payload);
      } catch (e) {
        process.stderr.write(`[souschef] Stop hook failed (${config.module}): ${(e as Error).message}\n`);
      }
    }
  }

  private matching(event: HookEvent, mode: string, toolName?: string): Loaded[] {
    return this.hooks.filter(({ config }) => {
      if (config.event !== event) return false;
      if (config.matcher?.mode && config.matcher.mode !== mode) return false;
      if (config.matcher?.tool && toolName && config.matcher.tool !== toolName) return false;
      return true;
    });
  }
}

async function loadHookFn(modulePath: string, cwd: string): Promise<HookFn> {
  const abs = path.isAbsolute(modulePath) ? modulePath : path.resolve(cwd, modulePath);
  const mod = await import(pathToFileURL(abs).href);
  const fn = mod.default ?? mod.handler ?? mod;
  if (typeof fn !== "function") {
    throw new Error(`hook module ${modulePath} must export a default function`);
  }
  return fn as HookFn;
}
