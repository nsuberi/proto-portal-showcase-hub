import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/code-dojo/",
  server: {
    port: 3007,
    host: true,
    proxy: {
      "/code-dojo/api": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
      "/code-dojo/submissions": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
      "/code-dojo/schedule": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV !== "production",
  },
});
