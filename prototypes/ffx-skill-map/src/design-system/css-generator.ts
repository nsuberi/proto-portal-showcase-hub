/**
 * FFX CSS Generator
 * 
 * This module generates CSS from the local design system tokens
 * It creates the CSS custom properties that will be injected into the app
 */

import { generateFFXCSSProperties } from './index';

/**
 * Generate the complete CSS for the FFX light theme
 * This replaces the manual CSS custom property definitions
 */
export function generateFFXThemeCSS(): string {
  const properties = generateFFXCSSProperties();
  
  const cssRules = Object.entries(properties)
    .map(([property, value]) => `    ${property}: ${value};`)
    .join('\n');

  return `
/* FFX Skill Map Light Theme - Generated from Design Tokens */
@layer base {
  :root {
${cssRules}
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    /* Ensure light theme is always used - no dark mode */
    color-scheme: light;
    /* Add subtle background pattern for visual interest */
    background-image: 
      radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.02) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, hsl(var(--info) / 0.02) 0%, transparent 50%);
  }

  /* Prevent dark mode activation - force light theme */
  .dark {
    /* Override to use light theme even if dark class is present */
    --background: var(--background);
    --foreground: var(--foreground);
    --card: var(--card);
    --card-foreground: var(--card-foreground);
  }
}

/* FFX-specific component utilities that extend the shared design system */
@layer utilities {
  /* Node visualization styles using design tokens */
  .node-combat {
    fill: hsl(var(--skill-combat-solid));
  }
  
  .node-magic {
    fill: hsl(var(--skill-magic-solid));
  }
  
  .node-support {
    fill: hsl(var(--skill-support-solid));
  }
  
  .node-special {
    fill: hsl(var(--skill-special-solid));
  }
  
  .node-advanced {
    fill: hsl(var(--skill-advanced-solid));
  }

  /* Chart customizations using semantic colors */
  .recharts-pie-sector {
    transition: var(--transition-smooth);
  }
  
  .recharts-bar-rectangle {
    transition: var(--transition-smooth);
  }
  
  .recharts-line-dot {
    transition: var(--transition-smooth);
  }
}
`.trim();
}

/**
 * Write the generated CSS to a file (for build-time generation)
 */
export function writeFFXThemeCSS(outputPath: string): void {
  const css = generateFFXThemeCSS();
  // This would write to file in a real build process
  console.log('Generated CSS would be written to:', outputPath);
  console.log('CSS length:', css.length, 'characters');
}