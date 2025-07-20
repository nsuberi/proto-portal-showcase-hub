/**
 * Responsive design tokens for mobile-first development
 * These tokens ensure consistent mobile behavior across all applications
 */

export interface ResponsiveTokens {
  // Breakpoints
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
  
  // Container constraints
  containers: {
    mobile: {
      maxWidth: string;
      padding: string;
    };
    tablet: {
      maxWidth: string;
      padding: string;
    };
    desktop: {
      maxWidth: string;
      padding: string;
    };
  };
  
  // Mobile-specific spacing
  mobileSpacing: {
    sectionPadding: string;
    elementGap: string;
    buttonGroup: string;
    containerPadding: string;
  };
  
  // Button group layouts
  buttonGroups: {
    mobile: {
      direction: string;
      gap: string;
      width: string;
    };
    desktop: {
      direction: string;
      gap: string;
      width: string;
    };
  };
  
  // Content width constraints
  contentWidth: {
    mobile: {
      max: string;
      min: string;
    };
    desktop: {
      max: string;
      min: string;
    };
  };
}

export const responsiveTokens: ResponsiveTokens = {
  breakpoints: {
    sm: "640px",
    md: "768px", 
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  
  containers: {
    mobile: {
      maxWidth: "100vw",
      padding: "1rem", // 16px
    },
    tablet: {
      maxWidth: "768px",
      padding: "1.5rem", // 24px
    },
    desktop: {
      maxWidth: "1280px",
      padding: "2rem", // 32px
    },
  },
  
  mobileSpacing: {
    sectionPadding: "3rem 1rem", // py-12 px-4
    elementGap: "0.75rem", // gap-3
    buttonGroup: "0.75rem", // gap-3 on mobile
    containerPadding: "1rem", // px-4
  },
  
  buttonGroups: {
    mobile: {
      direction: "column",
      gap: "0.75rem", // gap-3
      width: "100%",
    },
    desktop: {
      direction: "row", 
      gap: "1.5rem", // gap-6
      width: "auto",
    },
  },
  
  contentWidth: {
    mobile: {
      max: "100vw",
      min: "320px", // Minimum mobile viewport width
    },
    desktop: {
      max: "1280px",
      min: "768px",
    },
  },
};