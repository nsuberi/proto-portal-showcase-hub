# souschef

A minimal Claude-Code-style agentic CLI with an Ink-based React terminal UI. Built as
a learning exercise / reference implementation alongside the rest of this portfolio
monorepo.

> See [PLAN.md](./PLAN.md) for the as-built design record (architecture, module
> sketches, decision log).

## Features

- **Tool-use agent loop** over Anthropic's `messages` API with structured `tool_use` /
  `tool_result` blocks.
- **Plan mode** (read-only) and **edit mode** (full tool access). Mode is hot-swappable
  mid-conversation via `/mode plan` / `/mode edit`.
- **Hooks**: `PreToolUse` (can veto), `PostToolUse` (observational), `Stop` (per-cycle).
- **Permissions** with three tiers (`allow` / `ask` / `deny`), arg-pattern matching, and
  session-scoped "always allow this" memory.
- **Multi-turn conversation persistence** — the transcript lives for the lifetime of the
  process; follow-ups have full context.
- **Clarify tool** — the model can ask the user a structured design-decision question
  and receive the answer back as a tool result.
- **Ink TUI** with transcript view, status bar, input box, and modal permission /
  clarify prompts. Plus a small ASCII souschef mascot.
- **Headless mode** (`--no-tui`) for piped / CI use.

## Installation

This is a workspace package — installed via the monorepo's yarn install:

```bash
yarn install
yarn workspace @proto-portal/souschef build
```

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

```bash
# Interactive TUI, edit mode
node packages/souschef/dist/cli.js

# Seeded prompt, plan mode (read-only)
node packages/souschef/dist/cli.js --plan "summarize this repo's architecture"

# Headless / piped
node packages/souschef/dist/cli.js --no-tui --once "list the top-level folders"

# Custom config
node packages/souschef/dist/cli.js --config ./my-config.json "..."
```

### Slash commands (in interactive mode)

| Command | Effect |
|---|---|
| `/exit` | End the session. |
| `/clear` | Wipe the transcript, keep mode + permissions. |
| `/mode plan` / `/mode edit` | Hot-swap modes mid-conversation. |
| `/save <path>` | Write transcript JSON to a file. |
| `/help` | Show available slash commands. |

### Flags

| Flag | Effect |
|---|---|
| `--plan` | Force plan mode (read-only). |
| `--edit` | Force edit mode (default). |
| `--once` | Run a single cycle and exit. |
| `--no-tui` | Skip Ink, print events as plain text, use readline for prompts. |
| `--no-mascot` | Suppress the ASCII souschef banner + glyph. |
| `--max-turns N` | Cap turns per cycle (default 25). |
| `--config <path>` | Load a config file (default `.souschef/config.json`). |
| `--model <id>` | Override the Anthropic model. |
| `--help` | Show usage. |

## Configuration

`.souschef/config.json` (loaded from cwd by default):

```json
{
  "model": "claude-sonnet-4-6",
  "maxTurns": 25,
  "permissions": {
    "read-file": "allow",
    "run-shell:rm *": "deny",
    "run-shell:git *": "ask",
    "write-file:**/*.md": "allow"
  },
  "hooks": [
    { "event": "PostToolUse", "module": "./hooks/audit.js" },
    { "event": "Stop", "matcher": { "mode": "plan" }, "module": "./hooks/save-plan.js" }
  ]
}
```

## Hooks API

A hook module exports a default function:

```js
// .souschef/hooks/audit.js
export default async function audit({ call, result }) {
  console.error(`[audit] ${call.name} → ${result.is_error ? "error" : "ok"}`);
}
```

PreToolUse hooks can veto a tool call by returning `{ deny: true, reason }`.

## Architecture

See [PLAN.md](./PLAN.md). High-level: the `Session` is a long-lived event emitter that
drives an outer "wait for user input" loop and an inner "agent cycle" loop. The Ink TUI
subscribes to events and presents an `InputBox`, `PermissionPrompt`, or `ClarifyPrompt`
depending on what the session is awaiting.

## Tools shipped in v1

| Tool | Mode | Effect |
|---|---|---|
| `read-file` | plan + edit | Read a file (head/tail/range slicing). |
| `list-dir` | plan + edit | Shallow directory listing. |
| `grep` | plan + edit | Recursive ripgrep-style text search (uses `rg` if available, falls back to JS scan). |
| `write-file` | edit | Create / overwrite a file. |
| `edit-file` | edit | Exact string replacement in a file. |
| `run-shell` | edit | Run a shell command (always `ask` by default). |
| `clarify` | plan + edit | Ask the user a structured design-decision question. |
| `finish` | plan + edit | Pseudo-tool the model can call to end the cycle with a structured payload. |

## Caveats

This is intentionally minimal. See PLAN.md for the explicit "leaves out" list. Notable:
no streaming, no subagents, no MCP integration, no cross-invocation persistence, no
tokenizer-aware compaction.
