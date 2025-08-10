import { test, expect } from '@playwright/test';

// This suite verifies that the portfolio and both prototypes load and basic navigation works
// Flow:
// - Load main page (portfolio)
// - Try Live Demo for the FFX Skill Map
// - Click Back to Portfolio
// - Try Live Demo for the Home Lending prototype
// - Click Back to Portfolio
// - Finish

test.describe('Portfolio and Prototypes - Navigation Smoke', () => {
  test('navigates through portfolio and live demos', async ({ page, baseURL }) => {
    // Ensure baseURL points to the portfolio root or CloudFront portfolio path
    const root = baseURL ?? 'http://localhost:8080';

    // 1) Load main page
    await page.goto(root.endsWith('/') ? root : `${root}/`);

    // Header assertion for main portfolio
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Explore the Future of Learning with AI');

    // Scroll into view if needed and click "Try Live Demo" for FFX Skill Map
    const ffxCard = page.locator('text=Your Learning Adventure Map').first();
    await ffxCard.scrollIntoViewIfNeeded();
    const ffxDemoLink = ffxCard.locator('..').locator('text=Try Live Demo').first();
    await ffxDemoLink.click();

    // 2) FFX Skill Map page should load and show its main heading
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Map of Mastery');

    // Use Back to Portfolio button
    // Prefer an accessible role/string; fallback to text match
    const backToPortfolioFFX = page.getByRole('button', { name: /Back to Portfolio/i }).first();
    if (await backToPortfolioFFX.count()) {
      await backToPortfolioFFX.click();
    } else {
      await page.getByText(/Back to Portfolio/i).click();
    }

    // 3) Back on portfolio; verify hero heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Explore the Future of Learning with AI');

    // Click Try Live Demo for Home Lending prototype
    const hlCard = page.locator('text=Home Lending Learning Platform').first();
    await hlCard.scrollIntoViewIfNeeded();
    const hlDemoLink = hlCard.locator('..').locator('text=Try Live Demo').first();
    await hlDemoLink.click();

    // 4) Home Lending page should load and show its header
    await page.waitForLoadState('networkidle');
    // The title in App header contains "Home Lending Learning"
    await expect(page.getByText(/Home Lending Learning/i).first()).toBeVisible();
    // Also verify a section header exists
    await expect(page.getByRole('heading', { level: 2 })).toContainText(/Home Lending Process Flow/i);

    // Use Back to Portfolio button on Home Lending
    const backToPortfolioHL = page.getByRole('button', { name: /Back to Portfolio/i }).first();
    if (await backToPortfolioHL.count()) {
      await backToPortfolioHL.click();
    } else {
      await page.getByText(/Back to Portfolio/i).click();
    }

    // 5) Finish on portfolio
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Explore the Future of Learning with AI');
  });
});
