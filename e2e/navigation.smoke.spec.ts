import { test, expect } from '@playwright/test';

// Root-level navigation smoke test that drives the portfolio and both prototypes
// Flow:
// - Load main page
// - Try Live Demo for the FFX Skill Map
// - Back to Portfolio
// - Try Live Demo for Home Lending prototype
// - Back to Portfolio

test.describe('Portfolio + Prototypes: end-to-end navigation', () => {
  test('main -> ffx -> back -> home lending -> back', async ({ page, baseURL }) => {
    const root = baseURL ?? 'http://localhost:8080/';

    // 1) Main page
    await page.goto(root);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Explore the Future of Learning with AI');

    // Prevent first-visit tutorial overlay in FFX from blocking interactions
    await page.evaluate(() => {
      try {
        localStorage.setItem('skillMapTutorialSeen', '1');
      } catch {}
    });

    // FFX live demo via portfolio card
    const ffxCard = page.locator('text=Your Learning Adventure Map').first();
    await ffxCard.scrollIntoViewIfNeeded();
    await ffxCard.locator('..').locator('text=Try Live Demo').first().click();

    // 2) FFX prototype heading
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Map of Mastery');

    // If any tutorial/instructions overlay still appears, dismiss it
    const skipButton = page.getByRole('button', { name: /Skip/i }).first();
    if (await skipButton.count()) {
      await skipButton.click();
    }

    // Back to Portfolio (button or text)
    const backFFX = page.getByRole('button', { name: /Back to Portfolio/i }).first();
    if (await backFFX.count()) {
      await backFFX.click();
    } else {
      await page.getByText(/Back to Portfolio/i).click();
    }

    // 3) Back on main
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Explore the Future of Learning with AI');

    // Home Lending live demo
    const hlCard = page.locator('text=Home Lending Learning Platform').first();
    await hlCard.scrollIntoViewIfNeeded();
    await hlCard.locator('..').locator('text=Try Live Demo').first().click();

    // 4) Home Lending headers
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Home Lending Learning/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Home Lending Process Flow/i })).toBeVisible();

    // Back to portfolio
    const backHL = page.getByRole('button', { name: /Back to Portfolio/i }).first();
    if (await backHL.count()) {
      await backHL.click();
    } else {
      await page.getByText(/Back to Portfolio/i).click();
    }

    // 5) Finish on main
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Explore the Future of Learning with AI');
  });
});
