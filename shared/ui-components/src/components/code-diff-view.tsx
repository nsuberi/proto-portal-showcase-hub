import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Side-by-side code comparison — Codecademy "View solution" pattern.
 * Shows "My code" vs "Example solution" with action buttons.
 *
 * Curriculum: Building (debugging, understanding when AI builds slop)
 *             AI Design Principles (human in the loop)
 */

export interface CodeDiffViewProps extends React.HTMLAttributes<HTMLDivElement> {
  leftTitle?: string
  rightTitle?: string
  leftCode: string
  rightCode: string
  onKeepMine?: () => void
  onReplace?: () => void
}

const CodeDiffView = React.forwardRef<HTMLDivElement, CodeDiffViewProps>(
  ({
    leftTitle = "My code",
    rightTitle = "Example solution",
    leftCode,
    rightCode,
    onKeepMine,
    onReplace,
    className,
    ...props
  }, ref) => (
    <div ref={ref} className={cn("flex flex-col rounded-lg border bg-card overflow-hidden", className)} {...props}>
      <div className="grid grid-cols-2 divide-x divide-border">
        <div className="p-3 border-b border-border">
          <span className="text-sm font-semibold">{leftTitle}</span>
        </div>
        <div className="p-3 border-b border-border">
          <span className="text-sm font-semibold">{rightTitle}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border flex-1 min-h-0">
        <pre className="p-4 text-sm font-mono overflow-auto bg-[hsl(var(--code-editor-background,230_40%_10%))] text-[hsl(var(--code-editor-foreground,0_0%_92%))] leading-relaxed whitespace-pre-wrap">
          {leftCode}
        </pre>
        <pre className="p-4 text-sm font-mono overflow-auto bg-[hsl(var(--code-editor-background,230_40%_10%))] text-[hsl(var(--code-editor-foreground,0_0%_92%))] leading-relaxed whitespace-pre-wrap">
          {rightCode}
        </pre>
      </div>

      {(onKeepMine || onReplace) && (
        <div className="flex items-center justify-center gap-3 p-3 border-t border-border">
          {onKeepMine && (
            <button
              type="button"
              onClick={onKeepMine}
              className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              Keep my code
            </button>
          )}
          {onReplace && (
            <button
              type="button"
              onClick={onReplace}
              className="px-4 py-2 text-sm font-medium rounded-md bg-success text-success-foreground hover:bg-success/90 transition-colors"
            >
              Replace with solution
            </button>
          )}
        </div>
      )}
    </div>
  )
)
CodeDiffView.displayName = "CodeDiffView"

export { CodeDiffView }
