import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Feature discovery card — Codecademy "Discover more features" grid.
 * Icon + title + description with optional action link.
 *
 * Curriculum: Navigating your Organization (finding complementary work),
 *             Go-to-market (socializing capabilities)
 */

export interface FeatureDiscoveryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

const FeatureDiscoveryCard = React.forwardRef<HTMLDivElement, FeatureDiscoveryCardProps>(
  ({ icon, title, description, action, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow",
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-[0.8125rem] text-muted-foreground mt-0.5 line-clamp-2">
          {description}
        </p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="text-xs font-medium text-primary hover:underline mt-1.5 inline-block"
          >
            {action.label} →
          </button>
        )}
      </div>
    </div>
  )
)
FeatureDiscoveryCard.displayName = "FeatureDiscoveryCard"

export { FeatureDiscoveryCard }
