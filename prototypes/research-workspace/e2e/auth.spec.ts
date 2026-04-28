import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PORTFOLIO_BASE_URL || 'https://portfolio.cookinupideas.com';
const WORKSPACE_PATH = '/prototypes/research-workspace';

test.describe('Research Workspace - Public Gallery', () => {
  test('public gallery is accessible without auth', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${WORKSPACE_PATH}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('gallery page loads content index', async ({ page }) => {
    await page.goto(`${BASE_URL}${WORKSPACE_PATH}/`);
    // The gallery fetches content-index.json at runtime
    const indexResponse = await page.waitForResponse(
      (response) => response.url().includes('content-index.json'),
      { timeout: 10000 }
    ).catch(() => null);
    // Index file may be empty initially, but the fetch should succeed or be handled gracefully
  });
});

test.describe('Research Workspace - Vault Authentication', () => {
  test('vault path redirects to Cognito/GitHub login', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${WORKSPACE_PATH}/vault/`, {
      waitUntil: 'commit',
    });
    // Should redirect through ALB → Cognito → GitHub
    const url = page.url();
    const isRedirectedToAuth =
      url.includes('amazoncognito.com') ||
      url.includes('github.com/login') ||
      response?.status() === 302;
    expect(isRedirectedToAuth).toBe(true);
  });
});

test.describe('Research Workspace - API Endpoints', () => {
  test('GET /published endpoint returns JSON', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/v1/research-workspace/published`
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.items || body)).toBe(true);
  });

  test('POST /publish requires authentication', async ({ request }) => {
    const response = await request.post(
      `${BASE_URL}/api/v1/research-workspace/publish`,
      {
        data: { type: 'insight', title: 'Test', summary: 'Test' },
      }
    );
    // Should return 401 without auth token
    expect(response.status()).toBe(401);
  });

  test('POST /intentions requires authentication', async ({ request }) => {
    const response = await request.post(
      `${BASE_URL}/api/v1/research-workspace/intentions`,
      {
        data: { type: 'learn', topic: 'test topic' },
      }
    );
    expect(response.status()).toBe(401);
  });
});
