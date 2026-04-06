import { tokens } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface GoalEvolutionProps {
  goals: Array<{ date: string; text: string }>;
  className?: string;
}

export function GoalEvolution({ goals, className }: GoalEvolutionProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border-warm bg-shelter-white px-6 py-5",
        className,
      )}
    >
      <div className="relative">
        {/* Vertical timeline line */}
        <div
          className="absolute left-[4px] top-1 bottom-1"
          style={{
            width: "1.5px",
            backgroundColor: tokens.color.borderWarm,
          }}
        />

        {/* Goals list */}
        <div className="flex flex-col gap-4">
          {goals.map((goal, index) => {
            const isCurrent = index === goals.length - 1;

            return (
              <div key={index} className="relative flex items-start gap-3 pl-0">
                {/* Timeline dot */}
                <span
                  className="relative z-10 mt-1 inline-block h-[10px] w-[10px] shrink-0 rounded-full"
                  style={{
                    backgroundColor: isCurrent
                      ? tokens.color.atmosphereTeal
                      : tokens.color.sediment,
                  }}
                />

                {/* Content */}
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] text-dust">
                    {goal.date}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] leading-snug",
                      isCurrent
                        ? "font-semibold text-deep-space"
                        : "font-normal text-dust",
                    )}
                    style={
                      !isCurrent
                        ? {
                            textDecoration: "line-through",
                            textDecorationColor: tokens.color.borderWarm,
                          }
                        : undefined
                    }
                  >
                    {goal.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

GoalEvolution.displayName = "GoalEvolution";
