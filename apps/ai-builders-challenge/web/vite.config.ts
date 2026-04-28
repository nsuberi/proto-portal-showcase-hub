import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../app/static"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/chat": "http://localhost:5100",
      "/logs": "http://localhost:5100",
      "/health": "http://localhost:5100",
      "/properties": "http://localhost:5100",
      "/transcripts": "http://localhost:5100",
      "/behavioral": "http://localhost:5100",
    },
  },
});
