import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Circular progress indicator — Codecademy-style yellow ring on dark background.
 * Shows percentage completion with an optional label inside.
 */
export interface ProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  size?: number
  strokeWidth?: number
  label?: React.ReactNode
}

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  ({ value, size = 64, strokeWidth = 4, label, className, ...props }, ref) => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--progress-circleTrack, var(--secondary)))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--progress-circleStroke, var(--warning, 48 100% 52%)))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          {label ?? `${Math.round(value)}%`}
        </div>
      </div>
    )
  }
)
ProgressRing.displayName = "ProgressRing"

export { ProgressRing }
