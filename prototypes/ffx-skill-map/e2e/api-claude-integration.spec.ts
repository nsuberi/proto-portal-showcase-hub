import { test, expect } from '@playwright/test';

test.describe('FFX Skill Map - Claude API Integration', () => {
  // Prefer CI-provided gateway URL, but do not skip when present via env
  const API_BASE_URL = (process.env.API_BASE_URL || process.env.API_GATEWAY_URL || '').replace(/\/$/, '');

  // Direct API call must succeed (no silent pass)
  test('API: skills-and-mentors-recommendations returns 200 with valid payload', async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL not set for production integration tests');
    }
    const justInTimeData = {
      character: { name: 'Tidus', role: 'Guardian', masteredSkills: [] },
      allSkills: [
        { id: 'steal', name: 'Steal', description: 'Take items', category: 'Thief', level: 1, xp_required: 50 },
        { id: 'flee', name: 'Flee', description: 'Escape', category: 'Thief', level: 1, xp_required: 100 }
      ],
      teammates: [
        { name: 'Yuna', role: 'Summoner', mastered_skills: [] },
        { name: 'Auron', role: 'Guardian', mastered_skills: [] }
      ],
      widgetSystemPrompt: 'You are an expert mentor providing skill development guidance for RPG characters.',
      userSystemPrompt: 'Help me understand how to develop my character strategically for team effectiveness.',
      justInTimeQuestion: "How can I improve my character's ability to support the team in challenging battles?"
    };

    const response = await request.post(`${API_BASE_URL}/api/v1/ai-analysis/skills-and-mentors-recommendations`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || 'mock-key-for-testing'
      },
      data: justInTimeData
    });
    expect(response.ok(), `API error ${response.status()}: ${await response.text()}`).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('response');
    expect(data).toHaveProperty('metadata');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  // CORS from portfolio origin must succeed (browser context)
  test('CORS: portfolio origin can call API Gateway', async ({ page }) => {
    const portfolioBase = process.env.BASE_URL || process.env.PORTFOLIO_BASE_URL;
    if (!portfolioBase) {
      throw new Error('Portfolio BASE_URL not provided');
    }
    const apiBase = (process.env.API_BASE_URL || '').replace(/\/$/, '');
    if (!apiBase) {
      throw new Error('API_BASE_URL not provided');
    }

    // Avoid mixed content failures (https page -> http API) which browsers block by design
    const portfolioUrl = new URL(portfolioBase);
    const apiUrl = new URL(apiBase);
    test.skip(
      portfolioUrl.protocol === 'https:' && apiUrl.protocol !== 'https:',
      `Skipping CORS test due to mixed content (frontend is https, API is ${apiUrl.protocol})`
    );

    await page.goto(portfolioBase);
    const result = await page.evaluate(async ({ apiUrl }) => {
      try {
        // Avoid any custom headers to prevent CORS preflight
        const res = await fetch(`${apiUrl}/api/v1/ai-analysis/health`, { method: 'GET' });
        return { ok: res.ok, status: res.status, text: await res.text(), cors: res.type };
      } catch (error) {
        return { ok: false, status: 0, text: String(error), cors: 'error' };
      }
    }, { apiUrl: apiBase });

    expect(result.ok, `CORS/health failed ${result.status}: ${result.text}`).toBe(true);
  });
});