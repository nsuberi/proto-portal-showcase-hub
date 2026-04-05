import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Weekly learning target selector — Codecademy habit-forming pattern.
 * Select days-per-week goal, track streak with visual indicators.
 *
 * Curriculum: Auto-didactic (self-learning habits, responding to feedback)
 *             Community of Practice (showing commitment)
 */

export interface WeeklyTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  target: number
  completed: number
  daysOfWeek?: string[]
  completedDays?: boolean[]
  onTargetChange?: (target: number) => void
  editable?: boolean
}

const DEFAULT_DAYS = ["M", "T", "W", "T", "F", "S", "S"]

const WeeklyTarget = React.forwardRef<HTMLDivElement, WeeklyTargetProps>(
  ({
    target, completed, daysOfWeek = DEFAULT_DAYS,
    completedDays = [], onTargetChange, editable = false,
    className, ...props
  }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card p-4", className)} {...props}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Weekly target</h3>
        {editable && (
          <button type="button" className="text-xs text-primary hover:underline">Edit</button>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-3">
        {daysOfWeek.map((day, i) => {
          const isCompleted = completedDays[i] ?? false
          const isInTarget = i < target

          return (
            <button
              key={i}
              type="button"
              onClick={() => editable && onTargetChange?.(i + 1)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                isCompleted
                  ? "bg-warning text-warning-foreground"
                  : isInTarget
                  ? "bg-muted text-muted-foreground border-2 border-dashed border-warning/40"
                  : "bg-muted/50 text-muted-foreground/50",
                editable && "cursor-pointer hover:ring-2 hover:ring-warning/30"
              )}
              title={`${day} — ${isCompleted ? "completed" : isInTarget ? "target" : "no target"}`}
            >
              {isCompleted ? "✓" : day}
            </button>
          )
        })}
      </div>

      <p className="text-center text-sm font-semibold">
        <span className="text-lg">{completed}</span>
        <span className="text-muted-foreground"> of {target} days</span>
      </p>
    </div>
  )
)
WeeklyTarget.displayName = "WeeklyTarget"

export { WeeklyTarget }
