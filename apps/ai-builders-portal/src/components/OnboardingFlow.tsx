import { useState } from "react";
import { cn } from "@/lib/utils";

interface OnboardingFlowProps {
  onComplete?: (answers: Record<number, string>) => void;
  className?: string;
}

interface Step {
  question: string;
  type: "textarea" | "options";
  options?: string[];
  followUp: string;
}

const steps: Step[] = [
  {
    question: "What's your current role?",
    type: "textarea",
    followUp:
      "This helps us tailor challenges to problems you actually face, so your portfolio reflects real-world context.",
  },
  {
    question: "Have you built anything with code before?",
    type: "options",
    options: [
      "No, I'm brand new",
      "I've done a tutorial or two",
      "I've built small projects",
    ],
    followUp:
      "There are no wrong answers. We'll calibrate your starting phase so you're challenged but never overwhelmed.",
  },
  {
    question:
      "What's a problem in your work or life that you wish you could solve?",
    type: "textarea",
    followUp:
      "We'll use this to seed your first challenge. You'll start building something meaningful from day one.",
  },
];

export function OnboardingFlow({ onComplete, className }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const canProceed = Boolean(answers[stepIndex]?.trim());

  function handleOptionSelect(option: string) {
    setAnswers((prev) => ({ ...prev, [stepIndex]: option }));
  }

  function handleTextChange(value: string) {
    setAnswers((prev) => ({ ...prev, [stepIndex]: value }));
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  }

  function handleContinue() {
    if (!canProceed) return;
    if (isLastStep) {
      onComplete?.(answers);
    } else {
      setStepIndex((prev) => prev + 1);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl ring-1 ring-white/5",
        className,
      )}
    >
      {/* Header with step indicators */}
      <div className="flex items-center justify-center gap-2 bg-primary-container px-6 py-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === stepIndex
                ? "w-6 bg-primary"
                : i < stepIndex
                  ? "w-2 bg-tertiary"
                  : "w-2 bg-on-surface/20",
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="bg-surface-container p-6">
        {/* Step count */}
        <p className="mb-1 font-label text-[11px] font-semibold uppercase tracking-wider text-on-primary-container">
          Step {stepIndex + 1} of {steps.length}
        </p>

        {/* Question */}
        <h2 className="mb-5 font-headline text-lg font-semibold text-on-surface">
          {currentStep.question}
        </h2>

        {/* Input area */}
        {currentStep.type === "textarea" && (
          <textarea
            className={cn(
              "w-full resize-none rounded-lg bg-surface-container-lowest px-3 py-2.5",
              "border border-outline-variant/15",
              "font-body text-sm text-on-surface placeholder:text-on-primary-container",
              "focus:border-tertiary/50 focus:outline-none focus:ring-1 focus:ring-tertiary/30",
            )}
            rows={3}
            placeholder="Type your answer..."
            value={answers[stepIndex] ?? ""}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        )}

        {currentStep.type === "options" && currentStep.options && (
          <div className="flex flex-col gap-2">
            {currentStep.options.map((option) => {
              const isSelected = answers[stepIndex] === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "rounded-lg px-4 py-3 text-left font-label text-sm transition-colors",
                    isSelected
                      ? "bg-primary-container font-medium text-primary ring-1 ring-primary/30"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high",
                  )}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* AI follow-up callout */}
        <div className="mt-4 rounded-lg border-l-[3px] border-primary bg-primary/5 py-3 pl-4 pr-3">
          <p className="font-body text-[13px] italic leading-relaxed text-on-surface-variant">
            {currentStep.followUp}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            className={cn(
              "rounded-lg px-4 py-2 font-label text-sm font-medium text-on-primary-container transition-colors hover:text-on-surface",
              stepIndex === 0 && "invisible",
            )}
            onClick={handleBack}
          >
            Back
          </button>

          <button
            type="button"
            className={cn(
              "rounded-lg px-5 py-2 font-label text-sm font-semibold transition-all active:scale-95",
              canProceed
                ? "bg-gradient-to-br from-primary to-on-primary-container text-on-primary-fixed hover:brightness-110"
                : "cursor-not-allowed bg-surface-container-highest text-on-primary-container",
            )}
            disabled={!canProceed}
            onClick={handleContinue}
          >
            {isLastStep ? "Complete profile" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

OnboardingFlow.displayName = "OnboardingFlow";
