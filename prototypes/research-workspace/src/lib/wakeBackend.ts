// ---------------------------------------------------------------------------
// Wake-on-request helpers for the scale-to-zero backend.
//
// The ECS service idles at desired_count=0 to keep cost at $0. Any path that
// reaches the Cognito-authenticated /vault/* ALB route (sign-in, the workspace
// itself) needs a running task, or the ALB returns 503. These helpers talk to
// the unauthenticated /_control plane (a Lambda behind the ALB) to wake the
// service and wait until it's healthy before navigating.
//
// In dev there is no Lambda and the backend is local, so everything no-ops to
// "already awake".
// ---------------------------------------------------------------------------

export const CONTROL_BASE = import.meta.env.DEV
  ? null
  : "/prototypes/research-workspace/vault/_control";

const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 120_000; // ECS cold start + health checks (~startPeriod 120s)

interface ControlStatus {
  ready: boolean;
  desiredCount: number;
  runningCount: number;
  healthyTargets: number;
}

export async function backendStatus(): Promise<ControlStatus | null> {
  if (!CONTROL_BASE) return { ready: true, desiredCount: 1, runningCount: 1, healthyTargets: 1 };
  try {
    const res = await fetch(`${CONTROL_BASE}/status`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ControlStatus;
  } catch {
    return null;
  }
}

async function postWake(): Promise<void> {
  if (!CONTROL_BASE) return;
  try {
    await fetch(`${CONTROL_BASE}/wake`, { method: "POST", cache: "no-store" });
  } catch {
    // Best-effort — the poll loop surfaces persistent failure.
  }
}

/**
 * Ensure the backend is awake and healthy. Resolves true when ready, false on
 * timeout. `onTick` receives elapsed seconds (~every poll) so callers can show
 * progress. Pass an AbortSignal to cancel (e.g. component unmount).
 */
export async function ensureBackendAwake(
  onTick?: (elapsedSec: number) => void,
  signal?: AbortSignal
): Promise<boolean> {
  if (!CONTROL_BASE) return true;

  const initial = await backendStatus();
  if (signal?.aborted) return false;
  if (initial?.ready) return true;

  await postWake();

  const start = Date.now();
  while (!signal?.aborted) {
    const waited = Date.now() - start;
    onTick?.(Math.round(waited / 1000));
    if (waited > MAX_WAIT_MS) return false;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    if (signal?.aborted) return false;
    const status = await backendStatus();
    if (status?.ready) return true;
  }
  return false;
}
