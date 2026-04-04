import { test, expect } from '@playwright/test';

// Steel-thread navigation smoke test: portfolio -> each prototype -> back
// Covers: FFX Skill Map, Learning Path, Home Lending, Documentation Explorer

const PORTFOLIO_HEADING = 'Explore the Future of Learning with AI';

test.describe('Portfolio + Prototypes: end-to-end navigation', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Suppress first-visit overlays in prototypes that use localStorage
    await page.addInitScript(() => {
      try {
        localStorage.setItem('skillMapTutorialSeen', '1');
      } catch {}
    });
  });

  test('main -> ffx -> back -> learning path -> back -> home lending -> back -> doc explorer -> back', async ({ page, baseURL }) => {
    const root = baseURL ?? 'https://portfolio.cookinupideas.com';

    // 1) Main portfolio page
    await page.goto(root);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(PORTFOLIO_HEADING);

    // ---------- FFX Skill Map ----------
    const ffxCard = page.locator('text=Your Learning Adventure Map').first();
    await ffxCard.scrollIntoViewIfNeeded();
    await ffxCard.locator('..').locator('text=Try Live Demo').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Map of Mastery');

    // Dismiss tutorial if present
    const skipBtn = page.getByRole('button', { name: /Skip/i }).first();
    if (await skipBtn.count()) await skipBtn.click();

    // Back to portfolio
    await page.getByText(/Back to Portfolio/i).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(PORTFOLIO_HEADING);

    // ---------- Learning Path ----------
    const lpCard = page.locator('text=Learning Path: Recipes Explorer').first();
    await lpCard.scrollIntoViewIfNeeded();
    await lpCard.locator('..').locator('text=Try Live Demo').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cooking is a Journey');

    // Back to portfolio
    await page.getByText(/Back to Portfolio/i).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(PORTFOLIO_HEADING);

    // ---------- Home Lending ----------
    const hlCard = page.locator('text=Home Lending Learning Platform').first();
    await hlCard.scrollIntoViewIfNeeded();
    await hlCard.locator('..').locator('text=Try Live Demo').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Home Lending Learning/i).first()).toBeVisible();

    // Dismiss legal overlay if present
    const acceptBtn = page.getByRole('button', { name: /I Understand and Accept/i }).first();
    if (await acceptBtn.count()) await acceptBtn.click();

    // Back to portfolio
    await page.getByText(/Back to Portfolio/i).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(PORTFOLIO_HEADING);

    // ---------- Documentation Explorer ----------
    const deCard = page.locator('text=Interactive Documentation Explorer').first();
    await deCard.scrollIntoViewIfNeeded();
    await deCard.locator('..').locator('text=Try Live Demo').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Documentation Explorer');

    // Dismiss the welcome/instructions modal if present
    const getStartedBtn = page.getByRole('button', { name: /Get Started/i }).first();
    if (await getStartedBtn.count()) await getStartedBtn.click();

    // Back to portfolio
    await page.getByText(/Back to Portfolio/i).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(PORTFOLIO_HEADING);
  });

  // Individual smoke tests for direct URL access to each prototype
  test('direct access: FFX Skill Map loads', async ({ page, baseURL }) => {
    const root = baseURL ?? 'https://portfolio.cookinupideas.com';
    await page.goto(`${root}/prototypes/ffx-skill-map/`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Map of Mastery');
  });

  test('direct access: Learning Path loads', async ({ page, baseURL }) => {
    const root = baseURL ?? 'https://portfolio.cookinupideas.com';
    await page.goto(`${root}/prototypes/learning-path/`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cooking is a Journey');
  });

  test('direct access: Home Lending loads', async ({ page, baseURL }) => {
    const root = baseURL ?? 'https://portfolio.cookinupideas.com';
    await page.goto(`${root}/prototypes/home-lending-learning/`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Home Lending Learning/i).first()).toBeVisible();
  });

  test('direct access: Documentation Explorer loads', async ({ page, baseURL }) => {
    const root = baseURL ?? 'https://portfolio.cookinupideas.com';
    await page.goto(`${root}/prototypes/documentation-explorer/`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Documentation Explorer');
  });
});
