/**
 * Playwright-powered flow capture utility.
 *
 * Navigates a sequence of steps in a headless browser, taking a viewport
 * screenshot after each step.  Screenshots are saved to disk and returned
 * as base64 strings so MCP tools can embed them as image content.
 */

import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// ── Public types ─────────────────────────────────────────────────────────

export interface FlowStep {
  action: "navigate" | "click" | "scroll" | "type" | "wait" | "screenshot_only";
  label: string;
  url?: string;
  selector?: string;
  text?: string;
  scroll_y?: number;
  wait_ms?: number;
  timeout_ms?: number;
}

export interface CaptureOptions {
  flowName: string;
  baseUrl: string;
  steps: FlowStep[];
  viewport?: { width: number; height: number };
  outputDir: string;
  phase: string;
}

export interface StepResult {
  label: string;
  action: string;
  url: string;
  screenshotPath: string;
  screenshotBase64: string;
  durationMs: number;
  error?: string;
}

export interface CaptureResult {
  timestamp: string;
  screenshotDir: string;
  steps: StepResult[];
  totalDurationMs: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function resolveUrl(base: string, url?: string): string {
  if (!url) return base;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Strip trailing slash from base, ensure url starts with /
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

// ── Main capture function ────────────────────────────────────────────────

export async function captureFlow(options: CaptureOptions): Promise<CaptureResult> {
  const { flowName, baseUrl, steps, phase } = options;
  const viewport = options.viewport ?? { width: 1280, height: 800 };
  const ts = timestamp();
  const screenshotDir = resolve(options.outputDir, phase, flowName, ts);
  mkdirSync(screenshotDir, { recursive: true });

  // Dynamic import — server starts normally even without Playwright installed
  let chromium: typeof import("playwright").chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch {
    throw new Error(
      "Playwright is not installed. Run: npx playwright install chromium",
    );
  }

  const totalStart = Date.now();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const stepResults: StepResult[] = [];

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStart = Date.now();
      const nn = String(i + 1).padStart(2, "0");
      const slug = slugify(step.label);
      const filename = `step-${nn}-${slug}.png`;
      const screenshotPath = join(screenshotDir, filename);
      let error: string | undefined;

      try {
        const timeout = step.timeout_ms ?? 10000;

        switch (step.action) {
          case "navigate": {
            const url = resolveUrl(baseUrl, step.url);
            await page.goto(url, { waitUntil: "domcontentloaded", timeout });
            break;
          }
          case "click": {
            if (!step.selector) throw new Error("click requires a selector");
            await page.click(step.selector, { timeout });
            await page.waitForLoadState("domcontentloaded").catch(() => {});
            break;
          }
          case "scroll": {
            if (step.selector) {
              await page.locator(step.selector).scrollIntoViewIfNeeded({ timeout });
            } else if (step.scroll_y != null) {
              await page.evaluate((y) => window.scrollBy(0, y), step.scroll_y);
            }
            break;
          }
          case "type": {
            if (!step.selector) throw new Error("type requires a selector");
            if (!step.text) throw new Error("type requires text");
            await page.fill(step.selector, step.text, { timeout });
            break;
          }
          case "wait": {
            if (step.selector) {
              await page.waitForSelector(step.selector, { timeout });
            } else {
              await page.waitForTimeout(step.wait_ms ?? 1000);
            }
            break;
          }
          case "screenshot_only":
            // No action — just take the screenshot below
            break;
        }
      } catch (e) {
        error = (e as Error).message;
      }

      // Optional delay before screenshot
      if (step.wait_ms && step.action !== "wait") {
        await page.waitForTimeout(step.wait_ms);
      }

      // Capture screenshot regardless of step success
      try {
        await page.screenshot({ path: screenshotPath, type: "png", fullPage: false });
      } catch (e) {
        error = error
          ? `${error}; screenshot failed: ${(e as Error).message}`
          : `screenshot failed: ${(e as Error).message}`;
      }

      let screenshotBase64 = "";
      try {
        screenshotBase64 = readFileSync(screenshotPath).toString("base64");
      } catch {
        // File may not exist if screenshot failed
      }

      stepResults.push({
        label: step.label,
        action: step.action,
        url: page.url(),
        screenshotPath,
        screenshotBase64,
        durationMs: Date.now() - stepStart,
        ...(error ? { error } : {}),
      });
    }
  } finally {
    await browser.close();
  }

  return {
    timestamp: ts,
    screenshotDir,
    steps: stepResults,
    totalDurationMs: Date.now() - totalStart,
  };
}
