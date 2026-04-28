#!/usr/bin/env node

import process from "node:process";
import readline from "node:readline/promises";
import React from "react";
import { render } from "ink";
import { AnthropicClient } from "./model/anthropic.js";
import { Session } from "./session.js";
import type { ModeName } from "./model/types.js";
import { getMode } from "./modes/index.js";
import { loadConfig } from "./config.js";
import { HookManager } from "./hooks/manager.js";
import type { SessionEvent } from "./ui/events.js";
import { readlinePermissionPrompt } from "./permissions/prompt.js";
import { App } from "./ui/App.js";

interface ParsedArgs {
  mode: ModeName;
  prompt?: string;
  noTui: boolean;
  noMascot: boolean;
  once: boolean;
  maxTurns?: number;
  configPath?: string;
  modelOverride?: string;
  help: boolean;
}

const USAGE = `souschef — a tiny Claude-Code-style agentic CLI

Usage:
  souschef                           Interactive TUI, edit mode
  souschef "<prompt>"                Interactive TUI, seeded prompt
  souschef --plan "<prompt>"         Plan mode (read-only)
  souschef --edit "<prompt>"         Edit mode (default)
  souschef --once "<prompt>"         Run a single cycle and exit
  souschef --no-tui "<prompt>"       Headless: plain text + readline prompts
  souschef --no-mascot "<prompt>"    Suppress the ASCII souschef
  souschef --max-turns 10 "<prompt>" Cap turns per cycle
  souschef --config path "<prompt>"  Override config file
  souschef --model id "<prompt>"     Override model
  souschef --help                    Show this help
`;

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {
    mode: "edit",
    noTui: false,
    noMascot: false,
    once: false,
    help: false,
  };
  const promptParts: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--plan":
        out.mode = "plan";
        break;
      case "--edit":
        out.mode = "edit";
        break;
      case "--no-tui":
        out.noTui = true;
        break;
      case "--no-mascot":
        out.noMascot = true;
        break;
      case "--once":
        out.once = true;
        break;
      case "--help":
      case "-h":
        out.help = true;
        break;
      case "--max-turns":
        out.maxTurns = Number(argv[++i]);
        break;
      case "--config":
        out.configPath = argv[++i];
        break;
      case "--model":
        out.modelOverride = argv[++i];
        break;
      default:
        promptParts.push(a);
    }
  }
  if (promptParts.length > 0) out.prompt = promptParts.join(" ");
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(USAGE);
    return;
  }

  const cwd = process.cwd();
  const config = await loadConfig(cwd, args.configPath);

  const model = args.modelOverride ?? config.model ?? "claude-sonnet-4-6";
  const maxTurns = args.maxTurns ?? config.maxTurns ?? 25;
  const showMascot = !args.noMascot && config.mascot !== false;

  const useTui = !args.noTui && process.stdout.isTTY;

  const client = new AnthropicClient({ model });

  const hooks = await HookManager.load(config.hooks ?? [], cwd);
  // The TUI already shows tool calls inline via ToolCallCard; the stderr audit log
  // is only useful in headless / CI invocations where there's no live render.
  hooks.addBuiltins({ audit: !useTui });

  const mode = getMode(args.mode);
  const basePolicy = { ...mode.defaultPolicy, ...(config.permissions ?? {}) };

  const session = new Session({
    client,
    hooks,
    cwd,
    mode: args.mode,
    modelLabel: friendlyModelLabel(model),
    basePolicy,
    maxTurns,
    once: args.once,
    initialPrompt: args.prompt,
  });

  if (useTui) {
    const ink = render(
      React.createElement(App, {
        session,
        modelLabel: friendlyModelLabel(model),
        maxTurns,
        showMascot,
      })
    );
    const sessionPromise = session.start();
    await sessionPromise;
    ink.unmount();
    await ink.waitUntilExit().catch(() => {});
  } else {
    await runHeadless(session, showMascot);
  }
}

