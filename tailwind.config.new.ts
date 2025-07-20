import type { Config } from "tailwindcss";
import { baseTailwindConfig } from "@proto-portal/design-tokens";

/**
 * Tailwind configuration for main portfolio
 * Uses shared design tokens with no overrides
 */
export default {
  ...baseTailwindConfig,
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
} satisfies Config;