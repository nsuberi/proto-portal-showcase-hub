import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Quiz with inline feedback — Codecademy immediate-explanation pattern.
 * After answering, correct option highlights green with explanation text.
 *
 * Curriculum: Auto-didactic (immediate feedback, responding to feedback)
 *             AI Design Principles (visibility, reducing cognitive load)
 */

export interface InlineFeedbackOption {
  id: string
  label: string
}

export interface InlineFeedbackQuizProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  question: string
  options: InlineFeedbackOption[]
  correctId: string
  explanation?: string
  selectedId?: string
  onSelect: (id: string) => void
}

const InlineFeedbackQuiz = React.forwardRef<HTMLDivElement, InlineFeedbackQuizProps>(
  ({ question, options, correctId, explanation, selectedId, onSelect, className, ...props }, ref) => {
    const answered = selectedId !== undefined

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <p className="text-sm font-medium leading-relaxed">{question}</p>

        <div className="flex flex-col gap-2">
          {options.map((option) => {
            const isSelected = option.id === selectedId
            const isCorrect = option.id === correctId
            const showCorrect = answered && isCorrect
            const showIncorrect = answered && isSelected && !isCorrect

            return (
              <div key={option.id}>
                <button
                  type="button"
                  onClick={() => !answered && onSelect(option.id)}
                  disabled={answered}
                  className={cn(
                    "w-full px-5 py-4 rounded-lg border text-left text-[0.9375rem] transition-all",
                    !answered && "cursor-pointer hover:border-[hsl(var(--quiz-optionHoverBorder,200_60%_55%))] hover:bg-[hsl(200_60%_45%/0.1)]",
                    !answered && "border-[hsl(var(--quiz-optionBorder,200_60%_45%))] bg-card",
                    showCorrect && "border-success bg-success/15",
                    showIncorrect && "border-destructive bg-destructive/10",
                    answered && !isSelected && !isCorrect && "border-border/50 opacity-50",
                  )}
                >
                  {option.label}
                </button>

                {/* Inline explanation after correct answer */}
                {showCorrect && explanation && (
                  <div className="flex items-start gap-2 mt-2 px-2 text-sm text-success">
                    <span className="text-base leading-none">👏</span>
                    <span>{explanation}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
InlineFeedbackQuiz.displayName = "InlineFeedbackQuiz"

export { InlineFeedbackQuiz }
