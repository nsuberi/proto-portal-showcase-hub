import { test, expect } from '@playwright/test';

// Simplified smoke test to ensure the app loads. Keep integration light to avoid CI flakiness.
test.describe('FFX Skill Map - Smoke', () => {
  test('loads main page and renders heading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Use a more specific selector to avoid strict mode violation
    await expect(page.locator('h1:has-text("Map of Mastery")')).toBeVisible({ timeout: 10000 });
  });
});