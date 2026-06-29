import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// BackendGate — wake-on-request splash for the scale-to-zero backend.
//
// The ECS service idles at desired_count=0 to keep cost at $0. This gate sits in
// front of the workspace: it asks the unauthenticated /_control plane (a Lambda
// behind the ALB) whether the backend is up, triggers a wake if not, and polls
// readiness behind a "Starting…" splash before rendering the workspace.
//
// In dev there is no Lambda and the backend is always local, so the gate is a
// pass-through.
// ---------------------------------------------------------------------------

const CONTROL_BASE = import.meta.env.DEV
  ? null
  : "/prototypes/research-workspace/vault/_control";

const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 120_000; // ECS task cold start + health checks (~startPeriod 120s)

type Phase = "checking" | "starting" | "ready" | "error";

interface ControlStatus {
  ready: boolean;
  desiredCount: number;
  runningCount: number;
  healthyTargets: number;
}

async function getStatus(): Promise<ControlStatus | null> {
  try {
    const res = await fetch(`${CONTROL_BASE}/status`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ControlStatus;
  } catch {
    return null;
  }
}

async function postWake(): Promise<void> {
  try {
    await fetch(`${CONTROL_BASE}/wake`, { method: "POST", cache: "no-store" });
  } catch {
    // Best-effort — the poll loop will surface persistent failure as an error.
  }
}

export default function BackendGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>(CONTROL_BASE ? "checking" : "ready");
  const [elapsed, setElapsed] = useState(0);
  const cancelled = useRef(false);

  const run = useCallback(async () => {
    if (!CONTROL_BASE) return;
    cancelled.current = false;
    setPhase("checking");
    setElapsed(0);

    const initial = await getStatus();
    if (cancelled.current) return;
    if (initial?.ready) {
      setPhase("ready");
      return;
    }

    setPhase("starting");
    await postWake();

    const start = Date.now();
    while (!cancelled.current) {
      const waited = Date.now() - start;
      setElapsed(Math.round(waited / 1000));
      if (waited > MAX_WAIT_MS) {
        setPhase("error");
        return;
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      if (cancelled.current) return;
      const status = await getStatus();
      if (status?.ready) {
        setPhase("ready");
        return;
      }
    }
  }, []);

  useEffect(() => {
    run();
    return () => {
      cancelled.current = true;
    };
  }, [run]);

  if (phase === "ready") return <>{children}</>;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-xl, 24px)",
        background: "var(--color-surface)",
        color: "var(--color-on-surface)",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      <style>{`@keyframes rw-gate-pulse{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ maxWidth: "28rem", textAlign: "center" }}>
        {phase === "error" ? (
          <>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
              The workspace didn’t wake in time
            </h1>
            <p
              style={{
                marginTop: "var(--spacing-md, 12px)",
                color: "var(--color-on-surface-variant)",
                lineHeight: 1.5,
              }}
            >
              It can take a moment to spin up after a period of inactivity. Give it
              another try.
            </p>
            <button
              type="button"
              onClick={run}
              style={{
                marginTop: "var(--spacing-xl, 24px)",
                minHeight: "44px",
                padding: "0 var(--spacing-xl, 24px)",
                borderRadius: "var(--radius-md, 0.625rem)",
                border: "none",
                cursor: "pointer",
                background: "var(--color-primary)",
                color: "var(--color-on-primary)",
                fontSize: "0.95rem",
                fontWeight: 600,
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <div
              aria-hidden
              style={{
                width: "0.75rem",
                height: "0.75rem",
                margin: "0 auto var(--spacing-lg, 16px)",
                borderRadius: "9999px",
                background: "var(--color-primary)",
                animation: "rw-gate-pulse 1.2s ease-in-out infinite",
              }}
            />
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
              Starting the workspace…
            </h1>
            <p
              style={{
                marginTop: "var(--spacing-md, 12px)",
                color: "var(--color-on-surface-variant)",
                lineHeight: 1.5,
              }}
            >
              The research backend scales to zero when idle to save cost. Waking it
              up — this usually takes 20–40 seconds.
            </p>
            {phase === "starting" && elapsed > 0 && (
              <p
                style={{
                  marginTop: "var(--spacing-sm, 8px)",
                  fontSize: "0.8rem",
                  color: "var(--color-on-surface-variant)",
                  opacity: 0.7,
                }}
              >
                {elapsed}s elapsed
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
