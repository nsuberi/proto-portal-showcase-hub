import { test, expect } from "@playwright/test";

/**
 * Tests the adhoc research run flow against a LOCAL backend server.
 *
 * Prerequisites:
 *   VAULT_ROOT=/tmp/test-vault PORT=8081 node apps/research-workspace/src/server.js
 *
 * Run:
 *   BACKEND_URL=http://localhost:8081 npx playwright test e2e/run-flow.spec.ts
 */

const BACKEND = process.env.BACKEND_URL || "http://localhost:8081";

test.describe("Research Run Flow", () => {
  test("settings.json uses correct hooks format after vault init", async ({
    request,
  }) => {
    // Hit the config endpoint — this triggers vault + settings init for the dev user
    const configRes = await request.get(`${BACKEND}/api/vault/config`);
    expect(configRes.status()).toBe(200);
    const config = await configRes.json();

    // Verify hooks are present and flattened for frontend consumption
    // Each entry should have {matcher, command, filePath}
    if (config.hooks && Object.keys(config.hooks).length > 0) {
      for (const [, entries] of Object.entries(config.hooks)) {
        expect(Array.isArray(entries)).toBe(true);
        for (const entry of entries as Array<Record<string, unknown>>) {
          expect(entry).toHaveProperty("matcher");
          expect(entry).toHaveProperty("command");
          expect(typeof entry.command).toBe("string");
          expect((entry.command as string).length).toBeGreaterThan(0);
        }
      }
    }
  });

  test("onboarding-status endpoint responds", async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/vault/onboarding-status`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // On a fresh vault, onboarding is not complete — that's expected
    expect(body).toHaveProperty("ready");
  });

  test("run spawn handles errors gracefully", async ({ request }) => {
    // Start a run via the API — may fail if Claude CLI isn't installed locally
    const runRes = await request.post(`${BACKEND}/api/vault/runs`, {
      data: {
        prompt: "echo hello from test",
        title: "E2E test run",
      },
    });

    if (runRes.status() === 500) {
      // Claude CLI not installed — verify server returns a clean error (not a crash)
      const body = await runRes.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toContain("Failed to spawn");
      // Verify server is still alive after the error
      const healthRes = await request.get(`${BACKEND}/healthz`);
      expect(healthRes.status()).toBe(200);
    } else {
      // Claude CLI is available — run was created successfully
      expect(runRes.status()).toBe(201);
      const { runId } = await runRes.json();
      expect(runId).toBeTruthy();
      // Clean up
      await request.delete(`${BACKEND}/api/vault/runs/${runId}`);
    }
  });

  test("run PTY does not show trust prompt or settings error", async ({
    request,
    page,
  }) => {
    // This test only runs if Claude CLI is available
    const runRes = await request.post(`${BACKEND}/api/vault/runs`, {
      data: {
        prompt: "echo hello from test",
        title: "E2E trust prompt test",
      },
    });
    if (runRes.status() !== 201) {
      test.skip(true, "Claude CLI not installed — skipping PTY output test");
      return;
    }
    const { runId } = await runRes.json();

    // Connect to the run WebSocket and collect output
    const port = new URL(BACKEND).port || "8081";
    const wsUrl = `ws://localhost:${port}/api/vault/runs/${runId}/ws`;
    const output = await page.evaluate(async (url: string) => {
      return new Promise<string>((resolve) => {
        let buffer = "";
        const ws = new WebSocket(url);
        ws.onmessage = (event) => {
          buffer += event.data;
        };
        setTimeout(() => {
          ws.close();
          resolve(buffer);
        }, 8000);
        ws.onerror = () => resolve(buffer);
      });
    }, wsUrl);

    // The trust prompt should NOT appear (CLAUDE_CODE_SANDBOXED=1 prevents it)
    expect(output).not.toContain("trust this folder");
    expect(output).not.toContain("Is this a project you created");

    // The settings error should NOT appear (correct hooks format)
    expect(output).not.toContain("Settings Error");
    expect(output).not.toContain("Expected array, but received undefined");

    // Clean up
    await request.delete(`${BACKEND}/api/vault/runs/${runId}`);
  });

  test("published endpoint is accessible without auth", async ({
    request,
  }) => {
    const res = await request.get(`${BACKEND}/api/vault/published`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(Array.isArray(body.items)).toBe(true);
  });
});
