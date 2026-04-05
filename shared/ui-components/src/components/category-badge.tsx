import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Codecademy-style monospace category label.
 * Used to label content types: "Course", "Subskill", "Free course", "Project", etc.
 */
export interface CategoryBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "highlight" | "subtle"
}

const CategoryBadge = React.forwardRef<HTMLSpanElement, CategoryBadgeProps>(
  ({ variant = "default", className, ...props }, ref) => {
    const variantClasses = {
      default: "bg-muted text-muted-foreground border-border",
      highlight: "bg-primary/10 text-primary border-primary/20",
      subtle: "bg-transparent text-muted-foreground border-transparent",
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-mono text-[0.6875rem] font-medium tracking-wide uppercase rounded px-2 py-0.5 border",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
CategoryBadge.displayName = "CategoryBadge"

export { CategoryBadge }
