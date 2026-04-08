import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Study plan CTA banner — Codecademy "Make a study plan" pattern.
 * Simple card with title, description, and outline CTA.
 *
 * Curriculum: Auto-didactic (self-directed learning plans)
 *             Discovery and Design (shaping problems, creating briefs)
 */

export interface StudyPlanBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  ctaLabel?: string
  onAction: () => void
}

const StudyPlanBanner = React.forwardRef<HTMLDivElement, StudyPlanBannerProps>(
  ({
    title = "Make a study plan",
    description = "Set your schedule and get focused recommendations for your next tasks, each time you log in.",
    ctaLabel = "Make a study plan",
    onAction,
    className,
    ...props
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card p-4 flex items-center justify-between gap-4",
        className
      )}
      {...props}
    >
      <div>
        <h4 className="text-sm font-bold">{title}</h4>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-muted transition-colors"
      >
        {ctaLabel}
      </button>
    </div>
  )
)
StudyPlanBanner.displayName = "StudyPlanBanner"

export { StudyPlanBanner }
