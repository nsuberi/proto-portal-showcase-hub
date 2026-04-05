import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import BrowseLayout from "@/layouts/BrowseLayout";
import LearningLayout from "@/layouts/LearningLayout";
import HomePage from "@/pages/HomePage";
import ModuleDetailPage from "@/pages/ModuleDetailPage";
import GoalPage from "@/pages/GoalPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import AccountPage from "@/pages/AccountPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Browse mode — cream surfaces */}
      <Route element={<BrowseLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/modules/:moduleId" element={<ModuleDetailPage />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Auth pages — cream, no sidebar */}
      <Route element={<BrowseLayout showSidebar={false} />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Learning mode — dark navy */}
      <Route element={<LearningLayout />}>
        <Route
          path="/modules/:moduleId/goals/:goalId"
          element={
            <ProtectedRoute>
              <GoalPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
