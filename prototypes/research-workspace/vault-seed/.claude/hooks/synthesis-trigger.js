#!/usr/bin/env node
/**
 * Synthesis Trigger — Stop Hook
 *
 * Runs at the end of a Claude Code session. Checks for .synthesis-needed-{branchId}
 * flag files. When found, queues a synthesis by writing a .synthesis-queue-{branchId}
 * file. The gardener skill checks for queued syntheses on the next session.
 *
 * Hook type: Stop
 */

const fs = require('fs');
const path = require('path');

const home = process.env.HOME || '/tmp';

try {
  // Read stdin (session context)
  fs.readFileSync(0, 'utf-8');

  const entries = fs.readdirSync(home);
  const synthesisFlags = entries.filter(f => f.startsWith('.synthesis-needed-'));

  for (const flag of synthesisFlags) {
    const branchId = flag.replace('.synthesis-needed-', '');
    const queueFile = path.join(home, `.synthesis-queue-${branchId}`);
    const flagFile = path.join(home, flag);

    // Skip if already queued
    if (fs.existsSync(queueFile)) continue;

    const flagData = JSON.parse(fs.readFileSync(flagFile, 'utf-8'));

    // Write queue entry
    fs.writeFileSync(queueFile, JSON.stringify({
      branchId,
      leafCount: flagData.leafCount,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    }));

    // Remove the trigger flag (consumed)
    fs.unlinkSync(flagFile);
  }

  fs.writeSync(1, '');
} catch (err) {
  try { fs.appendFileSync(path.join(home, '.hook-debug.log'), `[synthesis-trigger] ${err.message}\n`); } catch {}
  fs.writeSync(1, '');
}
