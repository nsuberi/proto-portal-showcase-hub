import { cn } from "@/lib/utils";

interface GoalEvolutionProps {
  goals: Array<{ date: string; text: string }>;
  className?: string;
}

export function GoalEvolution({ goals, className }: GoalEvolutionProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface-container-low px-6 py-5",
        className,
      )}
    >
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[4px] top-1 bottom-1 w-[1.5px] bg-outline-variant/30" />

        {/* Goals list — spacing instead of dividers */}
        <div className="flex flex-col gap-6">
          {goals.map((goal, index) => {
            const isCurrent = index === goals.length - 1;

            return (
              <div key={index} className="relative flex items-start gap-3 pl-0">
                {/* Timeline dot */}
                <span
                  className={cn(
                    "relative z-10 mt-1 inline-block h-[10px] w-[10px] shrink-0 rounded-full",
                    isCurrent
                      ? "bg-tertiary"
                      : "bg-surface-container-highest",
                  )}
                />

                {/* Content */}
                <div className="flex flex-col gap-0.5">
                  <span className="font-label text-[10px] text-on-primary-container">
                    {goal.date}
                  </span>
                  <span
                    className={cn(
                      "font-body text-[13px] leading-snug",
                      isCurrent
                        ? "font-semibold text-on-surface"
                        : "font-normal text-on-surface-variant line-through decoration-outline-variant",
                    )}
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
