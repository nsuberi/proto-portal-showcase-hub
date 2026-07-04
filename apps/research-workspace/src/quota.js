// Per-user + org quota enforcement for agent runs.
//
// Why this exists: the workspace now bills every Claude call to a single
// operator ANTHROPIC_API_KEY (commercial API), not to per-user Claude
// subscriptions. That means cost exposure is ours, so every run is gated by:
//   - an allowlist (invite-only demo; keyed on the Cognito `sub`, so a shared
//     link is useless to a non-allowlisted identity),
//   - a per-user daily run count and daily USD budget,
//   - a per-user concurrency cap,
//   - an org-wide daily USD ceiling (soft; the hard floor is the Anthropic
//     Console workspace spend limit).
//
// Backed by DynamoDB in production (set QUOTA_TABLE); falls back to an
// in-memory store for local dev so the app runs with zero AWS setup.

import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.QUOTA_TABLE || '';
const REGION = process.env.AWS_REGION || 'us-east-1';

// --- Policy (env-overridable; defaults match the agreed demo budget) ---
const RUNS_PER_DAY    = parseInt(process.env.QUOTA_RUNS_PER_DAY || '5', 10);
const USD_PER_DAY     = parseFloat(process.env.QUOTA_USD_PER_DAY || '5');
const USD_PER_RUN     = parseFloat(process.env.QUOTA_USD_PER_RUN || '1');
const ORG_USD_PER_DAY = parseFloat(process.env.QUOTA_ORG_USD_PER_DAY || '25');
const STALE_LOCK_MS   = parseInt(process.env.QUOTA_STALE_LOCK_MS || String(35 * 60 * 1000), 10);
// Below this remaining budget a run isn't worth starting — treat as exhausted.
const MIN_RUN_USD = 0.05;

// Allowlist: comma-separated Cognito subs. Empty => allow everyone (dev/open).
const ALLOWLIST = (process.env.ALLOWLIST || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ALLOWLIST_ENABLED = ALLOWLIST.length > 0;

export const QUOTA_LIMITS = {
  runsPerDay: RUNS_PER_DAY,
  usdPerDay: USD_PER_DAY,
  usdPerRun: USD_PER_RUN,
  orgUsdPerDay: ORG_USD_PER_DAY,
  allowlistEnabled: ALLOWLIST_ENABLED,
};

function utcDay(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}
function ttlEpoch(now = Date.now()) {
  return Math.floor(now / 1000) + 48 * 3600; // 48h retention
}

export function isAllowed(userId) {
  if (!ALLOWLIST_ENABLED) return true;
  return ALLOWLIST.includes(userId);
}

// --- Storage backends -------------------------------------------------------

let doc = null;
if (TABLE) {
  doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    marshallOptions: { removeUndefinedValues: true },
  });
  console.log(`[quota] DynamoDB backend: ${TABLE} (${REGION})`);
} else {
  console.warn('[quota] QUOTA_TABLE not set — using in-memory quota (dev only, not shared across tasks)');
}

// In-memory fallback: Map<"pk|sk", item>
const mem = new Map();
const memKey = (pk, sk) => `${pk}|${sk}`;

const userPk = (userId) => `USER#${userId}`;
const dayKey = (date) => `DAY#${date}`;
const ACTIVE = 'ACTIVE';
const ORG_PK = 'ORG';

async function readUsage(pk, sk) {
  if (doc) {
    const r = await doc.send(new GetCommand({ TableName: TABLE, Key: { pk, sk } }));
    const item = r.Item || {};
    return { spendUsd: Number(item.spendUsd || 0), runCount: Number(item.runCount || 0) };
  }
  const item = mem.get(memKey(pk, sk)) || {};
  return { spendUsd: Number(item.spendUsd || 0), runCount: Number(item.runCount || 0) };
}

async function addUsage(pk, sk, costUsd, incRun) {
  if (doc) {
    await doc.send(new UpdateCommand({
      TableName: TABLE,
      Key: { pk, sk },
      UpdateExpression: 'SET expiresAt = :ttl ADD spendUsd :c, runCount :r',
      ExpressionAttributeValues: { ':ttl': ttlEpoch(), ':c': costUsd, ':r': incRun ? 1 : 0 },
    }));
    return;
  }
  const k = memKey(pk, sk);
  const item = mem.get(k) || { spendUsd: 0, runCount: 0 };
  item.spendUsd += costUsd;
  item.runCount += incRun ? 1 : 0;
  mem.set(k, item);
}

// Acquire the single-slot concurrency lock. Returns true if acquired.
// A lock older than STALE_LOCK_MS (crashed run) is reclaimed.
async function acquireLock(userId, runId, now = Date.now()) {
  const pk = userPk(userId);
  if (doc) {
    try {
      await doc.send(new PutCommand({
        TableName: TABLE,
        Item: { pk, sk: ACTIVE, startedAt: now, runId, expiresAt: ttlEpoch(now) },
        ConditionExpression: 'attribute_not_exists(pk) OR startedAt < :stale',
        ExpressionAttributeValues: { ':stale': now - STALE_LOCK_MS },
      }));
      return true;
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') return false;
      throw err;
    }
  }
  const k = memKey(pk, ACTIVE);
  const existing = mem.get(k);
  if (existing && (now - existing.startedAt) < STALE_LOCK_MS) return false;
  mem.set(k, { startedAt: now, runId });
  return true;
}

