/**
 * FFX Skill Map Local Design System
 * 
 * This module:
 * 1. Loads the shared design system foundation
 * 2. Applies FFX-specific overrides 
 * 3. Republishes the tokens for local consumption
 * 4. Generates CSS custom properties for the overridden theme
 */

import { 
  createDesignTokens, 
  presetOverrides, 
  createCSSVariables,
  type DesignTokens 
} from "@proto-portal/design-tokens";

/**
 * FFX-specific design token overrides
 * This defines the light theme for the FFX prototype
 */
const ffxOverrides = presetOverrides.ffxSkillMap;

/**
 * Create the final design tokens for FFX with overrides applied
 */
export const ffxDesignTokens: DesignTokens = createDesignTokens(ffxOverrides);

/**
 * Export individual token categories for easy access
 */
export const ffxColors = ffxDesignTokens.colors;
export const ffxGradients = ffxDesignTokens.gradients;
export const ffxShadows = ffxDesignTokens.shadows;
export const ffxSpacing = ffxDesignTokens.spacing;
export const ffxTransitions = ffxDesignTokens.transitions;
export const ffxTypography = ffxDesignTokens.typography;
export const ffxChartColors = ffxDesignTokens.chartColors;
export const ffxSkillCategories = ffxDesignTokens.skillCategories;

/**
 * Generate CSS custom properties string for the FFX theme
 * This can be used to inject theme variables into CSS
 */
export const ffxCSSVariables = createCSSVariables(ffxDesignTokens);

/**
 * Chart colors as an array for easy consumption by chart libraries
 */
export const CHART_COLORS = ffxChartColors.primary;

/**
 * Skill category colors optimized for light theme with better contrast
 */
export const SKILL_CATEGORY_COLORS: Record<string, string> = {
  combat: ffxSkillCategories.combat.solid,
  magic: ffxSkillCategories.magic.solid,
  support: ffxSkillCategories.support.solid,
  special: ffxSkillCategories.special.solid,
  advanced: ffxSkillCategories.advanced.solid,
  default: ffxSkillCategories.default.solid,
};

/**
 * Helper function to get HSL values for CSS custom properties
 * Converts from "hsl(x, y%, z%)" format to "x y% z%" format for CSS variables
 */
export function extractHSLValues(hslString: string): string {
  const match = hslString.match(/hsl\(([^)]+)\)/);
  if (match) {
    return match[1];
  }
  // If already in space-separated format, return as-is
  return hslString;
}

/**
 * Generate CSS custom properties with proper HSL format for Tailwind
 */
