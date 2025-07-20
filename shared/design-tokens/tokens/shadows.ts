/**
 * Shadow tokens for depth and visual hierarchy
 */

export interface ShadowTokens {
  glow: string;
  elegant: string;
  subtle: string;
  medium: string;
  large: string;
  primary: string;
}

export const shadowTokens: ShadowTokens = {
  glow: "0 0 40px hsl(263, 70%, 60% / 0.3)",
  elegant: "0 10px 30px -10px hsl(0, 0%, 0% / 0.5)",
  subtle: "0 1px 3px hsl(0, 0%, 0% / 0.1)",
  medium: "0 4px 12px hsl(0, 0%, 0% / 0.15)",
  large: "0 20px 60px hsl(0, 0%, 0% / 0.25)",
  primary: "0 4px 20px hsl(263, 70%, 60% / 0.3)",
};