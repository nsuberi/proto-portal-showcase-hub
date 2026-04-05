import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"

/**
 * "Stuck? Get a Hint" expandable section — Codecademy pattern.
 * Collapsible content block with a trigger that expands on click.
 */
export interface CollapsibleHintProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  defaultOpen?: boolean
}

const CollapsibleHint = React.forwardRef<HTMLDivElement, CollapsibleHintProps>(
  ({ label = "Stuck? Get a Hint", defaultOpen = false, children, className, ...props }, ref) => {
    const [open, setOpen] = React.useState(defaultOpen)

    return (
      <div ref={ref} className={cn("rounded-md overflow-hidden", className)} {...props}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={cn(
            "flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-left transition-colors",
            "bg-muted/50 hover:bg-muted/70 text-warning",
            open && "border-b border-border"
          )}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 flex-shrink-0 transition-transform duration-200",
              open && "rotate-90"
            )}
          />
          {label}
        </button>
        {open && (
          <div className="px-4 py-3 text-sm leading-relaxed animate-fade-in">
            {children}
          </div>
        )}
      </div>
    )
  }
)
CollapsibleHint.displayName = "CollapsibleHint"

export { CollapsibleHint }
