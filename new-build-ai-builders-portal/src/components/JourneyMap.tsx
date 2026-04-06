import { cn } from "@/lib/utils";

interface JourneyMapProps {
  phases: Array<{ title: string; insight: string; complete: boolean }>;
  className?: string;
}

export function JourneyMap({ phases, className }: JourneyMapProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface-container-low p-6",
        className,
      )}
    >
      {/* Segmented progress bar */}
      <div className="mb-5 flex gap-1">
        {phases.map((phase, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              phase.complete ? "bg-tertiary shadow-glow-tertiary" : "bg-surface-container-highest",
            )}
          />
        ))}
      </div>

      {/* Phases list — spacing instead of dividers */}
      <div className="flex flex-col gap-6">
        {phases.map((phase, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3",
              !phase.complete && "opacity-50",
            )}
          >
            {/* Circle with number or checkmark */}
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-label text-[12px] font-semibold",
                phase.complete
                  ? "bg-tertiary text-on-tertiary"
                  : "bg-surface-container-highest text-on-primary-container",
              )}
            >
              {phase.complete ? (
                <span className="material-symbols-outlined text-[16px]">check</span>
              ) : (
                index + 1
              )}
            </div>

            {/* Text content */}
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span className="font-headline text-[13px] font-semibold text-on-surface">
                {phase.title}
              </span>
              <span className="font-body text-[11px] italic leading-relaxed text-on-surface-variant">
                {phase.insight}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

JourneyMap.displayName = "JourneyMap";
