/**
 * Gradient tokens for backgrounds, buttons, and visual effects
 */

export interface GradientTokens {
  primary: string;
  secondary: string;
  subtle: string;
  hero: string;
  accent: string;
}

export const gradientTokens: GradientTokens = {
  primary: "linear-gradient(135deg, hsl(263, 70%, 60%), hsl(280, 100%, 70%))",
  secondary: "linear-gradient(135deg, hsl(240, 100%, 70%), hsl(263, 70%, 60%))",
  subtle: "linear-gradient(180deg, hsl(240, 10%, 3.9%), hsl(240, 10%, 6%))",
  hero: "linear-gradient(135deg, hsl(263, 70%, 60% / 0.8), hsl(280, 100%, 70% / 0.8))",
  accent: "linear-gradient(90deg, hsl(213, 94%, 68%), hsl(263, 70%, 60%))",
};