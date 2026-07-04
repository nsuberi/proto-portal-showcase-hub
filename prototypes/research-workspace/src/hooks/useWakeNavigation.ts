import { useCallback, useEffect, useRef, useState } from "react";
import { ensureBackendAwake } from "../lib/wakeBackend";
import type { SplashPhase } from "../components/BackendStartingSplash";

// Wakes the scale-to-zero backend, then performs a full-page navigation to a
// Cognito-authenticated /vault URL. Use for sign-in entry points so they don't
// hit a 503 when the service is asleep. Render <BackendStartingSplash> while
// `waking` is true.

export function useWakeNavigation() {
  const [waking, setWaking] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>("starting");
  const [elapsed, setElapsed] = useState(0);
  const target = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const wakeThenNavigate = useCallback(async (url: string) => {
    target.current = url;
    abort.current?.abort();
    abort.current = new AbortController();
    setWaking(true);
    setPhase("starting");
    setElapsed(0);
    const ok = await ensureBackendAwake(setElapsed, abort.current.signal);
    if (abort.current.signal.aborted) return;
    if (ok) {
      window.location.href = url;
    } else {
      setPhase("error");
    }
  }, []);

  const retry = useCallback(() => {
    if (target.current) wakeThenNavigate(target.current);
  }, [wakeThenNavigate]);

  useEffect(() => () => abort.current?.abort(), []);

  return { waking, phase, elapsed, wakeThenNavigate, retry };
}
