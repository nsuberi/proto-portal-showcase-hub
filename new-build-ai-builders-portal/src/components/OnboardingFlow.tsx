import { useState } from "react";
import { tokens } from "@/design-system/tokens";
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
      "What's a problem you see in your work that you wish you could solve?",
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
        "overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10",
        className,
      )}
    >
      {/* Header with step indicators */}
      <div className="flex items-center justify-center gap-2 bg-orbital-blue px-6 py-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === stepIndex
                ? "w-6 bg-instrument-blue"
                : i < stepIndex
                  ? "w-2 bg-atmosphere-teal"
                  : "w-2",
            )}
            style={
              i > stepIndex
                ? { backgroundColor: tokens.color.shelterWhite + "33" }
                : undefined
            }
          />
        ))}
      </div>

      {/* Step content */}
      <div className="bg-shelter-white p-6">
        {/* Step count */}
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-dust">
          Step {stepIndex + 1} of {steps.length}
        </p>

        {/* Question */}
        <h2 className="mb-5 text-lg font-semibold text-deep-space">
          {currentStep.question}
        </h2>

        {/* Input area */}
        {currentStep.type === "textarea" && (
          <textarea
            className={cn(
              "w-full resize-none rounded-md border border-border-warm bg-regolith px-3 py-2.5",
              "text-sm text-dark-text placeholder:text-dust",
              "focus:border-instrument-blue focus:outline-none focus:ring-1 focus:ring-instrument-blue",
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
                    "rounded-md border px-4 py-3 text-left text-sm transition-colors",
                    isSelected
                      ? "border-instrument-blue bg-instrument-blue/5 font-medium text-instrument-blue"
                      : "border-border-warm bg-regolith text-dark-text hover:border-dust",
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
        <div
          className="mt-4 rounded-md py-3 pl-4 pr-3"
          style={{
            borderLeft: `3px solid ${tokens.color.instrumentBlue}`,
            backgroundColor: tokens.color.instrumentBlue + "0A",
          }}
        >
          <p className="text-[13px] italic leading-relaxed text-dust">
            {currentStep.followUp}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium text-dust transition-colors hover:text-dark-text",
              stepIndex === 0 && "invisible",
            )}
            onClick={handleBack}
          >
            Back
          </button>

          <button
            type="button"
            className={cn(
              "rounded-md px-5 py-2 text-sm font-semibold text-shelter-white transition-colors",
              canProceed
                ? "bg-instrument-blue hover:bg-orbital-blue"
                : "cursor-not-allowed bg-sediment text-dust",
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
