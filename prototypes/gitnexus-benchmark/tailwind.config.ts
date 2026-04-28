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
        amber: {
          DEFAULT: "var(--amber)",
          dim: "var(--amber-dim)",
        },
        emerald: {
          DEFAULT: "var(--emerald)",
          dim: "var(--emerald-dim)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
        },
        text: {
          DEFAULT: "var(--text)",
          mid: "var(--text-mid)",
          dim: "var(--text-dim)",
        },
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        display: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        amber: "0 0 20px var(--amber-glow)",
        emerald: "0 0 20px var(--emerald-glow)",
        accent: "0 0 20px var(--accent-glow)",
      },
    },
  },
  plugins: [],
} satisfies Config;