async function releaseLock(userId) {
  const pk = userPk(userId);
  if (doc) {
    await doc.send(new DeleteCommand({ TableName: TABLE, Key: { pk, sk: ACTIVE } })).catch(() => {});
    return;
  }
  mem.delete(memKey(pk, ACTIVE));
}

// --- Activity heartbeat (drives scale-to-zero) ------------------------------
// The scaler Lambda reaps the ECS service when this timestamp goes stale. We
// write a single shared item (pk=SYSTEM, sk=HEARTBEAT) rather than per-user so
// any active session keeps the whole service alive. No-op in dev (no DynamoDB).

const HEARTBEAT_PK = 'SYSTEM';
const HEARTBEAT_SK = 'HEARTBEAT';

export async function touchHeartbeat(now = Date.now()) {
  if (!doc) return;
  try {
    await doc.send(new UpdateCommand({
      TableName: TABLE,
      Key: { pk: HEARTBEAT_PK, sk: HEARTBEAT_SK },
      UpdateExpression: 'SET lastActivity = :t, expiresAt = :e',
      ExpressionAttributeValues: { ':t': now, ':e': ttlEpoch(now) },
    }));
  } catch (err) {
    console.warn('[heartbeat] write failed:', err.message);
  }
}

// --- Public API -------------------------------------------------------------

// Read-only snapshot for the UI banner. Does not reserve anything.
export async function getUsage(userId) {
  const date = utcDay();
  const [day, org] = await Promise.all([
    readUsage(userPk(userId), dayKey(date)),
    readUsage(ORG_PK, dayKey(date)),
  ]);
  const remainingUsd = Math.max(0, USD_PER_DAY - day.spendUsd);
  const remainingRuns = Math.max(0, RUNS_PER_DAY - day.runCount);
  const orgRemainingUsd = Math.max(0, ORG_USD_PER_DAY - org.spendUsd);
  const perRunCapUsd = Math.min(USD_PER_RUN, remainingUsd, orgRemainingUsd);
  return {
    allowed: isAllowed(userId),
    allowlistEnabled: ALLOWLIST_ENABLED,
    spendUsd: round(day.spendUsd),
    runCount: day.runCount,
    remainingUsd: round(remainingUsd),
    remainingRuns,
    perRunCapUsd: round(perRunCapUsd),
    limits: { runsPerDay: RUNS_PER_DAY, usdPerDay: USD_PER_DAY, usdPerRun: USD_PER_RUN },
  };
}

// Pre-run gate + concurrency reservation. On success, returns the dollar cap to
// hand the SDK (maxBudgetUsd) so even the last run of the day can't overspend.
// Caller MUST call recordUsage() (which releases the lock) when the run ends.
export async function checkAndReserve(userId, runId) {
  if (!isAllowed(userId)) {
    return { ok: false, reason: 'not_allowed' };
  }
  const date = utcDay();
  const [day, org] = await Promise.all([
    readUsage(userPk(userId), dayKey(date)),
    readUsage(ORG_PK, dayKey(date)),
  ]);

  const remainingRuns = RUNS_PER_DAY - day.runCount;
  if (remainingRuns <= 0) {
    return { ok: false, reason: 'daily_runs', remainingRuns: 0, remainingUsd: round(Math.max(0, USD_PER_DAY - day.spendUsd)) };
  }
  const remainingUsd = USD_PER_DAY - day.spendUsd;
  if (remainingUsd <= MIN_RUN_USD) {
    return { ok: false, reason: 'daily_budget', remainingRuns, remainingUsd: round(Math.max(0, remainingUsd)) };
  }
  const orgRemainingUsd = ORG_USD_PER_DAY - org.spendUsd;
  if (orgRemainingUsd <= MIN_RUN_USD) {
    return { ok: false, reason: 'org_budget' };
  }

  const locked = await acquireLock(userId, runId);
  if (!locked) {
    return { ok: false, reason: 'concurrent' };
  }

  const perRunCapUsd = Math.min(USD_PER_RUN, remainingUsd, orgRemainingUsd);
  return {
    ok: true,
    perRunCapUsd: round(perRunCapUsd),
    remainingUsd: round(remainingUsd),
    remainingRuns,
  };
}

// Record actual cost (from the SDK result's total_cost_usd) and release the
// concurrency lock. Always call this once per reserved run, even on failure
// (pass 0 cost) — otherwise the lock leaks until STALE_LOCK_MS.
export async function recordUsage(userId, costUsd = 0) {
  const date = utcDay();
  const safeCost = Number.isFinite(costUsd) && costUsd > 0 ? costUsd : 0;
  await Promise.all([
    addUsage(userPk(userId), dayKey(date), safeCost, true),
    addUsage(ORG_PK, dayKey(date), safeCost, false),
  ]).catch((err) => console.warn('[quota] recordUsage failed:', err.message));
  await releaseLock(userId);
}

// Release the lock without recording a run (e.g. the run never started).
export async function release(userId) {
  await releaseLock(userId);
}

function round(n) {
  return Math.round(n * 10000) / 10000;
}
