import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sphere palette
        amber: {
          node: "var(--color-amber-node)",
          light: "var(--color-amber-light)",
          dark: "var(--color-amber-dark)",
        },
        green: {
          node: "var(--color-green-node)",
          light: "var(--color-green-light)",
          dark: "var(--color-green-dark)",
        },
        active: {
          DEFAULT: "var(--color-active)",
          soft: "var(--color-active-soft)",
          glow: "var(--color-active-glow)",
        },
        surface: {
          DEFAULT: "var(--color-bg)",
          line: "var(--color-line)",
        },
        text: {
          dim: "var(--color-dim-text)",
          mid: "var(--color-mid-text)",
          bright: "var(--color-bright-text)",
        },
        role: {
          pm: "var(--color-pm)",
          eng: "var(--color-eng)",
          biz: "var(--color-biz)",
        },
        doc: "var(--color-doc)",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        display: ["'Outfit'", "sans-serif"],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
} satisfies Config;
