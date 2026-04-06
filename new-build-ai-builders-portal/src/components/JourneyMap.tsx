import { tokens } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface JourneyMapProps {
  phases: Array<{ title: string; insight: string; complete: boolean }>;
  className?: string;
}

export function JourneyMap({ phases, className }: JourneyMapProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border-warm bg-shelter-white p-6",
        className,
      )}
    >
      {/* Segmented progress bar */}
      <div className="mb-5 flex gap-0.5">
        {phases.map((phase, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              phase.complete ? "bg-atmosphere-teal" : "bg-sediment",
            )}
          />
        ))}
      </div>

      {/* Phases list */}
      <div className="flex flex-col gap-4">
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
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{
                backgroundColor: phase.complete
                  ? tokens.color.atmosphereTeal
                  : tokens.color.sediment,
                color: phase.complete
                  ? tokens.color.shelterWhite
                  : tokens.color.dust,
              }}
            >
              {phase.complete ? "✓" : index + 1}
            </div>

            {/* Text content */}
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-[13px] font-semibold text-dark-text">
                {phase.title}
              </span>
              <span className="text-[11px] leading-relaxed text-dust">
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
