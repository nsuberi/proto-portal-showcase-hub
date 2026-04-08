import { lazy } from "react";
import type { ComponentType } from "react";

const LoanClassifierApp = lazy(() => import("./LoanClassifierApp"));
const RateDashboardApp = lazy(() => import("./RateDashboardApp"));
const MeetingSummarizerApp = lazy(() => import("./MeetingSummarizerApp"));
const OnboardingWizardApp = lazy(() => import("./OnboardingWizardApp"));

export const artifactComponents: Record<string, ComponentType> = {
  "loan-classifier": LoanClassifierApp,
  "rate-dashboard": RateDashboardApp,
  "meeting-summarizer": MeetingSummarizerApp,
  "onboarding-wizard": OnboardingWizardApp,
};
