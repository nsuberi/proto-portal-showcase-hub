/**
 * Root Updater Hook — PreToolUse (chat messages)
 *
 * Monitors user messages for mastery signals — indications that a branch
 * topic has been internalized. Logs signals to .root-signals.jsonl for the
 * root-deepener skill to evaluate.
 *
 * Mastery signals include:
 * - User explains a concept unprompted
 * - User uses domain vocabulary casually
 * - User connects concept to other domains
 * - User asks questions that presuppose understanding
 * - User restates concepts in their own words
 *
 * Hook type: PreToolUse
 * Tool filter: (monitors chat context, not specific tools)
 */

const fs = require("fs");
const path = require("path");

const MASTERY_PATTERNS = [
  // Explaining unprompted
  { pattern: /(?:so basically|in other words|the way I see it|what this means is)/i, signal: "explaining_unprompted" },
  // Using domain vocabulary casually
  { pattern: /(?:the attention heads|softmax|key-value pairs|embedding space|gradient)/i, signal: "domain_vocabulary" },
  // Connecting to other domains
  { pattern: /(?:this is (?:just )?like|reminds me of|similar to|analogous to)/i, signal: "cross_domain_connection" },
  // Questions presupposing understanding
  { pattern: /(?:but what about|doesn't that mean|wouldn't it be better to|how does .+ handle)/i, signal: "presupposing_question" },
  // Restating in own words
  { pattern: /(?:oh I get it|so it's basically|wait so|ah so the key insight)/i, signal: "restatement" },
];

module.exports = async function rootUpdater({ toolName, toolInput, context }) {
  // We monitor the conversation context, not specific tool calls
  // This hook fires on every tool use and checks recent user messages
  const userMessage = context?.lastUserMessage || toolInput?.content || "";

  if (!userMessage || typeof userMessage !== "string") return;

  const detectedSignals = [];

  for (const { pattern, signal } of MASTERY_PATTERNS) {
    if (pattern.test(userMessage)) {
      detectedSignals.push(signal);
    }
  }

  if (detectedSignals.length === 0) return;

  // Log signals to .root-signals.jsonl
  const vaultRoot = process.env.VAULT_ROOT || process.cwd();
  const signalFile = path.join(vaultRoot, ".root-signals.jsonl");

  const entry = {
    timestamp: new Date().toISOString(),
    signals: detectedSignals,
    messageExcerpt: userMessage.slice(0, 200),
    // The gardener/root-deepener will match this to branches
    // based on the conversation context
  };

  try {
    fs.appendFileSync(signalFile, JSON.stringify(entry) + "\n");
    console.log(
      `[root-updater] Detected mastery signals: ${detectedSignals.join(", ")}`
    );
  } catch (err) {
    console.log(`[root-updater] Could not write signal: ${err.message}`);
  }
};
