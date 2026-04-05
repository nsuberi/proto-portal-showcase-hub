import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Full-width bordered answer option card — Codecademy quiz interface.
 */
export interface QuizOptionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state?: "default" | "selected" | "correct" | "incorrect"
}

const QuizOption = React.forwardRef<HTMLButtonElement, QuizOptionProps>(
  ({ state = "default", className, children, ...props }, ref) => {
    const stateClasses = {
      default: "border-[hsl(var(--quiz-optionBorder,200_60%_45%))] hover:border-[hsl(var(--quiz-optionHoverBorder,200_60%_55%))] hover:bg-[hsl(var(--quiz-optionBorder,200_60%_45%)/0.1)]",
      selected: "border-[hsl(var(--quiz-optionSelectedBorder,var(--primary)))] bg-[hsl(var(--quiz-optionSelectedBorder,var(--primary))/0.15)]",
      correct: "border-[hsl(var(--quiz-optionCorrectBorder,var(--success)))] bg-[hsl(var(--quiz-optionCorrectBorder,var(--success))/0.15)]",
      incorrect: "border-[hsl(var(--quiz-optionIncorrectBorder,var(--destructive)))] bg-[hsl(var(--quiz-optionIncorrectBorder,var(--destructive))/0.15)]",
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "block w-full px-5 py-4 border rounded-lg bg-card text-left text-[0.9375rem] cursor-pointer transition-all",
          stateClasses[state],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
QuizOption.displayName = "QuizOption"

export { QuizOption }
