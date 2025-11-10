import type { Config } from "tailwindcss";
import { baseTailwindConfig } from "@proto-portal/design-tokens";

export default {
  ...baseTailwindConfig,
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../shared/design-tokens/**/*.{ts,tsx,css}"
  ]
} satisfies Config;


