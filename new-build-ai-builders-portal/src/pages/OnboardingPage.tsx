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
      <p className="mb-6 text-sm font-semibold tracking-wide text-shelter-white">
        AI Builders
      </p>

      {/* Onboarding flow */}
      <OnboardingFlow onComplete={handleComplete} className="w-full" />

      {/* Skip link */}
      <button
        type="button"
        className="mt-6 text-xs text-dust underline-offset-2 transition-colors hover:underline hover:text-shelter-white"
        onClick={() => navigate("/")}
      >
        Skip for now
      </button>
    </div>
  );
}
