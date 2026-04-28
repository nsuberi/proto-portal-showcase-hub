import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        border: "var(--border)",
        cyan: {
          DEFAULT: "var(--cyan)",
          dim: "var(--cyan-dim)",
        },
        magenta: "var(--magenta)",
        text: {
          DEFAULT: "var(--text)",
          mid: "var(--text-mid)",
          dim: "var(--text-dim)",
        },
        cell: {
          filled: "var(--cell-filled)",
          frontier: "var(--cell-frontier)",
          visited: "var(--cell-visited)",
          current: "var(--cell-current)",
          empty: "var(--cell-empty)",
        },
      },
      boxShadow: {
        glow: "0 0 20px var(--cyan-glow)",
        "glow-magenta": "0 0 20px var(--magenta-glow)",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        display: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
