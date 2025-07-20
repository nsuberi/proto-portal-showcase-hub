/**
 * Spacing tokens for consistent layout and component spacing
 */

export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  "4xl": string;
  section: string;
  container: string;
  component: string;
  element: string;
}

export const spacingTokens: SpacingTokens = {
  xs: "0.25rem",    // 4px
  sm: "0.5rem",     // 8px
  md: "1rem",       // 16px
  lg: "1.5rem",     // 24px
  xl: "2rem",       // 32px
  "2xl": "3rem",    // 48px
  "3xl": "4rem",    // 64px
  "4xl": "6rem",    // 96px
  section: "5rem",  // 80px - for section spacing (py-20)
  container: "2rem", // 32px - for container padding
  component: "1.5rem", // 24px - for component internal spacing
  element: "0.75rem",  // 12px - for small element spacing
};