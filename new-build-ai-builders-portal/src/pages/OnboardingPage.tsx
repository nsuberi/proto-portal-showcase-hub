import { useNavigate } from "react-router-dom";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function OnboardingPage() {
  const navigate = useNavigate();

  function handleComplete(answers: Record<number, string>) {
    localStorage.setItem("aibuilders_onboarding", JSON.stringify(answers));
    navigate("/profile");
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col items-center">
      {/* Text logo */}
      <p className="mb-6 font-headline text-sm font-bold tracking-wide text-on-surface">
        AI Builders
      </p>

      {/* Onboarding flow */}
      <OnboardingFlow onComplete={handleComplete} className="w-full" />

      {/* Skip link */}
      <button
        type="button"
        className="mt-6 font-label text-xs text-on-primary-container underline-offset-2 transition-colors hover:underline hover:text-on-surface"
        onClick={() => navigate("/")}
      >
        Skip for now
      </button>
    </div>
  );
}
