import { Outlet } from "react-router-dom";
import { GALAXY_BG_URL } from "@/design-system/tokens";

export default function OnboardingLayout() {
  return (
    <div className="relative min-h-screen bg-surface-container-lowest flex items-center justify-center">
      {/* Galaxy background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-surface-container-low via-surface to-surface-container-lowest" />
        <img
          src={GALAXY_BG_URL}
          alt=""
          className="h-full w-full object-cover opacity-30 mix-blend-screen"
        />
      </div>
      <div className="relative z-10 w-full max-w-xl px-6">
        <Outlet />
      </div>
    </div>
  );
}
