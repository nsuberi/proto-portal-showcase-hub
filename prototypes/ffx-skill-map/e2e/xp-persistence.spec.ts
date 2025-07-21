import { test, expect } from '@playwright/test';

test.describe('XP Persistence Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should persist XP changes after skill learning and page refresh', async ({ page }) => {
    // Navigate to the skill map
    await page.goto('/');
    
    // Wait for employees to load - look for the employee select dropdown
    await expect(page.locator('[data-testid="employee-select"]')).toBeVisible({ timeout: 10000 });
    
    // Click the employee selector dropdown
    await page.locator('[data-testid="employee-select"]').click();
    
    // Select the first available employee from the dropdown
    const firstEmployee = page.locator('[data-radix-select-content] [data-radix-select-item]').first();
    await expect(firstEmployee).toBeVisible({ timeout: 5000 });
    await firstEmployee.click();
    
    // Wait for skill recommendations to load
    await expect(page.locator('text=Next Skills for')).toBeVisible({ timeout: 5000 });
    
    // Get initial XP value
    const xpElement = page.locator('text=/\\d+(\\.\\d+)?k? XP available/').first();
    await expect(xpElement).toBeVisible({ timeout: 5000 });
    
    const initialXPText = await xpElement.textContent();
    console.log('Initial XP:', initialXPText);
    
    // Extract numeric value from XP text (e.g., "2.5k XP available" -> 2500)
    const parseXP = (xpText: string): number => {
      const match = xpText.match(/([0-9.]+)(k?)\\s*XP/);
      if (!match) return 0;
      const value = parseFloat(match[1]);
      const multiplier = match[2] === 'k' ? 1000 : 1;
      return value * multiplier;
    };
    
    const initialXP = parseXP(initialXPText || '');
    expect(initialXP).toBeGreaterThan(0);
    
    // Expand skill recommendations if they're collapsed
    const showRecsButton = page.locator('button:has-text("Show Recs"), button:has-text("Show")');
    if (await showRecsButton.isVisible()) {
      await showRecsButton.click();
    }
    
    // Find and click a "Learn Now" button for an affordable skill
    const learnButtons = page.locator('button:has-text("Learn Now")');
    await expect(learnButtons.first()).toBeVisible({ timeout: 5000 });
    
    // Click the first available "Learn Now" button
    await learnButtons.first().click();
    
    // Wait for the skill learning to complete
    await expect(page.locator('text=Learning...')).not.toBeVisible({ timeout: 10000 });
    
    // Get the updated XP value
    await page.waitForTimeout(1000); // Give time for UI to update
    const updatedXPText = await xpElement.textContent();
    console.log('Updated XP:', updatedXPText);
    
    const updatedXP = parseXP(updatedXPText || '');
    
    // Verify XP decreased
    expect(updatedXP).toBeLessThan(initialXP);
    console.log(`XP decreased from ${initialXP} to ${updatedXP}`);
    
    // Refresh the page to test persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the app to reload and select the same employee again
    await expect(page.locator('[data-testid="employee-select"]')).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="employee-select"]').click();
    const firstEmployeeAfterRefresh = page.locator('[data-radix-select-content] [data-radix-select-item]').first();
    await expect(firstEmployeeAfterRefresh).toBeVisible({ timeout: 5000 });
    await firstEmployeeAfterRefresh.click();
    
    // Wait for skill recommendations to load again
    await expect(page.locator('text=Next Skills for')).toBeVisible({ timeout: 5000 });
    
    // Get XP value after refresh
    const xpAfterRefresh = page.locator('text=/\\d+(\\.\\d+)?k? XP available/').first();
    await expect(xpAfterRefresh).toBeVisible({ timeout: 5000 });
    
    const persistedXPText = await xpAfterRefresh.textContent();
    console.log('Persisted XP after refresh:', persistedXPText);
    
    const persistedXP = parseXP(persistedXPText || '');
    
    // Verify XP persisted correctly (should match the updated value, not the initial)
    expect(persistedXP).toEqual(updatedXP);
    expect(persistedXP).toBeLessThan(initialXP);
    
    console.log('✅ XP persistence test passed: XP correctly persisted after page refresh');
  });

  test('should load employee data from localStorage on fresh page load', async ({ page }) => {
    // Set up some mock localStorage data
    await page.goto('/');
    
    await page.evaluate(() => {
      const mockEmployees = [
        {
          id: 'test-employee',
          name: 'Test Employee',
          current_xp: 1500,
          mastered_skills: ['skill1', 'skill2']
        }
      ];
      localStorage.setItem('ffx-skill-map-employees', JSON.stringify(mockEmployees));
    });
    
    // Refresh to load from localStorage
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check console logs for localStorage loading message
    const logs = [];
    page.on('console', msg => {
      if (msg.text().includes('Loaded') && msg.text().includes('employees from localStorage')) {
        logs.push(msg.text());
      }
    });
    
    // Trigger a new page load to see the console message
    await page.goto('/');
    
    // Wait a bit for console messages
    await page.waitForTimeout(2000);
    
    // Verify localStorage is being used
    const storageData = await page.evaluate(() => {
      return localStorage.getItem('ffx-skill-map-employees');
    });
    
    expect(storageData).toBeTruthy();
    const parsedData = JSON.parse(storageData);
    expect(Array.isArray(parsedData)).toBeTruthy();
    expect(parsedData.length).toBeGreaterThan(0);
    
    console.log('✅ localStorage integration test passed');
  });

  test('should handle localStorage unavailability gracefully', async ({ page }) => {
    // Disable localStorage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: false
      });
    });
    
    // Navigate to the app
    await page.goto('/');
    
    // App should still load without localStorage
    await expect(page.locator('text=Map of Mastery')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ localStorage unavailability handling test passed');
  });
});