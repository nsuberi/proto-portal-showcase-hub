/**
 * Skill category color tokens for FFX prototype
 * Using semantic color references for consistency and overrides
 */

export interface SkillCategoryTokens {
  // FFX skill categories
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
  // Tech organization categories
  engineering: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  platform: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  product: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  communication: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  process: {
    bg: string;
    border: string;
    text: string;
    solid: string;
  };
  leadership: {
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
  // Tech organization categories
  engineering: {
    bg: "hsl(210, 40%, 95%)",    // Light blue-gray background
    border: "hsl(210, 40%, 80%)", // Blue-gray border
    text: "hsl(210, 40%, 25%)",  // Dark blue-gray text
    solid: "hsl(210, 40%, 50%)", // Blue-gray solid
  },
  platform: {
    bg: "hsl(280, 50%, 95%)",    // Light purple background
    border: "hsl(280, 50%, 80%)", // Purple border
    text: "hsl(280, 50%, 25%)",  // Dark purple text
    solid: "hsl(280, 50%, 50%)", // Purple solid
  },
  product: {
    bg: "hsl(45, 80%, 95%)",     // Light orange background
    border: "hsl(45, 80%, 80%)",  // Orange border
    text: "hsl(45, 80%, 25%)",   // Dark orange text
    solid: "hsl(45, 80%, 50%)",  // Orange solid
  },
  communication: {
    bg: "hsl(150, 60%, 95%)",    // Light teal background
    border: "hsl(150, 60%, 80%)", // Teal border
    text: "hsl(150, 60%, 25%)",  // Dark teal text
    solid: "hsl(150, 60%, 50%)", // Teal solid
  },
  process: {
    bg: "hsl(300, 30%, 95%)",    // Light mauve background
    border: "hsl(300, 30%, 80%)", // Mauve border
    text: "hsl(300, 30%, 25%)",  // Dark mauve text
    solid: "hsl(300, 30%, 50%)", // Mauve solid
  },
  leadership: {
    bg: "hsl(25, 70%, 95%)",     // Light coral background
    border: "hsl(25, 70%, 80%)",  // Coral border
    text: "hsl(25, 70%, 25%)",   // Dark coral text
    solid: "hsl(25, 70%, 50%)",  // Coral solid
  },
};