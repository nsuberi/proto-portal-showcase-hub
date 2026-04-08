import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Syllabus row with type icon + type label + title.
 * Codecademy pattern from "My Learning" syllabus expansion.
 *
 * Curriculum: Building (understanding module structure),
 *             Discovery and Design (spec-driven development)
 */

export type SyllabusItemType = "lesson" | "project" | "quiz" | "informational" | "challenge"

export interface SyllabusItemProps extends React.HTMLAttributes<HTMLDivElement> {
  type: SyllabusItemType
  title: string
  icon?: React.ReactNode
  duration?: string
  completed?: boolean
}

const typeLabels: Record<SyllabusItemType, string> = {
  lesson: "Lesson",
  project: "Project",
  quiz: "Quiz",
  informational: "Informational",
  challenge: "Challenge",
}

const typeColors: Record<SyllabusItemType, string> = {
  lesson: "text-info",
  project: "text-warning",
  quiz: "text-primary",
  informational: "text-muted-foreground",
  challenge: "text-success",
}

const SyllabusItem = React.forwardRef<HTMLDivElement, SyllabusItemProps>(
  ({ type, title, icon, duration, completed, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 py-2.5 px-3 rounded-md transition-colors hover:bg-muted/30",
        completed && "opacity-60",
        className
      )}
      {...props}
    >
      <div className={cn("flex-shrink-0 w-5 h-5", typeColors[type])}>
        {icon ?? <DefaultTypeIcon type={type} />}
      </div>
      <span className="text-sm text-muted-foreground w-28 flex-shrink-0">
        {typeLabels[type]}
      </span>
      <span className={cn("text-sm font-medium flex-1", completed && "line-through")}>
        {title}
      </span>
      {duration && (
        <span className="text-xs text-muted-foreground flex-shrink-0">{duration}</span>
      )}
      {completed && (
        <svg className="w-4 h-4 text-success flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
        </svg>
      )}
    </div>
  )
)
SyllabusItem.displayName = "SyllabusItem"

function DefaultTypeIcon({ type }: { type: SyllabusItemType }) {
  switch (type) {
    case "lesson":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
      )
    case "project":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>
      )
    case "quiz":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      )
    case "informational":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
      )
    case "challenge":
      return (
        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
      )
  }
}

export { SyllabusItem }
