/**
 * Proto Portal Design Tokens
 * Centralized design token system with override capabilities
 */

// Export all token types and values
export * from "./tokens/colors.js";
export * from "./tokens/gradients.js";
export * from "./tokens/shadows.js";
export * from "./tokens/spacing.js";
export * from "./tokens/transitions.js";
export * from "./tokens/typography.js";
export * from "./tokens/responsive.js";
export * from "./tokens/components/chart-colors.js";
export * from "./tokens/components/skill-categories.js";

// Export Tailwind configuration
export * from "./tailwind/base-config.js";

import { ColorTokens, baseColorTokens, darkColorTokens } from "./tokens/colors.js";
import { GradientTokens, gradientTokens } from "./tokens/gradients.js";
import { ShadowTokens, shadowTokens } from "./tokens/shadows.js";
import { SpacingTokens, spacingTokens } from "./tokens/spacing.js";
import { TransitionTokens, transitionTokens } from "./tokens/transitions.js";
import { TypographyTokens, typographyTokens } from "./tokens/typography.js";
import { ResponsiveTokens, responsiveTokens } from "./tokens/responsive.js";
import { ChartColorTokens, chartColorTokens } from "./tokens/components/chart-colors.js";
import { SkillCategoryTokens, skillCategoryTokens } from "./tokens/components/skill-categories.js";

/**
 * Complete design token interface
 */
export interface DesignTokens {
  colors: ColorTokens;
  darkColors: Partial<ColorTokens>;
  gradients: GradientTokens;
  shadows: ShadowTokens;
  spacing: SpacingTokens;
  transitions: TransitionTokens;
  typography: TypographyTokens;
  responsive: ResponsiveTokens;
  chartColors: ChartColorTokens;
  skillCategories: SkillCategoryTokens;
}

/**
 * Override interface for customizing design tokens
 */
export interface DesignTokenOverrides {
  colors?: Partial<ColorTokens>;
  darkColors?: Partial<ColorTokens>;
  gradients?: Partial<GradientTokens>;
  shadows?: Partial<ShadowTokens>;
  spacing?: Partial<SpacingTokens>;
  transitions?: Partial<TransitionTokens>;
  typography?: Partial<TypographyTokens>;
  responsive?: Partial<ResponsiveTokens>;
  chartColors?: Partial<ChartColorTokens>;
  skillCategories?: Partial<SkillCategoryTokens>;
}

/**
 * Base design tokens without any overrides
 */
export const baseDesignTokens: DesignTokens = {
  colors: baseColorTokens,
  darkColors: darkColorTokens,
  gradients: gradientTokens,
  shadows: shadowTokens,
  spacing: spacingTokens,
  transitions: transitionTokens,
  typography: typographyTokens,
  responsive: responsiveTokens,
  chartColors: chartColorTokens,
  skillCategories: skillCategoryTokens,
};

/**
 * Deep merge utility for combining token objects
 */
function mergeDeep(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Create design tokens with optional overrides
 * This is the main function for customizing the design system
 * 
 * @param overrides - Partial overrides for any token category
 * @returns Complete design token object with overrides applied
 */
export function createDesignTokens(overrides?: DesignTokenOverrides): DesignTokens {
  if (!overrides) {
    return baseDesignTokens;
  }

  return mergeDeep(baseDesignTokens, overrides);
}

/**
 * Create CSS custom properties string from design tokens
 * Useful for generating CSS variables programmatically
 */
export function createCSSVariables(tokens: DesignTokens): string {
  const cssVars: string[] = [];
  
  // Add color variables
  Object.entries(tokens.colors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVars.push(`--${key}: ${value};`);
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        cssVars.push(`--${key}-${subKey}: ${subValue};`);
      });
    }
  });

  // Add other token categories
  Object.entries(tokens.gradients).forEach(([key, value]) => {
    cssVars.push(`--gradient-${key}: ${value};`);
  });

  Object.entries(tokens.shadows).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });

  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars.push(`--spacing-${key}: ${value};`);
  });

  Object.entries(tokens.transitions).forEach(([key, value]) => {
    cssVars.push(`--transition-${key}: ${value};`);
  });

  return cssVars.join('\n  ');
}

/**
 * Preset overrides for common use cases
 */
