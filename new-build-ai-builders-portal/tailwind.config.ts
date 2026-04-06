import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        "surface-dim": "var(--color-surface-dim)",
        "surface-bright": "var(--color-surface-bright)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container": "var(--color-surface-container)",
        "surface-container-high": "var(--color-surface-container-high)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "surface-variant": "var(--color-surface-variant)",
        primary: "var(--color-primary)",
        "primary-container": "var(--color-primary-container)",
        "on-primary": "var(--color-on-primary)",
        "on-primary-container": "var(--color-on-primary-container)",
        secondary: "var(--color-secondary)",
        "secondary-container": "var(--color-secondary-container)",
        "on-secondary-container": "var(--color-on-secondary-container)",
        tertiary: "var(--color-tertiary)",
        "tertiary-container": "var(--color-tertiary-container)",
        "on-tertiary-container": "var(--color-on-tertiary-container)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        outline: "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",
        error: "var(--color-error)",
        "error-container": "var(--color-error-container)",
        "on-error-container": "var(--color-on-error-container)",
        "inverse-surface": "var(--color-inverse-surface)",
        "inverse-on-surface": "var(--color-inverse-on-surface)",
        "phase-1": "var(--color-phase-1)",
        "phase-2": "var(--color-phase-2)",
        "phase-3": "var(--color-phase-3)",
      },
      fontFamily: {
        headline: ["var(--font-headline)"],
        body: ["var(--font-body)"],
        label: ["var(--font-label)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        ambient: "0 20px 40px -5px rgba(227, 226, 232, 0.05)",
        "ambient-lg": "0 30px 60px -5px rgba(227, 226, 232, 0.05)",
        "glow-tertiary": "0 0 20px rgba(255, 186, 56, 0.3)",
        "glow-primary": "0 0 20px rgba(187, 198, 226, 0.3)",
      },
      keyframes: {
        "live-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 180, 165, 0.4)" },
          "50%": { boxShadow: "0 0 0 6px rgba(255, 180, 165, 0)" },
        },
      },
      animation: {
        "live-pulse": "live-pulse 2s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
