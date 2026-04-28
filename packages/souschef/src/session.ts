import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { Message, ModeName, ToolResultBlock, ToolUseBlock } from "./model/types.js";
import type { AnthropicClient } from "./model/anthropic.js";
import type { ModeConfig } from "./modes/plan.js";
import { getMode } from "./modes/index.js";
import * as registry from "./tools/registry.js";
import type { ModeRegistry } from "./tools/registry.js";
import { ok, err } from "./tools/types.js";
import type { Policy } from "./permissions/policy.js";
import { resolve as resolvePolicy } from "./permissions/policy.js";
import type { HookManager } from "./hooks/manager.js";
import { assembleContext } from "./context/assemble.js";
import type {
  ClarifyOption,
  ClarifyRequestPayload,
  PermissionRequestPayload,
  SessionEvent,
} from "./ui/events.js";
import type { PermissionAnswer } from "./permissions/prompt.js";

export interface SessionOptions {
  client: AnthropicClient;
  hooks: HookManager;
  cwd: string;
  mode: ModeName;
  modelLabel: string;
  basePolicy: Policy;
  maxTurns: number;
  once: boolean;
  initialPrompt?: string;
}

type UserInput =
  | { kind: "message"; text: string }
  | { kind: "command"; cmd: string; args: string[] }
  | { kind: "exit" };

type PendingResolver = (value: unknown) => void;

export class Session extends EventEmitter {
  private opts: SessionOptions;
  private mode: ModeConfig;
  private toolRegistry: ModeRegistry;
  private transcript: Message[] = [];
  private runtimePolicy: Policy = {};
  private inbox: UserInput[] = [];
  private inboxResolver: ((input: UserInput) => void) | null = null;
  private pending: Map<string, PendingResolver> = new Map();
  private currentTurn: number | null = null;
  private busy = false;

  constructor(opts: SessionOptions) {
    super();
    this.opts = opts;
    this.mode = getMode(opts.mode);
    this.toolRegistry = registry.forMode(this.mode.name, this.mode.allowedTools);
  }

  // ───────────── Public API used by the UI / CLI ─────────────

  sendUserMessage(text: string): void {
    if (text.startsWith("/")) {
      const [cmd, ...args] = text.slice(1).split(/\s+/);
      this.pushInput({ kind: "command", cmd, args });
    } else {
      this.pushInput({ kind: "message", text });
    }
  }

  exit(): void {
    this.pushInput({ kind: "exit" });
  }

  /** Resolve a pending UI request (permission or clarify). */
  respond(id: string, value: unknown): void {
    const resolver = this.pending.get(id);
    if (!resolver) return;
    this.pending.delete(id);
    resolver(value);
  }

  get isBusy(): boolean {
    return this.busy;
  }

  get currentTurnNumber(): number | null {
    return this.currentTurn;
  }

  get modeName(): ModeName {
    return this.mode.name;
  }

  // ───────────── Main entrypoint ─────────────

  async start(): Promise<void> {
    this.emitEvent({ type: "session-start", mode: this.mode.name, model: this.opts.modelLabel });
    if (this.opts.initialPrompt) this.sendUserMessage(this.opts.initialPrompt);

    while (true) {
      this.emitEvent({ type: "awaiting-user-input" });
      const input = await this.popInput();

      if (input.kind === "exit") break;

      if (input.kind === "command") {
        const shouldExit = await this.handleSlash(input.cmd, input.args);
        if (shouldExit) break;
        continue;
      }

      this.emitEvent({ type: "user-message", text: input.text });
      this.transcript.push({ role: "user", content: input.text });

      try {
        await this.runAgentCycle();
      } catch (e) {
        this.emitEvent({ type: "error", text: (e as Error).message });
      }

      if (this.opts.once) break;
    }

    this.emitEvent({ type: "session-end" });
  }

  // ───────────── Agent loop ─────────────

