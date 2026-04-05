import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Interactive star rating — Codecademy course feedback pattern.
 * 1-5 star selector with hover preview.
 *
 * Curriculum: Auto-didactic (responding to feedback)
 *             Go-to-market (course ratings, social proof)
 */

export interface StarRatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: "sm" | "md" | "lg"
  readonly?: boolean
}

const sizeMap = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-10 h-10" }

const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  ({ value, onChange, max = 5, size = "md", readonly = false, className, ...props }, ref) => {
    const [hovered, setHovered] = React.useState<number | null>(null)
    const display = hovered ?? value

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-1", className)}
        onMouseLeave={() => setHovered(null)}
        role="radiogroup"
        aria-label="Rating"
        {...props}
      >
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1
          const filled = starValue <= display

          return (
            <button
              key={i}
              type="button"
              disabled={readonly}
              onClick={() => onChange?.(starValue)}
              onMouseEnter={() => !readonly && setHovered(starValue)}
              className={cn(
                "transition-colors",
                sizeMap[size],
                readonly ? "cursor-default" : "cursor-pointer",
                filled ? "text-warning" : "text-muted-foreground/30"
              )}
              role="radio"
              aria-checked={starValue === value}
              aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          )
        })}
        {!readonly && (
          <span className="ml-2 text-sm text-muted-foreground tabular-nums">
            {display > 0 ? display : ""}
          </span>
        )}
      </div>
    )
  }
)
StarRating.displayName = "StarRating"

export { StarRating }
