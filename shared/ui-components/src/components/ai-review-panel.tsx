import * as React from "react"
import { Check, AlertTriangle } from "lucide-react"
import { cn } from "../lib/utils"

/**
 * AI code review panel — Codecademy structured review output.
 * Formatted review with sections and bullet feedback (not a chat).
 *
 * Curriculum: Building (AI evaluation tools, automated testing,
 *             communicating what's been tested)
 *             AI Design Principles (visibility, levers of control)
 */

export interface ReviewFeedbackItem {
  type: "pass" | "warning" | "suggestion"
  text: string
}

export interface ReviewSection {
  title: string
  description?: string
  items: ReviewFeedbackItem[]
}

export interface AIReviewPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  attribution?: string
  sections: ReviewSection[]
}

const AIReviewPanel = React.forwardRef<HTMLDivElement, AIReviewPanelProps>(
  ({
    title = "Let's review your project work",
    subtitle = "This AI-generated code review offers specific feedback about your code. You can also ask yourself these same questions when reviewing your code on your own.",
    attribution = "Powered by AI",
    sections,
    className,
    ...props
  }, ref) => (
    <div ref={ref} className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        {attribution && (
          <span className="inline-flex items-center gap-1 mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
            {attribution}
          </span>
        )}
      </div>

      {/* Sections */}
      {sections.map((section, si) => (
        <div key={si} className="space-y-3">
          <div>
            <h3 className="text-base font-bold">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-muted-foreground mt-0.5 italic">{section.description}</p>
            )}
          </div>

          <ul className="space-y-2">
            {section.items.map((item, ii) => (
              <li key={ii} className="flex items-start gap-2.5 text-sm leading-relaxed">
                {item.type === "pass" && (
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-success" />
                )}
                {item.type === "warning" && (
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-warning" />
                )}
                {item.type === "suggestion" && (
                  <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-info text-center leading-none">•</span>
                )}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
)
AIReviewPanel.displayName = "AIReviewPanel"

export { AIReviewPanel }
