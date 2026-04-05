import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../lib/utils"

/**
 * Radio card selection for onboarding quizzes and self-assessment.
 * Codecademy pattern: numbered step indicator + radio cards with title + description.
 *
 * Curriculum: Community of Practice (scaffolding levels),
 *             Auto-didactic (self-assessment)
 */

export interface RadioOption {
  id: string
  title: string
  description?: string
}

export interface OnboardingRadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  question: string
  subtitle?: string
  options: RadioOption[]
  value?: string
  onValueChange?: (value: string) => void
  step?: { current: number; total: number }
}

const OnboardingRadioGroup = React.forwardRef<HTMLDivElement, OnboardingRadioGroupProps>(
  ({ question, subtitle, options, value, onValueChange, step, className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col items-center max-w-2xl mx-auto", className)} {...props}>
      {step && (
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: step.total }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                i < step.current
                  ? "bg-success border-success text-success-foreground"
                  : i === step.current
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {i < step.current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
          ))}
        </div>
      )}

      <h2 className="text-2xl font-bold text-center mb-2">{question}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground text-center mb-6">{subtitle}</p>
      )}

      <div className="flex flex-col gap-3 w-full">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onValueChange?.(option.id)}
            className={cn(
              "flex items-start gap-3 w-full px-5 py-4 rounded-lg border-2 text-left transition-all",
              value === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-colors",
                value === option.id
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              )}
            >
              {value === option.id && (
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">{option.title}</p>
              {option.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
)
OnboardingRadioGroup.displayName = "OnboardingRadioGroup"

export { OnboardingRadioGroup }
