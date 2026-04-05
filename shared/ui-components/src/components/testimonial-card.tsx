import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Review/testimonial card — Codecademy course reviews pattern.
 * Large quotation mark, quote text, reviewer name + role + location.
 *
 * Curriculum: Go-to-market (recording compelling descriptions),
 *             Community of Practice (social proof)
 */

export interface TestimonialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  quote: string
  name: string
  role?: string
  location?: string
  avatar?: React.ReactNode
}

const TestimonialCard = React.forwardRef<HTMLDivElement, TestimonialCardProps>(
  ({ quote, name, role, location, avatar, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card p-5 flex flex-col", className)}
      {...props}
    >
      <span className="text-4xl font-serif leading-none text-warning mb-2" aria-hidden="true">
        &ldquo;
      </span>
      <blockquote className="text-sm leading-relaxed flex-1 mb-4">
        {quote}
      </blockquote>
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        {avatar && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted overflow-hidden">
            {avatar}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">{name}</p>
          {(role || location) && (
            <p className="text-xs text-muted-foreground">
              {[role, location].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
)
TestimonialCard.displayName = "TestimonialCard"

export { TestimonialCard }
