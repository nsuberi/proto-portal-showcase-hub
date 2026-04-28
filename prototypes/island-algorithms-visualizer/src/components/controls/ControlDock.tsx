import * as Slider from "@radix-ui/react-slider";
import { Pause, Play, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { StatusReadout } from "./StatusReadout";

export function ControlDock() {
  const isPlaying = useVisualizerStore((s) => s.isPlaying);
  const togglePlay = useVisualizerStore((s) => s.togglePlay);
  const stepForward = useVisualizerStore((s) => s.stepForward);
  const stepBackward = useVisualizerStore((s) => s.stepBackward);
  const reset = useVisualizerStore((s) => s.reset);
  const fps = useVisualizerStore((s) => s.fps);
  const setFps = useVisualizerStore((s) => s.setFps);
  const index = useVisualizerStore((s) => s.currentIndex);
  const total = useVisualizerStore((s) => s.steps.length);
  const setIndex = useVisualizerStore((s) => s.setIndex);

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface/70 p-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <IconButton onClick={reset} title="Reset (R)" ariaLabel="Reset">
            <RotateCcw size={14} />
          </IconButton>
          <IconButton onClick={stepBackward} title="Step backward (←)" ariaLabel="Step back">
            <SkipBack size={14} />
          </IconButton>
          <IconButton
            onClick={togglePlay}
            title={isPlaying ? "Pause (space)" : "Play (space)"}
            ariaLabel={isPlaying ? "Pause" : "Play"}
            primary
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </IconButton>
          <IconButton onClick={stepForward} title="Step forward (→)" ariaLabel="Step forward">
            <SkipForward size={14} />
          </IconButton>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-mid">
            FPS
          </span>
          <div className="flex items-center gap-1">
            {[2, 6, 12, 24].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setFps(v)}
                className={
                  fps === v
                    ? "rounded bg-cyan/10 px-2 py-0.5 font-mono text-[10px] text-cyan"
                    : "rounded px-2 py-0.5 font-mono text-[10px] text-text-mid hover:text-text"
                }
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto">
          <StatusReadout />
        </div>
      </div>

      <Slider.Root
        className="relative flex h-5 w-full items-center"
        value={[index]}
        min={0}
        max={Math.max(0, total - 1)}
        step={1}
        onValueChange={(vals) => setIndex(vals[0] ?? 0)}
      >
        <Slider.Track className="relative h-1 w-full grow overflow-hidden rounded bg-surface-2">
          <Slider.Range className="absolute h-full bg-gradient-to-r from-cyan-dim to-cyan" />
        </Slider.Track>
        <Slider.Thumb
          className="block h-4 w-4 rounded-full border border-cyan bg-bg shadow-glow transition hover:scale-110"
          aria-label="Timeline"
        />
      </Slider.Root>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  ariaLabel,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  ariaLabel: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={
        primary
          ? "flex h-8 w-8 items-center justify-center rounded border border-cyan bg-cyan/10 text-cyan shadow-glow transition hover:bg-cyan/20"
          : "flex h-8 w-8 items-center justify-center rounded border border-border bg-surface text-text-mid transition hover:border-cyan-dim hover:text-text"
      }
    >
      {children}
    </button>
  );
}