function friendlyModelLabel(model: string): string {
  // Strip the "claude-" prefix and any "-YYYYMMDD" date suffix to get e.g.
  // "sonnet-4-6" → "sonnet 4.6", "opus-4-7" → "opus 4.7", "haiku-4-5" → "haiku 4.5".
  const withoutPrefix = model.replace(/^claude-/, "").replace(/-\d{8}$/, "");
  const family = withoutPrefix.match(/^(opus|sonnet|haiku)/)?.[1];
  if (!family) return model;
  const versionMatch = withoutPrefix.match(/^(?:opus|sonnet|haiku)-(\d+(?:-\d+)?)/);
  if (!versionMatch) return family;
  const version = versionMatch[1].replace("-", ".");
  return `${family} ${version}`;
}

async function runHeadless(session: Session, showMascot: boolean): Promise<void> {
  if (showMascot) {
    process.stdout.write("    .---.\n");
    process.stdout.write("   /     \\    souschef\n");
    process.stdout.write("  | (o_o) |   what shall we cook?\n");
    process.stdout.write("   `-----'\n\n");
  }

  session.on("event", (event: SessionEvent) => handleHeadlessEvent(event, session));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // If stdin is a TTY, prompt the user line-by-line; otherwise the initial prompt
  // (passed as argv) is the only message and we just let the session run to completion.
  if (process.stdin.isTTY) {
    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      session.sendUserMessage(trimmed);
    });
    rl.on("close", () => session.exit());
  }

  const sessionPromise = session.start();
  await sessionPromise;
  rl.close();
}

function handleHeadlessEvent(event: SessionEvent, session: Session): void {
  switch (event.type) {
    case "session-start":
      process.stdout.write(`[souschef] mode=${event.mode} model=${event.model}\n`);
      break;
    case "user-message":
      process.stdout.write(`\n[you] ${event.text}\n`);
      break;
    case "assistant-message": {
      const text = event.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("\n\n")
        .trim();
      if (text) process.stdout.write(`\n[souschef]\n${text}\n`);
      break;
    }
    case "tool-call":
      process.stdout.write(`  ▸ ${event.call.name}\n`);
      break;
    case "tool-result":
      process.stdout.write(`    ${event.result.is_error ? "✗" : "✓"} ${firstLine(event.result.content)}\n`);
      break;
    case "permission-request":
      void (async () => {
        const answer = await readlinePermissionPrompt(event.payload.call, event.payload.canonicalArg);
        session.respond(event.payload.id, answer);
      })();
      break;
    case "clarify-request":
      void (async () => {
        const answer = await readlineClarify(event.payload);
        session.respond(event.payload.id, answer);
      })();
      break;
    case "stop":
      process.stdout.write(`[stop: ${event.reason}]\n`);
      break;
    case "info":
      process.stdout.write(`[info] ${event.text}\n`);
      break;
    case "error":
      process.stderr.write(`[error] ${event.text}\n`);
      break;
    default:
      break;
  }
}

function firstLine(s: string | undefined): string {
  if (!s) return "";
  const line = s.split("\n", 1)[0] ?? "";
  return line.length > 120 ? `${line.slice(0, 120)}…` : line;
}

async function readlineClarify(payload: {
  question: string;
  context?: string;
  options: { id: string; label: string }[];
  allowMultiple: boolean;
}): Promise<string[]> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write(`\n[souschef:clarify] ${payload.question}\n`);
    if (payload.context) process.stdout.write(`  ${payload.context}\n`);
    payload.options.forEach((o, i) => process.stdout.write(`  ${i + 1}. ${o.label}\n`));
    const hint = payload.allowMultiple
      ? "Enter comma-separated numbers (e.g. '1,3'): "
      : "Enter a number: ";
    const raw = (await rl.question(hint)).trim();
    const indices = raw
      .split(/[,\s]+/)
      .map((s) => Number(s) - 1)
      .filter((n) => Number.isInteger(n) && n >= 0 && n < payload.options.length);
    if (indices.length === 0) return [payload.options[0].id];
    return (payload.allowMultiple ? indices : [indices[0]]).map((i) => payload.options[i].id);
  } finally {
    rl.close();
  }
}

main().catch((e) => {
  process.stderr.write(`fatal: ${(e as Error).message}\n`);
  process.exit(1);
});
