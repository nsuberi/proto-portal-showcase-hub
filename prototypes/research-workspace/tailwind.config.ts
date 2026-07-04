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
        primary: "var(--color-primary)",
        "primary-container": "var(--color-primary-container)",
        "on-primary": "var(--color-on-primary)",
        "on-primary-container": "var(--color-on-primary-container)",
        secondary: "var(--color-secondary)",
        "secondary-container": "var(--color-secondary-container)",
        "on-secondary": "var(--color-on-secondary)",
        tertiary: "var(--color-tertiary)",
        "tertiary-container": "var(--color-tertiary-container)",
        "on-tertiary": "var(--color-on-tertiary)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "inverse-surface": "var(--color-inverse-surface)",
        "inverse-on-surface": "var(--color-inverse-on-surface)",
        outline: "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",
        error: "var(--color-error)",
        "on-error": "var(--color-on-error)",
        "accent-success": "var(--color-accent-success)",
        root: "var(--color-root)",
        branch: "var(--color-branch)",
        leaf: "var(--color-leaf)",
        flower: "var(--color-flower)",
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
      // Restore non-default widths used throughout the app (were silent no-ops):
      // ensures input borders and focus rings actually render (accessibility).
      borderWidth: {
        "1.5": "1.5px",
        "3": "3px",
      },
      ringWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
