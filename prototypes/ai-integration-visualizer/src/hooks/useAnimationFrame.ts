import { useState, useEffect, useRef } from "react";

/**
 * Drives the animation loop. Returns cumulative elapsed time in milliseconds.
 */
export function useAnimationFrame(): number {
  const [time, setTime] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let last: number | null = null;
    const tick = (ts: number) => {
      if (last !== null) setTime((t) => t + (ts - last!));
      last = ts;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return time;
}
