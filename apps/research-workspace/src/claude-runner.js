// Agent SDK runner — the single place this app talks to Claude.
//
// Replaces the old pattern of screen-scraping the interactive `claude` CLI
// (authenticated with a personal Claude.ai subscription, which is not a
// permitted multi-user backend pattern). We now embed the Claude Agent SDK
// (the same engine as Claude Code) and authenticate with a single operator
// ANTHROPIC_API_KEY (commercial API).
//
// The SDK message shapes mirror the CLI's `--output-format stream-json`:
//   { type: 'system', subtype: 'init', session_id }
//   { type: 'assistant', message: { content: [{type:'text'|'tool_use', ...}] }, session_id }
//   { type: 'result', subtype, total_cost_usd, usage, num_turns, session_id }
//
// All SDK-specific option names are centralized here. If a future SDK version
// renames an option (verify against `@anthropic-ai/claude-agent-sdk` docs),
// this is the only file to touch.

import { query } from '@anthropic-ai/claude-agent-sdk';

// Default to Haiku for cost — it demonstrates the full agent loop at ~5x lower
// per-token cost than Opus. Heavier synthesis/review work opts up to Sonnet.
export const MODEL_HAIKU = 'claude-haiku-4-5';
export const MODEL_SONNET = 'claude-sonnet-4-6';

export function pickModel({ kind, intentionType } = {}) {
  if (intentionType === 'synthesis' || intentionType === 'review') return MODEL_SONNET;
  if (kind === 'deep') return MODEL_SONNET;
  return MODEL_HAIKU;
}

/**
 * Run one agent turn (or resumed session) against a user's vault.
 *
 * @param {object}   o
 * @param {string}   o.prompt            User prompt.
 * @param {string}   o.vaultDir          Per-user vault root (becomes cwd + HOME).
 * @param {string}  [o.runId]            Surfaced to hooks as CLAUDE_RUN_ID.
 * @param {string}  [o.model]            Model id (defaults to Haiku).
 * @param {number}   o.maxBudgetUsd      Hard per-run USD cap (from quota).
 * @param {number}  [o.maxTurns=15]      Agent-loop iteration cap.
 * @param {string}  [o.resumeSessionId]  Resume a prior SDK session.
 * @param {AbortController} [o.abortController]
 * @param {(e:object)=>void} [o.onEvent] Receives {type:'init'|'assistant_text'|'tool_use'|'done', ...}.
 * @returns {Promise<{sessionId, costUsd, usage, finalText, toolUses, subtype}>}
 */
export async function runAgent({
  prompt,
  vaultDir,
  runId,
  model,
  maxBudgetUsd,
  maxTurns = 15,
  resumeSessionId,
  abortController,
  onEvent,
}) {
  // ANTHROPIC_API_KEY is inherited from process.env (NOT stripped) — this is the
  // commercial-API credential. HOME=vaultDir keeps the hook scripts writing into
  // the correct per-user vault (they read process.env.HOME).
  const env = { ...process.env, HOME: vaultDir };
  if (runId) env.CLAUDE_RUN_ID = runId;

  const options = {
    cwd: vaultDir,
    model: model || MODEL_HAIKU,
    maxTurns,
    maxBudgetUsd,
    // Server-controlled, per-user vault: no interactive permission prompts.
    permissionMode: 'bypassPermissions',
    // Load <vault>/.claude (skills, hooks, settings.json with the command hooks).
    settingSources: ['project'],
    env,
  };
  if (abortController) options.abortController = abortController;
  if (resumeSessionId) options.resume = resumeSessionId;

  let sessionId = resumeSessionId || null;
  let lastText = '';
  let finalText = '';
  let costUsd = 0;
  let usage = null;
  let subtype = null;
  const toolUses = [];

  for await (const message of query({ prompt, options })) {
    if (abortController?.signal?.aborted) break;

    if (message.type === 'system' && message.subtype === 'init') {
      sessionId = message.session_id || sessionId;
      onEvent?.({ type: 'init', sessionId });
    } else if (message.type === 'assistant' && message.message?.content) {
      const blocks = message.message.content;
      const text = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('');
      if (text && text !== lastText) {
        lastText = text;
        finalText = text;
        onEvent?.({ type: 'assistant_text', content: text });
      }
      for (const b of blocks.filter((b) => b.type === 'tool_use')) {
        const tu = { tool: b.name, input: b.input || {} };
        toolUses.push(tu);
        onEvent?.({ type: 'tool_use', tool: tu.tool, input: tu.input });
      }
    } else if (message.type === 'result') {
      sessionId = message.session_id || sessionId;
      costUsd = typeof message.total_cost_usd === 'number' ? message.total_cost_usd : costUsd;
      usage = message.usage ?? usage;
      subtype = message.subtype || null;
      onEvent?.({ type: 'done', sessionId, costUsd, subtype });
    }
  }

  return { sessionId, costUsd, usage, finalText, toolUses, subtype };
}
