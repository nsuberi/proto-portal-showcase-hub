import type { Config } from "tailwindcss";
import { baseTailwindConfig, createDesignTokens, presetOverrides } from "@proto-portal/design-tokens";

/**
 * Tailwind configuration for FFX Skill Map prototype
 * Uses shared design tokens with FFX-specific overrides
 */

// Create custom design tokens for FFX
const ffxTokens = createDesignTokens(presetOverrides.ffxSkillMap);

export default {
  ...baseTailwindConfig,
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    ...baseTailwindConfig.theme,
    extend: {
      ...baseTailwindConfig.theme?.extend,
      // Add FFX-specific theme extensions if needed
      colors: {
        ...baseTailwindConfig.theme?.extend?.colors,
        // Chart colors using FFX token overrides
        'chart-1': ffxTokens.chartColors.primary[0],
        'chart-2': ffxTokens.chartColors.primary[1],
        'chart-3': ffxTokens.chartColors.primary[2],
        'chart-4': ffxTokens.chartColors.primary[3],
        'chart-5': ffxTokens.chartColors.primary[4],
      },
    },
  },
  // Add plugins that each application needs
  plugins: [require("tailwindcss-animate")],
} satisfies Config;