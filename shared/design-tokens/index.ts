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
export * from "./tokens/learning-mode.js";
export * from "./tokens/components/chart-colors.js";
export * from "./tokens/components/skill-categories.js";
export * from "./tokens/components/progress.js";
export * from "./tokens/components/code-editor.js";
export * from "./tokens/components/quiz.js";
export * from "./tokens/components/celebration.js";

// Export Tailwind configuration
export * from "./tailwind/base-config.js";

import { ColorTokens, baseColorTokens, darkColorTokens } from "./tokens/colors.js";
import { GradientTokens, gradientTokens } from "./tokens/gradients.js";
import { ShadowTokens, shadowTokens } from "./tokens/shadows.js";
import { SpacingTokens, spacingTokens } from "./tokens/spacing.js";
import { TransitionTokens, transitionTokens } from "./tokens/transitions.js";
import { TypographyTokens, typographyTokens } from "./tokens/typography.js";
import { ResponsiveTokens, responsiveTokens } from "./tokens/responsive.js";
import { LearningModeTokens, learningModeTokens } from "./tokens/learning-mode.js";
import { ChartColorTokens, chartColorTokens } from "./tokens/components/chart-colors.js";
import { SkillCategoryTokens, skillCategoryTokens } from "./tokens/components/skill-categories.js";
import { ProgressTokens, progressTokens } from "./tokens/components/progress.js";
import { CodeEditorTokens, codeEditorTokens } from "./tokens/components/code-editor.js";
import { QuizTokens, quizTokens } from "./tokens/components/quiz.js";
import { CelebrationTokens, celebrationTokens } from "./tokens/components/celebration.js";

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
  learningMode: LearningModeTokens;
  chartColors: ChartColorTokens;
  skillCategories: SkillCategoryTokens;
  progress: ProgressTokens;
  codeEditor: CodeEditorTokens;
  quiz: QuizTokens;
  celebration: CelebrationTokens;
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
  learningMode?: Partial<LearningModeTokens>;
  chartColors?: Partial<ChartColorTokens>;
  skillCategories?: Partial<SkillCategoryTokens>;
  progress?: Partial<ProgressTokens>;
  codeEditor?: Partial<CodeEditorTokens>;
  quiz?: Partial<QuizTokens>;
  celebration?: Partial<CelebrationTokens>;
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
  learningMode: learningModeTokens,
  chartColors: chartColorTokens,
  skillCategories: skillCategoryTokens,
  progress: progressTokens,
  codeEditor: codeEditorTokens,
  quiz: quizTokens,
  celebration: celebrationTokens,
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

  // Learning mode variables
  Object.entries(tokens.learningMode).forEach(([key, value]) => {
    cssVars.push(`--learning-${key}: ${value};`);
  });

  // Component tokens: progress
  Object.entries(tokens.progress).forEach(([key, value]) => {
    cssVars.push(`--progress-${key}: ${value};`);
  });

  // Component tokens: code editor
  Object.entries(tokens.codeEditor).forEach(([key, value]) => {
    cssVars.push(`--code-editor-${key}: ${value};`);
  });

  // Component tokens: quiz
  Object.entries(tokens.quiz).forEach(([key, value]) => {
    cssVars.push(`--quiz-${key}: ${value};`);
  });

  // Component tokens: celebration
  Object.entries(tokens.celebration).forEach(([key, value]) => {
    cssVars.push(`--celebration-${key}: ${value};`);
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
   * Code Dojo learning platform — Codecademy design system (Nov 2025 spec)
   * Source: 405 screenshots from Codecademy web, extracted 2026-04-05
   *
   * Two-mode system:
   *   Browse: warm cream (30° hue) surfaces with white cards — approachable, marketing-friendly
   *   Learn: deep navy (222° hue) surfaces — focused, serious coding environment
   *
   * Purple (252 100% 44%) = primary interactive (links, focus, submit buttons)
   * Yellow (48 100% 50%) = accent CTA (start, progress, streaks, XP)
   */
  codeDojo: {
    colors: {
      // Browse mode — warm cream surfaces
      background: "30 60% 95%",             // #FBF3EA — cream page bg
      foreground: "0 0% 7%",               // #111111 — near-black headings
      card: "0 0% 100%",                   // #FFFFFF — white card surfaces
      cardForeground: "0 0% 20%",          // #333333 — body text on cards
      popover: "0 0% 100%",               // white modals/dropdowns
      popoverForeground: "0 0% 20%",       // body text on popovers
      primary: "252 100% 44%",             // #5533CC — deep indigo-violet
      primaryForeground: "0 0% 100%",      // white on purple
      secondary: "30 20% 92%",             // muted warm surface
      secondaryForeground: "0 0% 7%",      // dark text
      muted: "30 20% 92%",                 // #F0ECE7 — input/disabled areas
      mutedForeground: "0 0% 45%",         // #737373 — metadata, timestamps
      accent: "48 100% 50%",               // #FFD300 — signature Codecademy yellow
      accentForeground: "0 0% 7%",         // dark text on yellow
      destructive: "0 75% 55%",            // #D94444 — error/incorrect
      destructiveForeground: "0 0% 100%",  // white on red
      border: "30 15% 85%",               // warm light border
      input: "30 20% 92%",                 // muted bg for form inputs
      ring: "252 100% 44%",               // purple focus ring
      radius: "0.5rem",                   // 8px — primary radius
      success: "145 60% 42%",              // #2B9B4E — correct/complete
      successForeground: "0 0% 100%",
      warning: "38 95% 55%",               // #F0A830 — caution/stuck
      warningForeground: "0 0% 7%",
      info: "210 70% 50%",                 // #3080CC — hints/tooltips
      infoForeground: "0 0% 100%",
      sidebar: {
        background: "30 40% 97%",          // #FDF7F2 — elevated warm surface
        foreground: "0 0% 20%",            // body text
        primary: "252 100% 44%",           // purple active indicator
        primaryForeground: "0 0% 100%",
        accent: "30 30% 96%",              // subtle warm hover tint
        accentForeground: "0 0% 7%",
        border: "30 15% 85%",             // matches main border
        ring: "252 100% 44%",
      },
    },
    gradients: {
      primary: "linear-gradient(135deg, hsl(252, 100%, 44%), hsl(252, 60%, 55%))",
      secondary: "linear-gradient(135deg, hsl(48, 100%, 50%), hsl(25, 95%, 55%))",
      subtle: "linear-gradient(180deg, hsl(30, 60%, 95%), hsl(30, 40%, 92%))",
      hero: "linear-gradient(135deg, hsl(222, 40%, 14%), hsl(222, 45%, 10%))",
      accent: "linear-gradient(90deg, hsl(48, 100%, 50%), hsl(252, 100%, 44%))",
    },
    shadows: {
      glow: "0 0 40px hsl(252, 100%, 44% / 0.15)",
      elegant: "0 1px 3px hsl(0, 0%, 0% / 0.06)",
      subtle: "0 1px 2px hsl(0, 0%, 0% / 0.04)",
      medium: "0 4px 12px hsl(0, 0%, 0% / 0.08)",
      large: "0 8px 24px hsl(0, 0%, 0% / 0.12)",
      primary: "0 4px 14px hsl(252, 100%, 44% / 0.15)",
    },
    learningMode: {
      background: "222 40% 14%",            // #151B2B — deep navy page
      foreground: "0 0% 92%",              // light text
      card: "222 35% 18%",                 // #1B2236 — dark card surfaces
      cardForeground: "0 0% 92%",
      border: "222 25% 25%",              // subtle dark dividers
      muted: "222 30% 22%",                // #242D42 — de-emphasized surface
      mutedForeground: "220 10% 55%",      // #838D9E — secondary text
      accent: "48 100% 50%",               // yellow CTAs in dark mode
      accentForeground: "222 40% 14%",     // dark bg text on yellow
      popover: "222 50% 12%",              // #101828 — tooltip/overlay bg
      popoverForeground: "0 0% 92%",
      input: "222 30% 22%",                // dark input backgrounds
      ring: "48 100% 50%",                 // yellow focus ring in dark
    },
    progress: {
      barFill: "48 100% 50%",              // yellow XP bar fill
      barTrack: "222 20% 25%",             // dark muted track
      circleStroke: "48 100% 50%",
      circleTrack: "222 20% 25%",
      xpGain: "145 60% 42%",              // green gain indicator
      xpText: "48 100% 50%",               // yellow '+100 XP' text
      segmentComplete: "145 60% 42%",      // green completed segments
      segmentActive: "48 100% 50%",        // yellow active segment
      segmentPending: "222 20% 30%",       // dark gray pending
    },
    codeEditor: {
      background: "222 45% 10%",            // #0E1420 — darker than page bg
      foreground: "0 0% 85%",             // default code text
      lineNumber: "220 10% 40%",           // muted gutter numbers
      activeLine: "222 35% 14%",           // subtle row highlight
      selection: "210 50% 35%",            // blue selection highlight
      cursor: "48 100% 50%",               // yellow cursor
      gutterBackground: "222 45% 8%",      // darker than editor
      gutterBorder: "222 25% 18%",
    },
    quiz: {
      optionBackground: "222 30% 22%",      // elevated dark surface
      optionBorder: "222 25% 30%",          // dark border
      optionHoverBorder: "222 25% 40%",     // lighter on hover
      optionSelectedBorder: "210 60% 45%",  // blue selected state
      optionSelectedBackground: "210 40% 20%", // subtle blue tint
      optionCorrectBorder: "145 60% 42%",   // green correct
      optionCorrectBackground: "145 40% 18%", // subtle green bg
      optionIncorrectBorder: "0 75% 55%",   // red incorrect
      optionIncorrectBackground: "0 40% 18%", // subtle red bg
    },
    celebration: {
      background: "222 50% 12%",            // #101828 — dark overlay
      foreground: "0 0% 100%",             // white celebration text
      trophy: "48 100% 50%",               // yellow trophy icon
      confettiPrimary: "252 100% 44%",      // purple confetti
      confettiSecondary: "48 100% 50%",     // yellow confetti
      confettiTertiary: "25 95% 55%",       // orange confetti (decorative accent)
      ctaBackground: "48 100% 50%",         // yellow "What's Next?" button
      ctaForeground: "0 0% 7%",            // dark text on CTA
      checkmark: "145 60% 42%",             // green completion check
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