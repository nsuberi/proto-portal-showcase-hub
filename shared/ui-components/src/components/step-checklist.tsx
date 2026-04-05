import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../lib/utils"

/**
 * Numbered instruction steps with checkboxes — Codecademy instruction panel pattern.
 */

export interface StepChecklistItem {
  id: string
  title: string
  description?: string
  completed?: boolean
}

export interface StepChecklistProps extends React.HTMLAttributes<HTMLOListElement> {
  items: StepChecklistItem[]
  onToggle?: (id: string) => void
}

const StepChecklist = React.forwardRef<HTMLOListElement, StepChecklistProps>(
  ({ items, onToggle, className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn("flex flex-col gap-1 list-none p-0 m-0", className)}
      {...props}
    >
      {items.map((item, index) => (
        <StepChecklistItemComponent
          key={item.id}
          item={item}
          index={index + 1}
          onToggle={onToggle}
        />
      ))}
    </ol>
  )
)
StepChecklist.displayName = "StepChecklist"

function StepChecklistItemComponent({
  item,
  index,
  onToggle,
}: {
  item: StepChecklistItem
  index: number
  onToggle?: (id: string) => void
}) {
  return (
    <li
      className={cn(
        "flex gap-3 px-4 py-3 rounded-md transition-colors items-start",
        "hover:bg-muted/50",
        item.completed && "opacity-70"
      )}
    >
      <button
        type="button"
        onClick={() => onToggle?.(item.id)}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all",
          item.completed
            ? "bg-success border-success text-success-foreground"
            : "border-border hover:border-primary"
        )}
        aria-label={item.completed ? `Mark step ${index} incomplete` : `Mark step ${index} complete`}
      >
        {item.completed && <Check className="h-3 w-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium leading-snug",
          item.completed && "line-through"
        )}>
          <span className="text-muted-foreground mr-1.5">{index}.</span>
          {item.title}
        </p>
        {item.description && (
          <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
            {item.description}
          </p>
        )}
      </div>
    </li>
  )
}

export { StepChecklist }
