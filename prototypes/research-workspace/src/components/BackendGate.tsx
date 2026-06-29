import { useCallback, useEffect, useRef, useState } from "react";
import { CONTROL_BASE, ensureBackendAwake } from "../lib/wakeBackend";
import BackendStartingSplash, { type SplashPhase } from "./BackendStartingSplash";

// ---------------------------------------------------------------------------
// BackendGate — wake-on-request gate for the scale-to-zero backend.
//
// Sits in front of the workspace: ensures the ECS service (idle at
// desired_count=0) is awake and healthy behind a "Starting…" splash before
// rendering children. In dev the backend is local, so it's a pass-through.
// ---------------------------------------------------------------------------

type Phase = "checking" | SplashPhase | "ready";

export default function BackendGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>(CONTROL_BASE ? "checking" : "ready");
  const [elapsed, setElapsed] = useState(0);
  const abort = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!CONTROL_BASE) return;
    abort.current?.abort();
    abort.current = new AbortController();
    setPhase("checking");
    setElapsed(0);
    const ok = await ensureBackendAwake(
      (s) => {
        setElapsed(s);
        setPhase("starting");
      },
      abort.current.signal
    );
    if (abort.current.signal.aborted) return;
    setPhase(ok ? "ready" : "error");
  }, []);

  useEffect(() => {
    run();
    return () => abort.current?.abort();
  }, [run]);

  if (phase === "ready") return <>{children}</>;
  if (phase === "checking") return null;
  return <BackendStartingSplash phase={phase} elapsed={elapsed} onRetry={run} />;
}
