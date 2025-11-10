import { test, expect } from '@playwright/test';

test('loads and shows main sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Learning Path/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Recipe Cluster Viewer/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Foods of the world/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Recipes Around the World/i })).toBeVisible();
});


