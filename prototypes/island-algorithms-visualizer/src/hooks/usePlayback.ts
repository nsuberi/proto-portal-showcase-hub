import { useEffect, useRef } from "react";
import { useVisualizerStore } from "@/store/useVisualizerStore";

export function usePlayback(): void {
  const isPlaying = useVisualizerStore((s) => s.isPlaying);
  const fps = useVisualizerStore((s) => s.fps);
  const stepForward = useVisualizerStore((s) => s.stepForward);
  const togglePlay = useVisualizerStore((s) => s.togglePlay);
  const stepBackward = useVisualizerStore((s) => s.stepBackward);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }
    const frameMs = 1000 / fps;
    let last: number | null = null;
    let acc = 0;
    const tick = (ts: number) => {
      if (last !== null) acc += ts - last;
      last = ts;
      while (acc >= frameMs) {
        acc -= frameMs;
        stepForward();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, fps, stepForward]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepForward();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepBackward();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, stepForward, stepBackward]);
}