export const presetOverrides = {
  /**
   * FFX Skill Map light theme overrides
   */
  ffxSkillMap: {
    colors: {
      // Light theme colors for FFX
      background: "0 0% 98%",           // Very light gray
      foreground: "240 10% 10%",        // Dark gray text
      card: "0 0% 100%",                // Pure white cards
      cardForeground: "240 10% 10%",    // Dark text on cards
      popover: "0 0% 100%",             // White popovers
      popoverForeground: "240 10% 10%", // Dark text on popovers
      
      // Keep primary purple but lighter
      primary: "263 70% 55%",           // Slightly lighter purple
      primaryForeground: "0 0% 98%",    // White text on primary
      
      // Light theme secondary
      secondary: "240 5% 94%",          // Very light gray
      secondaryForeground: "240 10% 10%", // Dark text on secondary
      
      // Light theme muted
      muted: "240 5% 96%",              // Ultra light gray
      mutedForeground: "240 4% 46%",    // Medium gray text
      
      // Light theme accent
      accent: "240 5% 96%",             // Ultra light gray
      accentForeground: "240 10% 10%",  // Dark text on accent
      
      // Borders and inputs for light theme
      border: "240 6% 90%",             // Light gray borders
      input: "240 6% 90%",              // Light gray input backgrounds
      ring: "263 70% 55%",              // Purple focus rings
    },
    chartColors: {
      primary: [
        "hsl(213, 94%, 58%)",      // Deeper blue for magic
        "hsl(142, 76%, 36%)",      // Green for support  
        "hsl(0, 84%, 50%)",        // Red for combat
        "hsl(263, 70%, 55%)",      // Purple for special
        "hsl(48, 96%, 43%)",       // Darker yellow for advanced
      ],
    },
    gradients: {
      primary: "linear-gradient(135deg, hsl(263, 70%, 55%), hsl(280, 100%, 65%))",
      secondary: "linear-gradient(135deg, hsl(240, 100%, 65%), hsl(263, 70%, 55%))",
      subtle: "linear-gradient(180deg, hsl(0, 0%, 98%), hsl(240, 5%, 96%))",
      hero: "linear-gradient(135deg, hsl(263, 70%, 55% / 0.1), hsl(280, 100%, 65% / 0.1))",
    },
    shadows: {
      glow: "0 0 40px hsl(263, 70%, 55% / 0.2)",
      elegant: "0 10px 30px -10px hsl(0, 0%, 0% / 0.1)",
      primary: "0 4px 20px hsl(263, 70%, 55% / 0.2)",
    },
  } as DesignTokenOverrides,

  /**
   * High contrast theme for accessibility (WCAG AAA targets)
   * Dark background with high-contrast foreground colors
   */
  highContrast: {
    colors: {
      background: "0 0% 0%",
      foreground: "0 0% 100%",
      card: "0 0% 5%",
      cardForeground: "0 0% 100%",
      popover: "0 0% 5%",
      popoverForeground: "0 0% 100%",
      primary: "220 100% 60%",
      primaryForeground: "0 0% 0%",
      secondary: "0 0% 20%",
      secondaryForeground: "0 0% 100%",
      muted: "0 0% 15%",
      mutedForeground: "0 0% 75%",
      accent: "50 100% 50%",
      accentForeground: "0 0% 0%",
      destructive: "0 100% 55%",
      destructiveForeground: "0 0% 100%",
      border: "0 0% 30%",
      input: "0 0% 20%",
      ring: "220 100% 60%",
      success: "120 100% 40%",
      successForeground: "0 0% 0%",
      warning: "50 100% 50%",
      warningForeground: "0 0% 0%",
      info: "200 100% 60%",
      infoForeground: "0 0% 0%",
    },
    shadows: {
      glow: "0 0 40px hsl(220, 100%, 60% / 0.4)",
      primary: "0 4px 20px hsl(220, 100%, 60% / 0.4)",
    },
  } as DesignTokenOverrides,

  /**
   * Vibrant theme with saturated colors and bold gradients
   */
  vibrant: {
    colors: {
      primary: "280 100% 65%",
      primaryForeground: "0 0% 100%",
      accent: "170 100% 45%",
      accentForeground: "0 0% 0%",
      success: "150 100% 45%",
      warning: "40 100% 55%",
      info: "190 100% 55%",
      destructive: "350 100% 55%",
      ring: "280 100% 65%",
    },
    gradients: {
      primary: "linear-gradient(135deg, hsl(280, 100%, 65%), hsl(190, 100%, 55%))",
      secondary: "linear-gradient(135deg, hsl(40, 100%, 55%), hsl(350, 100%, 55%))",
      subtle: "linear-gradient(180deg, hsl(240, 10%, 3.9%), hsl(280, 30%, 8%))",
      hero: "linear-gradient(135deg, hsl(280, 100%, 65% / 0.8), hsl(190, 100%, 55% / 0.8))",
      accent: "linear-gradient(90deg, hsl(150, 100%, 45%), hsl(280, 100%, 65%))",
    },
    shadows: {
      glow: "0 0 40px hsl(280, 100%, 65% / 0.4)",
      primary: "0 4px 20px hsl(280, 100%, 65% / 0.4)",
      elegant: "0 10px 30px -10px hsl(280, 50%, 20% / 0.5)",
    },
  } as DesignTokenOverrides,
};