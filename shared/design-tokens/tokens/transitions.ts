/**
 * Transition and animation tokens for smooth interactions
 */

export interface TransitionTokens {
  smooth: string;
  fast: string;
  slow: string;
  bounce: string;
  elastic: string;
}

export const transitionTokens: TransitionTokens = {
  smooth: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  fast: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  elastic: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
};