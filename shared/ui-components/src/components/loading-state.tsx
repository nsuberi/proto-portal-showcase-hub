import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Loading/generating state — Codecademy code review generation pattern.
 * Animated indicator with message and optional time estimate.
 *
 * Curriculum: AI Design Principles (latency and cost tradeoffs, visibility)
 *             Building (AI evaluation tools)
 */

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  estimate?: string
  icon?: React.ReactNode
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({
    message = "Generating...",
    estimate,
    icon,
    className,
    ...props
  }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col items-center justify-center py-12 gap-4", className)}
      {...props}
    >
      {icon ?? (
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-t-warning animate-spin" />
        </div>
      )}
      <p className="text-sm font-semibold">{message}</p>
      {estimate && (
        <p className="text-xs text-muted-foreground">{estimate}</p>
      )}
    </div>
  )
)
LoadingState.displayName = "LoadingState"

export { LoadingState }
