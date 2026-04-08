import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3008",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx vite --port 3008",
    port: 3008,
    reuseExistingServer: true,
  },
});
