import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Multi-segment progress bar — Codecademy-style nav progress.
 * Shows completion per section with color-coded segments.
 */

export interface ProgressSegment {
  id: string
  state: "pending" | "active" | "complete"
  label?: string
}

export interface ProgressSegmentsProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: ProgressSegment[]
}

const ProgressSegments = React.forwardRef<HTMLDivElement, ProgressSegmentsProps>(
  ({ segments, className, ...props }, ref) => {
    const stateColors = {
      pending: "bg-[hsl(var(--progress-segmentPending,var(--muted)))]",
      active: "bg-[hsl(var(--progress-segmentActive,var(--warning,48_100%_52%)))]",
      complete: "bg-[hsl(var(--progress-segmentComplete,var(--success)))]",
    }

    return (
      <div
        ref={ref}
        className={cn("flex gap-0.5 h-1 w-full", className)}
        role="progressbar"
        aria-valuenow={segments.filter(s => s.state === "complete").length}
        aria-valuemax={segments.length}
        {...props}
      >
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={cn(
              "flex-1 rounded-full transition-colors duration-200",
              stateColors[segment.state]
            )}
            title={segment.label}
          />
        ))}
      </div>
    )
  }
)
ProgressSegments.displayName = "ProgressSegments"

export { ProgressSegments }
