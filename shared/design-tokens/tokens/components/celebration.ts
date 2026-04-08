/**
 * Celebration and completion tokens
 * Used for course/module completion screens, XP rewards, achievements
 */

export interface CelebrationTokens {
  background: string;
  foreground: string;
  trophy: string;
  confettiPrimary: string;
  confettiSecondary: string;
  confettiTertiary: string;
  ctaBackground: string;
  ctaForeground: string;
  checkmark: string;
}

export const celebrationTokens: CelebrationTokens = {
  background: "230 40% 10%",
  foreground: "0 0% 92%",
  trophy: "48 100% 52%",
  confettiPrimary: "263 70% 60%",
  confettiSecondary: "48 100% 52%",
  confettiTertiary: "142 76% 36%",
  ctaBackground: "48 100% 52%",
  ctaForeground: "230 40% 10%",
  checkmark: "142 76% 36%",
};
