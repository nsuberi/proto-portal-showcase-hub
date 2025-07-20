/**
 * Skill category color tokens for FFX prototype
 * Using semantic color references for consistency and overrides
 */

export interface SkillCategoryTokens {
  combat: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  magic: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  support: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  special: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  advanced: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  default: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
}

export const skillCategoryTokens: SkillCategoryTokens = {
  combat: {
    bg: "hsl(0, 84%, 95%)",      // Light red background
    border: "hsl(0, 84%, 80%)",  // Red border
    text: "hsl(0, 84%, 30%)",    // Dark red text
    solid: "hsl(var(--destructive))", // Use semantic destructive color
  },
  magic: {
    bg: "hsl(213, 94%, 95%)",    // Light blue background
    border: "hsl(213, 94%, 80%)", // Blue border
    text: "hsl(213, 94%, 30%)",  // Dark blue text
    solid: "hsl(var(--info))",   // Use semantic info color
  },
  support: {
    bg: "hsl(142, 76%, 95%)",    // Light green background
    border: "hsl(142, 76%, 80%)", // Green border
    text: "hsl(142, 76%, 25%)",  // Dark green text
    solid: "hsl(var(--success))", // Use semantic success color
  },
  special: {
    bg: "hsl(263, 70%, 95%)",    // Light purple background
    border: "hsl(263, 70%, 80%)", // Purple border
    text: "hsl(263, 70%, 30%)",  // Dark purple text
    solid: "hsl(var(--primary))", // Use semantic primary color
  },
  advanced: {
    bg: "hsl(48, 96%, 95%)",     // Light yellow background
    border: "hsl(48, 96%, 80%)",  // Yellow border
    text: "hsl(48, 96%, 30%)",   // Dark yellow text
    solid: "hsl(var(--warning))", // Use semantic warning color
  },
  default: {
    bg: "hsl(var(--muted))",     // Use semantic muted background
    border: "hsl(var(--border))", // Use semantic border
    text: "hsl(var(--muted-foreground))", // Use semantic muted text
    solid: "hsl(var(--muted-foreground))", // Use semantic muted color
  },
};