  private async runAgentCycle(): Promise<void> {
    for (let turn = 0; turn < this.opts.maxTurns; turn++) {
      this.currentTurn = turn;
      this.emitEvent({ type: "turn-started", turn });

      this.busy = true;
      const { system, messages } = assembleContext({
        transcript: this.transcript,
        mode: this.mode,
        cwd: this.opts.cwd,
        toolNames: this.toolRegistry.tools.map((t) => t.schema.name),
      });

      const response = await this.opts.client.messages({
        system,
        messages,
        tools: this.toolRegistry.schemas,
      });
      this.busy = false;

      this.transcript.push({ role: "assistant", content: response.content });
      this.emitEvent({ type: "assistant-message", content: response.content });

      const toolUses = response.content.filter(
        (b): b is ToolUseBlock => b.type === "tool_use"
      );

      const finishCall = toolUses.find((t) => t.name === "finish");
      const naturalEnd = response.stop_reason === "end_turn" || toolUses.length === 0;
      if (naturalEnd || finishCall) {
        if (finishCall) {
          const result = ok(finishCall, (finishCall.input.summary as string) ?? "(finished)");
          this.transcript.push({ role: "user", content: [result] });
          this.emitEvent({ type: "tool-call", call: finishCall });
          this.emitEvent({ type: "tool-result", call: finishCall, result });
        }
        await this.opts.hooks.runStop({
          transcript: this.transcript,
          reason: finishCall ? "end_turn" : response.stop_reason,
          mode: this.mode.name,
        });
        this.emitEvent({ type: "stop", reason: finishCall ? "end_turn" : response.stop_reason });
        this.currentTurn = null;
        return;
      }

      const toolResults: ToolResultBlock[] = [];
      for (const call of toolUses) {
        if (call.name === "finish") continue;
        this.emitEvent({ type: "tool-call", call });

        this.busy = true;
        const result = await this.dispatchToolCall(call);
        this.busy = false;
        this.emitEvent({ type: "tool-result", call, result });
        toolResults.push(result);
      }
      this.transcript.push({ role: "user", content: toolResults });
    }

    await this.opts.hooks.runStop({
      transcript: this.transcript,
      reason: "max_turns",
      mode: this.mode.name,
    });
    this.emitEvent({ type: "stop", reason: "max_turns" });
    this.currentTurn = null;
  }

  private async dispatchToolCall(call: ToolUseBlock): Promise<ToolResultBlock> {
    // Pre-tool-use hook may veto.
    const veto = await this.opts.hooks.runPreToolUse({ call, mode: this.mode.name });
    if (veto?.deny) return err(call, `pre-tool-use hook denied: ${veto.reason ?? "no reason given"}`);

    if (call.name === "clarify") {
      return this.runClarify(call);
    }

    const tool = this.toolRegistry.get(call.name);
    if (!tool) return err(call, `tool '${call.name}' not available in ${this.mode.name} mode`);

    const canonicalArg = tool.canonicalArg(call);
    const decision = resolvePolicy(call, this.opts.basePolicy, this.runtimePolicy, { canonicalArg });

    let final: PermissionAnswer | "allow" | "deny" = decision === "ask" ? "deny" : decision;
    if (decision === "ask") {
      final = await this.requestPermission(call, canonicalArg);
      if (final === "always-allow") this.runtimePolicy[call.name] = "allow";
    }
    if (final === "deny") return err(call, `tool call denied`);

    const result = await this.toolRegistry.execute(call, { cwd: this.opts.cwd });
    await this.opts.hooks.runPostToolUse({ call, result, mode: this.mode.name });
    return result;
  }

  // ───────────── UI bridges ─────────────

  private requestPermission(call: ToolUseBlock, canonicalArg: string | undefined): Promise<PermissionAnswer> {
    return new Promise((resolve) => {
      const id = randomUUID();
      this.pending.set(id, resolve as PendingResolver);
      const payload: PermissionRequestPayload = { id, call, canonicalArg };
      this.emitEvent({ type: "permission-request", payload });
    });
  }

  private async runClarify(call: ToolUseBlock): Promise<ToolResultBlock> {
    const question = (call.input.question as string | undefined) ?? "(no question provided)";
    const options = (call.input.options as ClarifyOption[] | undefined) ?? [];
    if (options.length < 2) {
      return err(call, "clarify requires at least 2 options");
    }
    const allowMultiple = Boolean(call.input.allow_multiple);
    const context = call.input.context as string | undefined;

    const answer = await new Promise<string[]>((resolve) => {
      const id = randomUUID();
      this.pending.set(id, resolve as PendingResolver);
      const payload: ClarifyRequestPayload = { id, question, context, options, allowMultiple };
      this.emitEvent({ type: "clarify-request", payload });
    });

    const labels = answer
      .map((id) => options.find((o) => o.id === id)?.label ?? id)
      .join(", ");
    return ok(call, `User selected: ${labels} (ids: ${answer.join(", ")})`);
  }

  // ───────────── Slash commands ─────────────

  private async handleSlash(cmd: string, args: string[]): Promise<boolean> {
    switch (cmd) {
      case "exit":
      case "quit":
        return true;
      case "clear":
        this.transcript = [];
        this.emitEvent({ type: "transcript-cleared" });
        return false;
      case "mode": {
        const target = args[0] as ModeName | undefined;
        if (target !== "plan" && target !== "edit") {
          this.emitEvent({ type: "error", text: "usage: /mode plan | /mode edit" });
          return false;
        }
        this.mode = getMode(target);
        this.toolRegistry = registry.forMode(this.mode.name, this.mode.allowedTools);
        this.emitEvent({ type: "mode-changed", mode: this.mode.name });
        return false;
      }
      case "save": {
        const target = args[0];
        if (!target) {
          this.emitEvent({ type: "error", text: "usage: /save <path>" });
          return false;
        }
        try {
          const fs = await import("node:fs/promises");
          await fs.writeFile(target, JSON.stringify(this.transcript, null, 2), "utf8");
          this.emitEvent({ type: "info", text: `transcript saved to ${target}` });
        } catch (e) {
          this.emitEvent({ type: "error", text: `save failed: ${(e as Error).message}` });
        }
        return false;
      }
      case "context":
        await this.reportContext();
        return false;
      case "help":
        this.emitEvent({
          type: "info",
          text:
            "/exit — end session · /clear — wipe transcript · /mode plan|edit — switch mode · /context — token usage · /save <path> — write transcript JSON · /help — this list",
        });
        return false;
      default:
        this.emitEvent({ type: "error", text: `unknown command: /${cmd}` });
        return false;
    }
  }

