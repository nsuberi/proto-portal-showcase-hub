import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Template/technology selection card — Codecademy workspace selector.
 * Grouped selection grid for choosing a language, technology, or template.
 *
 * Curriculum: Building (choosing tools and technologies),
 *             Architecture (infrastructure selection)
 */

export interface TemplateOption {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface TemplateCardGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  title?: string
  options: TemplateOption[]
  value?: string
  onSelect?: (id: string) => void
  columns?: 3 | 4
}

const TemplateCardGroup = React.forwardRef<HTMLDivElement, TemplateCardGroupProps>(
  ({ title, options, value, onSelect, columns = 4, className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-3", className)} {...props}>
      {title && (
        <h3 className="text-sm font-semibold">{title}</h3>
      )}
      <div
        className={cn(
          "grid gap-3",
          columns === 3 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        )}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect?.(option.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all text-sm font-medium",
              value === option.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            {option.icon && (
              <span className="flex-shrink-0 w-5 h-5">{option.icon}</span>
            )}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
)
TemplateCardGroup.displayName = "TemplateCardGroup"

export { TemplateCardGroup }