export function generateFFXCSSProperties(): Record<string, string> {
  return {
    // Core colors
    '--background': extractHSLValues(ffxColors.background),
    '--foreground': extractHSLValues(ffxColors.foreground),
    '--card': extractHSLValues(ffxColors.card),
    '--card-foreground': extractHSLValues(ffxColors.cardForeground),
    '--popover': extractHSLValues(ffxColors.popover),
    '--popover-foreground': extractHSLValues(ffxColors.popoverForeground),
    '--primary': extractHSLValues(ffxColors.primary),
    '--primary-foreground': extractHSLValues(ffxColors.primaryForeground),
    '--secondary': extractHSLValues(ffxColors.secondary),
    '--secondary-foreground': extractHSLValues(ffxColors.secondaryForeground),
    '--muted': extractHSLValues(ffxColors.muted),
    '--muted-foreground': extractHSLValues(ffxColors.mutedForeground),
    '--accent': extractHSLValues(ffxColors.accent),
    '--accent-foreground': extractHSLValues(ffxColors.accentForeground),
    '--border': extractHSLValues(ffxColors.border),
    '--input': extractHSLValues(ffxColors.input),
    '--ring': extractHSLValues(ffxColors.ring),
    
    // Extended semantic colors
    '--success': extractHSLValues(ffxColors.success),
    '--success-foreground': extractHSLValues(ffxColors.successForeground),
    '--warning': extractHSLValues(ffxColors.warning),
    '--warning-foreground': extractHSLValues(ffxColors.warningForeground),
    '--info': extractHSLValues(ffxColors.info),
    '--info-foreground': extractHSLValues(ffxColors.infoForeground),
    
    // Gradients
    '--gradient-primary': ffxGradients.primary,
    '--gradient-secondary': ffxGradients.secondary,
    '--gradient-subtle': ffxGradients.subtle,
    '--gradient-hero': ffxGradients.hero,
    '--gradient-accent': ffxGradients.accent,
    
    // Shadows
    '--shadow-glow': ffxShadows.glow,
    '--shadow-elegant': ffxShadows.elegant,
    '--shadow-subtle': ffxShadows.subtle,
    '--shadow-medium': ffxShadows.medium,
    '--shadow-large': ffxShadows.large,
    '--shadow-primary': ffxShadows.primary,
    
    // Transitions
    '--transition-smooth': ffxTransitions.smooth,
    '--transition-fast': ffxTransitions.fast,
    '--transition-slow': ffxTransitions.slow,
    '--transition-bounce': ffxTransitions.bounce,
    '--transition-elastic': ffxTransitions.elastic,
    
    // Skill category colors
    '--skill-combat-bg': extractHSLValues(ffxSkillCategories.combat.bg),
    '--skill-combat-border': extractHSLValues(ffxSkillCategories.combat.border),
    '--skill-combat-text': extractHSLValues(ffxSkillCategories.combat.text),
    '--skill-combat-solid': extractHSLValues(ffxSkillCategories.combat.solid),
    
    '--skill-magic-bg': extractHSLValues(ffxSkillCategories.magic.bg),
    '--skill-magic-border': extractHSLValues(ffxSkillCategories.magic.border),
    '--skill-magic-text': extractHSLValues(ffxSkillCategories.magic.text),
    '--skill-magic-solid': extractHSLValues(ffxSkillCategories.magic.solid),
    
    '--skill-support-bg': extractHSLValues(ffxSkillCategories.support.bg),
    '--skill-support-border': extractHSLValues(ffxSkillCategories.support.border),
    '--skill-support-text': extractHSLValues(ffxSkillCategories.support.text),
    '--skill-support-solid': extractHSLValues(ffxSkillCategories.support.solid),
    
    '--skill-special-bg': extractHSLValues(ffxSkillCategories.special.bg),
    '--skill-special-border': extractHSLValues(ffxSkillCategories.special.border),
    '--skill-special-text': extractHSLValues(ffxSkillCategories.special.text),
    '--skill-special-solid': extractHSLValues(ffxSkillCategories.special.solid),
    
    '--skill-advanced-bg': extractHSLValues(ffxSkillCategories.advanced.bg),
    '--skill-advanced-border': extractHSLValues(ffxSkillCategories.advanced.border),
    '--skill-advanced-text': extractHSLValues(ffxSkillCategories.advanced.text),
    '--skill-advanced-solid': extractHSLValues(ffxSkillCategories.advanced.solid),
    
    '--skill-default-bg': extractHSLValues(ffxSkillCategories.default.bg),
    '--skill-default-border': extractHSLValues(ffxSkillCategories.default.border),
    '--skill-default-text': extractHSLValues(ffxSkillCategories.default.text),
    '--skill-default-solid': extractHSLValues(ffxSkillCategories.default.solid),
  };
}

/**
 * Export the complete FFX design system for external consumption
 */
export default {
  tokens: ffxDesignTokens,
  colors: ffxColors,
  gradients: ffxGradients,
  shadows: ffxShadows,
  spacing: ffxSpacing,
  transitions: ffxTransitions,
  typography: ffxTypography,
  chartColors: ffxChartColors,
  skillCategories: ffxSkillCategories,
  cssProperties: generateFFXCSSProperties(),
  constants: {
    CHART_COLORS,
    SKILL_CATEGORY_COLORS,
  },
};