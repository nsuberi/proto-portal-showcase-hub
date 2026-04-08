import * as React from "react"
import { cn } from "../lib/utils"

/**
 * "Keep learning" resume card — Codecademy dashboard pattern.
 * Shows current course/path with progress bar and resume CTA.
 *
 * Curriculum: Auto-didactic (self-learning continuity),
 *             Community of Practice (showing progress)
 */

export interface ResumeLearningCardProps extends React.HTMLAttributes<HTMLDivElement> {
  categoryLabel?: string
  title: string
  subtitle?: string
  progress: number
  actions?: {
    viewPath?: () => void
    startPractice?: () => void
    resume?: () => void
  }
  practiceCount?: { completed: number; total: number }
}

const ResumeLearningCard = React.forwardRef<HTMLDivElement, ResumeLearningCardProps>(
  ({ categoryLabel, title, subtitle, progress, actions, practiceCount, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Progress bar at top */}
      <div className="h-1.5 w-full bg-secondary">
        <div
          className="h-full bg-[hsl(var(--progress-barFill,var(--warning,48_100%_52%)))] transition-[width] duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {categoryLabel && (
              <span className="inline-flex items-center font-mono text-[0.6875rem] font-medium tracking-wide uppercase text-primary mb-1">
                {categoryLabel}
              </span>
            )}
            <h3 className="font-bold text-base">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <span className="text-sm font-semibold text-muted-foreground flex-shrink-0">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {actions?.viewPath && (
            <button
              type="button"
              onClick={actions.viewPath}
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              View path
            </button>
          )}
          {actions?.startPractice && practiceCount && (
            <button
              type="button"
              onClick={actions.startPractice}
              className="text-sm font-medium px-3 py-1.5 rounded-md border border-primary text-primary hover:bg-primary/5 transition-colors"
            >
              Start practice session · {practiceCount.completed}/{practiceCount.total}
            </button>
          )}
          {actions?.resume && (
            <button
              type="button"
              onClick={actions.resume}
              className="ml-auto text-sm font-semibold px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Resume
            </button>
          )}
        </div>
      </div>
    </div>
  )
)
ResumeLearningCard.displayName = "ResumeLearningCard"

export { ResumeLearningCard }
