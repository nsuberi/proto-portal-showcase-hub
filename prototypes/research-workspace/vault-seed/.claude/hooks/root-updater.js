#!/usr/bin/env node
/**
 * Root Updater — Stop Hook
 *
 * Runs at the end of a Claude Code session. Analyzes the conversation transcript
 * (from session context) for mastery signals — indications that the user has
 * internalized a branch topic. Logs signals to .root-signals.jsonl for the
 * root-deepener skill to evaluate.
 *
 * Mastery signals include:
 * - User explains a concept unprompted
 * - User uses domain vocabulary casually
 * - User connects concept to other domains
 * - User asks questions that presuppose understanding
 *
 * Hook type: Stop
 */

const fs = require('fs');
const path = require('path');

const home = process.env.HOME || '/tmp';

const MASTERY_PATTERNS = [
  { pattern: /(?:so basically|in other words|the way I see it|what this means is)/i, signal: 'explaining_unprompted' },
  { pattern: /(?:this is (?:just )?like|reminds me of|similar to|analogous to)/i, signal: 'cross_domain_connection' },
  { pattern: /(?:but what about|doesn't that mean|wouldn't it be better to|how does .+ handle)/i, signal: 'presupposing_question' },
  { pattern: /(?:oh I get it|so it's basically|wait so|ah so the key insight)/i, signal: 'restatement' },
  { pattern: /(?:that's like|this connects to|I see the connection)/i, signal: 'insight_connection' },
];

try {
  // Read stdin — session context with transcript
  const input = fs.readFileSync(0, 'utf-8').trim() || '{}';
  const session = JSON.parse(input);

  // Extract user messages from the transcript
  const transcript = session.transcript || session.messages || [];
  const userMessages = Array.isArray(transcript)
    ? transcript.filter(m => m.role === 'human' || m.role === 'user').map(m => {
        if (typeof m.content === 'string') return m.content;
        if (Array.isArray(m.content)) return m.content.filter(b => b.type === 'text').map(b => b.text).join(' ');
        return '';
      })
    : [];

  if (userMessages.length === 0) {
    fs.writeSync(1, '');
    process.exit(0);
  }

  const allUserText = userMessages.join('\n');
  const detectedSignals = [];

  for (const { pattern, signal } of MASTERY_PATTERNS) {
    if (pattern.test(allUserText)) {
      detectedSignals.push(signal);
    }
  }

  if (detectedSignals.length > 0) {
    const signalFile = path.join(home, '.root-signals.jsonl');
    const entry = {
      timestamp: new Date().toISOString(),
      signals: detectedSignals,
      messageCount: userMessages.length,
      excerpt: allUserText.slice(0, 300),
    };
    fs.appendFileSync(signalFile, JSON.stringify(entry) + '\n');
  }

  fs.writeSync(1, '');
} catch (err) {
  try { fs.appendFileSync(path.join(home, '.hook-debug.log'), `[root-updater] ${err.message}\n`); } catch {}
  fs.writeSync(1, '');
}
