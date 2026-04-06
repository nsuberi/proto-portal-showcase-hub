import { Outlet } from "react-router-dom";

export default function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-deep-space flex items-center justify-center">
      <div className="w-full max-w-xl px-6">
        <Outlet />
      </div>
    </div>
  );
}
