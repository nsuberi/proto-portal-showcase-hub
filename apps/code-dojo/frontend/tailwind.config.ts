import type { Config } from "tailwindcss";
import { baseTailwindConfig } from "@proto-portal/design-tokens";

export default {
  ...baseTailwindConfig,
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // Include shared ui-components so Tailwind sees their classes
    "../../shared/ui-components/src/**/*.{ts,tsx}",
  ],
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
