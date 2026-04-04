import type { Config } from "tailwindcss";
import { baseTailwindConfig } from "@proto-portal/design-tokens";

/**
 * Tailwind configuration for Home Lending Learning prototype
 * Uses shared design tokens — colors and chart overrides in index.css
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