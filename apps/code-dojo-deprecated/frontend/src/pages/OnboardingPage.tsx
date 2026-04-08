import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button,
} from "@proto-portal/ui-components";

interface Step {
  title: string;
  subtitle: string;
  options: { label: string; value: string; description: string }[];
}

const STEPS: Step[] = [
  {
    title: "What do you want to learn?",
    subtitle: "Pick the area that excites you most — you can explore others later.",
    options: [
      {
        label: "Build AI-powered applications",
        value: "build-ai",
        description: "Architecture, Building, AI Design Principles",
      },
      {
        label: "Design and prototype products",
        value: "design",
        description: "Discovery & Design, Go-to-Market",
      },
      {
        label: "Work with data and APIs",
        value: "data",
        description: "Data Modeling, Building",
      },
      {
        label: "Lead and communicate effectively",
        value: "lead",
        description: "Community of Practice, Navigating your Org, Go-to-Market",
      },
      {
        label: "All of the above",
        value: "all",
        description: "Explore the full AI Builder path",
      },
    ],
  },
  {
    title: "How much coding experience do you have?",
    subtitle: "This helps us recommend the right starting point.",
    options: [
      {
        label: "Brand new to coding",
        value: "beginner",
        description: "Start with the basics and build up",
      },
      {
        label: "Some coding experience",
        value: "intermediate",
        description: "You've built a few things but want to level up",
      },
      {
        label: "Professional developer",
        value: "advanced",
        description: "You ship code regularly and want to add AI skills",
      },
    ],
  },
  {
    title: "How much time can you commit per week?",
    subtitle: "Set a realistic goal — consistency beats intensity.",
    options: [
      {
        label: "1–2 hours",
        value: "casual",
        description: "A module every couple weeks",
      },
      {
        label: "3–5 hours",
        value: "regular",
        description: "A module per week",
      },
      {
        label: "5+ hours",
        value: "intensive",
        description: "Multiple modules per week",
      },
    ],
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const step = STEPS[currentStep];

  function selectOption(value: string) {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save preferences and navigate
      localStorage.setItem(
        "codedojo_onboarding",
        JSON.stringify({
          interest: newAnswers[0],
          experience: newAnswers[1],
          commitment: newAnswers[2],
          completedAt: new Date().toISOString(),
        })
      );
      navigate("/path");
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i <= currentStep ? "w-8 bg-primary" : "w-4 bg-muted"
            }`}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{step.title}</CardTitle>
          <CardDescription>{step.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {step.options.map((option) => (
            <button
              key={option.value}
              onClick={() => selectOption(option.value)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-primary hover:bg-primary/5 ${
                answers[currentStep] === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <p className="font-medium text-sm">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </button>
          ))}

          {currentStep > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
