import * as React from "react"
import { cn } from "../lib/utils"
import { ProgressRing } from "./progress-ring"

/**
 * Quiz summary with score ring + answer review — Codecademy post-quiz pattern.
 *
 * Curriculum: Auto-didactic (responding to feedback)
 *             Building (AI evaluation tools)
 */

export interface QuizAnswer {
  id: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

export interface QuizSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  score: number
  correct: number
  incorrect: number
  answers: QuizAnswer[]
  onPractice?: () => void
  onRetake?: () => void
  onContinue?: () => void
  selectedQuestion?: string
  onSelectQuestion?: (id: string) => void
}

const QuizSummary = React.forwardRef<HTMLDivElement, QuizSummaryProps>(
  ({
    title, score, correct, incorrect, answers,
    onPractice, onRetake, onContinue,
    selectedQuestion, onSelectQuestion,
    className, ...props
  }, ref) => {
    const activeQ = selectedQuestion
      ? answers.find(a => a.id === selectedQuestion)
      : answers[0]

    return (
      <div ref={ref} className={cn("space-y-8", className)} {...props}>
        {/* Header with score */}
        <div className="text-center space-y-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quiz summary</p>
            <h2 className="text-2xl font-bold mt-1">{title}</h2>
          </div>

          <div className="flex items-center justify-center gap-6">
            <ProgressRing value={score} size={96} strokeWidth={6} />
            <div className="text-left space-y-1">
              <p className="text-sm text-muted-foreground">
                Great job! — Your highest score: {score}%
              </p>
              <div className="flex items-center gap-4 text-sm font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-success inline-flex items-center justify-center text-[0.625rem] text-success-foreground">✓</span>
                  {correct} correct
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-destructive inline-flex items-center justify-center text-[0.625rem] text-destructive-foreground">✕</span>
                  {incorrect} incorrect
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            {onPractice && (
              <button type="button" onClick={onPractice}
                className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
                Practice concepts
              </button>
            )}
            {onRetake && (
              <button type="button" onClick={onRetake}
                className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors">
                Retake quiz
              </button>
            )}
            {onContinue && (
              <button type="button" onClick={onContinue}
                className="px-4 py-2 text-sm font-semibold rounded-md bg-warning text-warning-foreground hover:bg-warning/90 transition-colors">
                Continue learning
              </button>
            )}
          </div>
        </div>

        {/* Question list + answer review */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
          <div>
            <h3 className="text-sm font-bold mb-3">Quiz questions</h3>
            <ol className="space-y-1 border-l-2 border-border pl-4">
              {answers.map((answer, i) => (
                <li key={answer.id}>
                  <button
                    type="button"
                    onClick={() => onSelectQuestion?.(answer.id)}
                    className={cn(
                      "flex items-start gap-2 w-full text-left py-1.5 text-sm transition-colors rounded px-2 -ml-2",
                      activeQ?.id === answer.id ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[0.625rem] mt-0.5",
                      answer.isCorrect
                        ? "bg-success text-success-foreground"
                        : "bg-destructive text-destructive-foreground"
                    )}>
                      {answer.isCorrect ? "✓" : "✕"}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground mr-1">{i + 1}.</span>
                    <span className="line-clamp-2">{answer.question}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {activeQ && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold">Review your answers</h3>
              <p className="text-sm font-medium">
                <span className="font-mono text-muted-foreground mr-2">
                  {answers.indexOf(activeQ) + 1}.
                </span>
                {activeQ.question}
              </p>

              <div className={cn(
                "rounded-lg p-4 border-l-4",
                activeQ.isCorrect ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
              )}>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Your answer</p>
                <p className={cn("text-sm", activeQ.isCorrect ? "text-success" : "text-destructive")}>
                  {activeQ.userAnswer}
                </p>
              </div>

              {!activeQ.isCorrect && (
                <div className="rounded-lg p-4 border-l-4 border-success bg-success/5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Correct answer</p>
                  <p className="text-sm text-success">{activeQ.correctAnswer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)
QuizSummary.displayName = "QuizSummary"

export { QuizSummary }
