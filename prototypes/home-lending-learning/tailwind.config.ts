import type { Config } from "tailwindcss";
import { baseTailwindConfig, createDesignTokens } from "@proto-portal/design-tokens";

/**
 * Tailwind configuration for Home Lending Learning prototype
 * Uses shared design tokens with custom overrides
 */

// Create custom design tokens for Home Lending Learning
const homeLendingTokens = createDesignTokens({
  colors: {
    primary: "210 100% 50%", // Professional blue
    secondary: "25 95% 53%", // Warm orange for accent
    accent: "142 76% 36%", // Success green
  },
  chartColors: {
    primary: [
      "hsl(210, 100%, 50%)", // Professional blue
      "hsl(142, 76%, 36%)", // Success green  
      "hsl(25, 95%, 53%)", // Warm orange
      "hsl(280, 100%, 70%)", // Purple accent
      "hsl(0, 84%, 60%)", // Alert red
    ],
  },
});

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
      colors: {
        ...baseTailwindConfig.theme?.extend?.colors,
        // Chart colors using custom token overrides
        'chart-1': homeLendingTokens.chartColors.primary[0],
        'chart-2': homeLendingTokens.chartColors.primary[1],
        'chart-3': homeLendingTokens.chartColors.primary[2],
        'chart-4': homeLendingTokens.chartColors.primary[3],
        'chart-5': homeLendingTokens.chartColors.primary[4],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;