import { test, expect } from '@playwright/test';

test.describe('Home Lending Learning - Basic Smoke Tests', () => {
  test('loads main page and renders heading', async ({ page, baseURL }) => {
    // Navigate to the Home Lending Learning page
    const url = baseURL?.includes('/prototypes/home-lending-learning') ? '/' : '/prototypes/home-lending-learning/';
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    // Check if any h1 exists (basic sanity check)
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Verify it contains expected content
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });
});