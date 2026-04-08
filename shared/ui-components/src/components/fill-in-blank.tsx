import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Fill-in-the-blank code exercise — Codecademy drag-drop pattern.
 * Code block with empty slots, answer chips below to click/drag into slots.
 *
 * Curriculum: Building (understanding code structure, debugging)
 *             Auto-didactic (active recall vs passive reading)
 */

export interface BlankSlot {
  id: string
  answer?: string
}

export interface FillInBlankProps extends React.HTMLAttributes<HTMLDivElement> {
  prompt: string
  /** Code lines — use `null` for blank slots */
  codeTemplate: Array<{ text: string; slotId?: string }>
  slots: BlankSlot[]
  choices: string[]
  onFill: (slotId: string, answer: string) => void
  onClear: (slotId: string) => void
  onCheck?: () => void
  progress?: { current: number; total: number }
}

const FillInBlank = React.forwardRef<HTMLDivElement, FillInBlankProps>(
  ({ prompt, codeTemplate, slots, choices, onFill, onClear, onCheck, progress, className, ...props }, ref) => {
    const [selectedChoice, setSelectedChoice] = React.useState<string | null>(null)
    const filledAnswers = new Set(slots.filter(s => s.answer).map(s => s.answer))

    const handleSlotClick = (slotId: string) => {
      const slot = slots.find(s => s.id === slotId)
      if (slot?.answer) {
        onClear(slotId)
      } else if (selectedChoice) {
        onFill(slotId, selectedChoice)
        setSelectedChoice(null)
      }
    }

    const handleChoiceClick = (choice: string) => {
      if (filledAnswers.has(choice)) return
      // Find first empty slot and fill it
      const emptySlot = slots.find(s => !s.answer)
      if (emptySlot) {
        onFill(emptySlot.id, choice)
      } else {
        setSelectedChoice(choice === selectedChoice ? null : choice)
      }
    }

    return (
      <div ref={ref} className={cn("space-y-6", className)} {...props}>
        {/* Prompt */}
        <p className="text-sm leading-relaxed">{prompt}</p>

        {/* Code block with slots */}
        <div className="rounded-lg bg-[hsl(var(--code-editor-background,230_40%_10%))] p-5 font-mono text-sm leading-relaxed">
          {codeTemplate.map((line, i) => (
            <div key={i} className="text-[hsl(var(--code-editor-foreground,0_0%_92%))]">
              {line.slotId ? (
                <button
                  type="button"
                  onClick={() => handleSlotClick(line.slotId!)}
                  className={cn(
                    "inline-flex items-center min-w-[6rem] h-7 px-2 rounded border-2 border-dashed transition-all",
                    slots.find(s => s.id === line.slotId)?.answer
                      ? "border-info bg-info/20 text-info"
                      : "border-muted-foreground/40 text-muted-foreground hover:border-info/60"
                  )}
                >
                  {slots.find(s => s.id === line.slotId)?.answer || ""}
                </button>
              ) : (
                <span>{line.text}</span>
              )}
            </div>
          ))}
        </div>

        {/* Answer choices */}
        <div className="flex flex-wrap gap-2">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => handleChoiceClick(choice)}
              disabled={filledAnswers.has(choice)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-mono font-medium transition-all",
                filledAnswers.has(choice)
                  ? "bg-muted/30 text-muted-foreground/40 cursor-not-allowed line-through"
                  : selectedChoice === choice
                  ? "bg-info text-info-foreground ring-2 ring-info/50"
                  : "bg-info/80 text-info-foreground hover:bg-info"
              )}
            >
              {choice}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">Click or drag and drop to fill in the blank</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {progress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{progress.current} / {progress.total}</span>
              <div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground/50 rounded-full"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          {onCheck && (
            <button
              type="button"
              onClick={onCheck}
              className="px-4 py-2 text-sm font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors ml-auto"
            >
              Check answer
            </button>
          )}
        </div>
      </div>
    )
  }
)
FillInBlank.displayName = "FillInBlank"

export { FillInBlank }