  /** Compute & emit a snapshot of how much context the next turn would send. */
  private async reportContext(): Promise<void> {
    const { system, messages } = assembleContext({
      transcript: this.transcript,
      mode: this.mode,
      cwd: this.opts.cwd,
      toolNames: this.toolRegistry.tools.map((t) => t.schema.name),
    });
    const tools = this.toolRegistry.schemas;

    const localEstimate = estimateTokens({ system, messages, tools });
    this.emitEvent({
      type: "info",
      text: formatContextLine("computing context size…", localEstimate),
    });

    let exact: number | null = null;
    let exactErr: string | null = null;
    try {
      const res = await this.opts.client.countTokens({ system, messages, tools });
      exact = res.input_tokens;
    } catch (e) {
      exactErr = (e as Error).message;
    }

    const window = contextWindowFor(this.opts.client.model);
    const total = exact ?? localEstimate.total;
    const pct = window > 0 ? Math.round((total / window) * 100) : 0;
    const lines = [
      `context: ${exact !== null ? `${exact.toLocaleString()} input tokens (exact)` : `~${localEstimate.total.toLocaleString()} tokens (local estimate)`} — ${pct}% of ${window.toLocaleString()}`,
      `  system: ~${localEstimate.system.toLocaleString()}  ·  transcript: ~${localEstimate.transcript.toLocaleString()} (${messages.length} messages)  ·  tools: ~${localEstimate.tools.toLocaleString()} (${tools.length} schemas)`,
    ];
    if (exactErr) lines.push(`  (count_tokens API failed: ${exactErr})`);
    this.emitEvent({ type: "info", text: lines.join("\n") });
  }

  // ───────────── Inbox plumbing ─────────────

  private pushInput(input: UserInput): void {
    if (this.inboxResolver) {
      const resolver = this.inboxResolver;
      this.inboxResolver = null;
      resolver(input);
    } else {
      this.inbox.push(input);
    }
  }

  private popInput(): Promise<UserInput> {
    return new Promise((resolve) => {
      const queued = this.inbox.shift();
      if (queued) resolve(queued);
      else this.inboxResolver = resolve;
    });
  }

  private emitEvent(event: SessionEvent): void {
    // NOTE: We emit only on the unified "event" channel. Emitting on event.type
    // would conflict with Node's special handling of EventEmitter "error" events
    // (which throw by default when there's no listener), and nothing in the codebase
    // subscribes to per-type events anyway.
    this.emit("event", event);
  }
}

// ───────────── Token estimation helpers (local, not using the API) ─────────────

interface LocalEstimate {
  system: number;
  transcript: number;
  tools: number;
  total: number;
}

const CHARS_PER_TOKEN = 4; // standard heuristic for English; close enough for /context.

function estimateTokens(input: {
  system?: string;
  messages: Message[];
  tools?: { name: string; description: string; input_schema: unknown }[];
}): LocalEstimate {
  const system = input.system ? Math.ceil(input.system.length / CHARS_PER_TOKEN) : 0;
  let transcript = 0;
  for (const m of input.messages) {
    if (typeof m.content === "string") {
      transcript += Math.ceil(m.content.length / CHARS_PER_TOKEN);
    } else {
      for (const b of m.content) {
        if (b.type === "text") transcript += Math.ceil(b.text.length / CHARS_PER_TOKEN);
        else if (b.type === "tool_use")
          transcript += Math.ceil((b.name.length + JSON.stringify(b.input).length) / CHARS_PER_TOKEN);
        else if (b.type === "tool_result")
          transcript += Math.ceil(((b.content?.length ?? 0) + 16) / CHARS_PER_TOKEN);
      }
    }
  }
  const tools = (input.tools ?? []).reduce((acc, t) => {
    return acc + Math.ceil((t.name.length + t.description.length + JSON.stringify(t.input_schema).length) / CHARS_PER_TOKEN);
  }, 0);
  return { system, transcript, tools, total: system + transcript + tools };
}

function contextWindowFor(model: string): number {
  // Conservative defaults; the 1M beta on sonnet-4.6 isn't auto-enabled.
  if (/opus-4-7|opus-4-6|sonnet-4-6|sonnet-4-5/.test(model)) return 200_000;
  if (/haiku-4-5/.test(model)) return 200_000;
  return 200_000;
}

function formatContextLine(prefix: string, est: LocalEstimate): string {
  return `${prefix} (~${est.total.toLocaleString()} tokens local estimate)`;
}
