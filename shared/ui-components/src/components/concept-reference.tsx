import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Concept reference table — Codecademy subskill knowledge base.
 * Two-column: concept name | explanation with inline code blocks.
 * "Evaluate" CTA + custom project generation link.
 *
 * Curriculum: Building (accessing knowledge for debugging)
 *             Data Modeling (schemas, understanding structure)
 */

export interface Concept {
  id: string
  name: string
  explanation: React.ReactNode
  tested?: boolean
}

export interface ConceptReferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  concepts: Concept[]
  onEvaluate?: () => void
  onGenerateProject?: () => void
}

const ConceptReference = React.forwardRef<HTMLDivElement, ConceptReferenceProps>(
  ({ title, concepts, onEvaluate, onGenerateProject, className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="flex items-center gap-3">
          {concepts.some(c => c.tested === false) && (
            <span className="text-xs text-muted-foreground">Not tested yet</span>
          )}
          {onEvaluate && (
            <button
              type="button"
              onClick={onEvaluate}
              className="px-4 py-1.5 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Evaluate
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-border rounded-lg border overflow-hidden">
        {concepts.map((concept) => (
          <div key={concept.id} className="grid grid-cols-[12rem_1fr] gap-4 p-4">
            <div>
              <p className="text-sm font-semibold">{concept.name}</p>
              {concept.tested === false && (
                <span className="text-xs text-muted-foreground italic">Not tested</span>
              )}
            </div>
            <div className="text-sm leading-relaxed text-muted-foreground [&_code]:font-mono [&_code]:text-xs [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-muted [&_code]:text-foreground">
              {concept.explanation}
            </div>
          </div>
        ))}
      </div>

      {onGenerateProject && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Custom projects</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Apply this subskill in a custom project.</p>
            </div>
            <button
              type="button"
              onClick={onGenerateProject}
              className="text-sm font-medium text-primary hover:underline"
            >
              + Generate project
            </button>
          </div>
        </div>
      )}
    </div>
  )
)
ConceptReference.displayName = "ConceptReference"

export { ConceptReference }
