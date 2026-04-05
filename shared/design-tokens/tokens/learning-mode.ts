/**
 * Learning mode tokens for two-mode UI systems
 * Provides dark "focus mode" surface colors for learning environments
 * (code editors, quizzes, project work) vs the default browse/dashboard mode
 *
 * Inspired by Codecademy's two-tone system: warm cream for browsing,
 * deep navy for focused learning.
 *
 * Usage: Apply the `.learning-mode` CSS class to containers that should
 * switch to the learning palette. All semantic color variables swap automatically.
 */

export interface LearningModeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  popover: string;
  popoverForeground: string;
  input: string;
  ring: string;
}

export const learningModeTokens: LearningModeTokens = {
  background: "230 40% 10%",
  foreground: "0 0% 92%",
  card: "230 35% 16%",
  cardForeground: "0 0% 92%",
  border: "230 25% 22%",
  muted: "230 30% 20%",
  mutedForeground: "220 15% 65%",
  accent: "48 100% 52%",
  accentForeground: "230 40% 10%",
  popover: "230 35% 14%",
  popoverForeground: "0 0% 92%",
  input: "230 30% 20%",
  ring: "48 100% 52%",
};
