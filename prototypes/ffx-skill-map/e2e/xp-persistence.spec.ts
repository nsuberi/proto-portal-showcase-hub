import { test, expect } from '@playwright/test';

// Simplified smoke test to ensure the app loads. Keep integration light to avoid CI flakiness.
test.describe('FFX Skill Map - Smoke', () => {
  test('loads main page and renders heading', async ({ page, baseURL }) => {
    // Navigate to the FFX Skill Map page
    console.log('Test baseURL:', baseURL);
    
    // If baseURL already ends with the prototype path, go to root
    // Otherwise, navigate to the prototype path
    let url = '/';
    if (baseURL && !baseURL.includes('/prototypes/ffx-skill-map')) {
      url = '/prototypes/ffx-skill-map/';
    }
    
    console.log('Navigating to:', url);
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    // Multiple approaches to ensure we find the element:
    // 1. First check if any h1 exists (basic sanity check)
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // 2. Then verify it contains our expected text
    // Using getByRole is more reliable than text selectors for gradient text
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('Map of Mastery');
  });
});