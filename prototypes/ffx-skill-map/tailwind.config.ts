import type { Config } from "tailwindcss";
import { baseTailwindConfig } from "@proto-portal/design-tokens";

/**
 * Tailwind configuration for FFX Skill Map prototype
 * Uses shared design tokens — chart colors overridden via theme.css
 */
export default {
  ...baseTailwindConfig,
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  plugins: [require("tailwindcss-animate")],
} satisfies Config;