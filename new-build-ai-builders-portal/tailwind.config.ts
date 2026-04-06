import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-space": "var(--color-deep-space)",
        "orbital-blue": "var(--color-orbital-blue)",
        "instrument-blue": "var(--color-instrument-blue)",
        "signal-orange": "var(--color-signal-orange)",
        "atmosphere-teal": "var(--color-atmosphere-teal)",
        regolith: "var(--color-regolith)",
        "shelter-white": "var(--color-shelter-white)",
        sediment: "var(--color-sediment)",
        dust: "var(--color-dust)",
        "dark-text": "var(--color-dark-text)",
        "border-warm": "var(--color-border-warm)",
        "phase-1": "var(--color-phase-1)",
        "phase-2": "var(--color-phase-2)",
        "phase-3": "var(--color-phase-3)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      borderWidth: {
        thin: "0.5px",
      },
      keyframes: {
        "live-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 118, 58, 0.4)" },
          "50%": { boxShadow: "0 0 0 6px rgba(212, 118, 58, 0)" },
        },
      },
      animation: {
        "live-pulse": "live-pulse 2s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
