import { Routes, Route } from "react-router-dom";
import PortalLayout from "@/layouts/PortalLayout";
import OnboardingLayout from "@/layouts/OnboardingLayout";
import LandingPage from "@/pages/LandingPage";
import OnboardingPage from "@/pages/OnboardingPage";
import ChallengesPage from "@/pages/ChallengesPage";
import ChallengeDetailPage from "@/pages/ChallengeDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import PortfolioPage from "@/pages/PortfolioPage";
import ShowcasePage from "@/pages/ShowcasePage";
import CommunityPage from "@/pages/CommunityPage";
import NotFoundPage from "@/pages/NotFoundPage";
import StarChartPage from "@/pages/StarChartPage";
import ArtifactPage from "@/pages/ArtifactPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/community" element={<CommunityPage />} />
      </Route>
      <Route element={<OnboardingLayout />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>
      <Route path="/artifacts/:id" element={<ArtifactPage />} />
      <Route path="/portfolio/:userId" element={<PortfolioPage />} />
      <Route path="/screens/star-chart" element={<StarChartPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
