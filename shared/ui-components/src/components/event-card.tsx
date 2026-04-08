import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Community event card — Codecademy events grid pattern.
 * Shows event title, date/time, description, and attendee count.
 *
 * Curriculum: Community of Practice (community sessions, presenting),
 *             Navigating your Organization (finding partners, socializing)
 */

export interface EventCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  date: string
  time: string
  duration?: string
  description: string
  attendees?: number
  tags?: string[]
  onRegister?: () => void
}

const EventCard = React.forwardRef<HTMLDivElement, EventCardProps>(
  ({ title, date, time, duration, description, attendees, tags, onRegister, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow",
        className
      )}
      {...props}
    >
      <div>
        <h3 className="font-bold text-base leading-snug">{title}</h3>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span>{date}</span>
          <span>·</span>
          <span>{time}</span>
          {duration && (
            <>
              <span>·</span>
              <span>{duration}</span>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
        {description}
      </p>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.6875rem] px-2 py-0.5 rounded-full border border-border text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2">
        {attendees !== undefined && (
          <span className="text-xs text-muted-foreground">
            {attendees} attending
          </span>
        )}
        {onRegister && (
          <button
            type="button"
            onClick={onRegister}
            className="text-sm font-medium text-primary hover:underline underline-offset-4 ml-auto"
          >
            Register
          </button>
        )}
      </div>
    </div>
  )
)
EventCard.displayName = "EventCard"

export { EventCard }
