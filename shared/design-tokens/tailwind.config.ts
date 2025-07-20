import type { Config } from "tailwindcss";
import { baseTailwindConfig } from "./tailwind/base-config";

/**
 * Tailwind configuration for shared design tokens package
 */
export default {
  ...baseTailwindConfig,
  content: [
    "./tokens/**/*.{ts,tsx}",
    "./css/**/*.css",
  ],
} satisfies Config;