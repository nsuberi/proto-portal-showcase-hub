#!/usr/bin/env node
/**
 * Quick Playwright screenshot helper for visual debugging.
 *
 * Usage:
 *   node scripts/screenshot.mjs <url> [outfile] [--width=1400] [--height=900] [--full]
 *
 * Examples:
 *   node scripts/screenshot.mjs http://localhost:3009/prototypes/research-workspace/workspace
 *   node scripts/screenshot.mjs http://localhost:3009/prototypes/research-workspace/workspace shot.png --full
 *   node scripts/screenshot.mjs http://localhost:3002/prototypes/home-lending-learning/ mobile.png --width=390 --height=844
 *
 * Run from the repo root so '@playwright/test' resolves from the hoisted node_modules.
 * Waits for networkidle so client-side fetches (e.g. WS "Connected" state) settle before capture.
 */
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    }),
);

const url = positional[0];
if (!url) {
  console.error('Usage: node scripts/screenshot.mjs <url> [outfile] [--width=1400] [--height=900] [--full]');
  process.exit(1);
}
const out = positional[1] || 'screenshot.png';
const width = Number(flags.width) || 1400;
const height = Number(flags.height) || 900;
const fullPage = Boolean(flags.full);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: out, fullPage });
await browser.close();
console.log(`Saved ${out} (${width}x${height}${fullPage ? ', full page' : ''}) <- ${url}`);
