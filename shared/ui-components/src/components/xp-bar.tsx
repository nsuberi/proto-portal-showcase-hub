import * as React from "react"
import { cn } from "../lib/utils"

/**
 * XP progress bar with before/after display — Codecademy XP system.
 */
export interface XPBarProps extends React.HTMLAttributes<HTMLDivElement> {
  skillName: string
  skillIcon?: React.ReactNode
  currentXP: number
  maxXP: number
  gainedXP?: number
}

const XPBar = React.forwardRef<HTMLDivElement, XPBarProps>(
  ({ skillName, skillIcon, currentXP, maxXP, gainedXP, className, ...props }, ref) => {
    const percentage = Math.min((currentXP / maxXP) * 100, 100)

    return (
      <div ref={ref} className={cn("flex items-center gap-3", className)} {...props}>
        {skillIcon && (
          <div className="flex-shrink-0 w-5 h-5 text-muted-foreground">
            {skillIcon}
          </div>
        )}
        <span className="text-sm font-medium min-w-[6rem] truncate">
          {skillName}
        </span>
        <div className="flex-1 h-2 rounded-full bg-[hsl(var(--progress-barTrack,var(--secondary)))] overflow-hidden">
          <div
            className="h-full rounded-full bg-[hsl(var(--progress-barFill,var(--warning,48_100%_52%)))] transition-[width] duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-[hsl(var(--progress-xpText,var(--foreground)))] whitespace-nowrap">
          {gainedXP !== undefined ? (
            <>
              {currentXP - gainedXP} XP
              <span className="mx-1 text-muted-foreground">&rarr;</span>
              <span className="text-[hsl(var(--progress-xpGain,var(--success)))]">
                {currentXP} XP
              </span>
            </>
          ) : (
            `${currentXP} XP`
          )}
        </span>
      </div>
    )
  }
)
XPBar.displayName = "XPBar"

export { XPBar }
