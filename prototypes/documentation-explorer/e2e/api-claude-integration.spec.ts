import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3003'

test.describe('Documentation Explorer Claude Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Close the instructions modal if it appears
    const closeButton = page.locator('button:has-text("Get Started")')
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  })

  test('should display the main search interface', async ({ page }) => {
    // Check for main elements
    await expect(page.locator('h1:has-text("Documentation Explorer")')).toBeVisible()
    await expect(page.locator('input[placeholder*="Ask a question"]')).toBeVisible()
    await expect(page.locator('button:has-text("Search")')).toBeVisible()
  })

  test('should show floating document titles', async ({ page }) => {
    // Check that at least one floating document is visible
    const floatingDocs = page.locator('.floating-text')
    await expect(floatingDocs.first()).toBeVisible()
    
    // Verify we have multiple documents
    const count = await floatingDocs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should open document modal when clicking floating title', async ({ page }) => {
    // Click on a floating document
    const floatingDoc = page.locator('.floating-text').first()
    await floatingDoc.click()
    
    // Check that modal opens
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('button:has-text("Copy")')).toBeVisible()
    
    // Close modal
    await page.locator('button[aria-label*="Close"]').click()
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('should return codebase link for API question', async ({ page }) => {
    // Type a question about the API
    const input = page.locator('input[placeholder*="Ask a question"]')
    await input.fill('Where is the Claude API integration?')
    
    // Click search
    await page.locator('button:has-text("Search")').click()
    
    // Wait for response
    await expect(page.locator('text=Relevant Code Location')).toBeVisible({ timeout: 10000 })
    
    // Check that a github link is shown
    const link = page.locator('a[href*="github.com"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', /claude-service/)
  })

  test('should return codebase link for design tokens question', async ({ page }) => {
    // Type a question about design tokens
    const input = page.locator('input[placeholder*="Ask a question"]')
    await input.fill('Show me the design tokens')
    
    // Click search
    await page.locator('button:has-text("Search")').click()
    
    // Wait for response
    await expect(page.locator('text=Relevant Code Location')).toBeVisible({ timeout: 10000 })
    
    // Check that a github link is shown
    const link = page.locator('a[href*="github.com"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', /design-tokens/)
  })

  test('should handle Enter key for search', async ({ page }) => {
    // Type a question
    const input = page.locator('input[placeholder*="Ask a question"]')
    await input.fill('Where is the portfolio component?')
    
    // Press Enter
    await input.press('Enter')
    
    // Wait for response
    await expect(page.locator('text=Relevant Code Location')).toBeVisible({ timeout: 10000 })
    
    // Check that a github link is shown
    const link = page.locator('a[href*="github.com"]')
    await expect(link).toBeVisible()
  })

  test('should copy document content to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    
    // Click on a floating document
    const floatingDoc = page.locator('.floating-text').first()
    await floatingDoc.click()
    
    // Click copy button
    await page.locator('button:has-text("Copy")').click()
    
    // Check for success toast
    await expect(page.locator('text=Copied to clipboard')).toBeVisible()
  })

  test('should copy link to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    
    // Ask a question first
    const input = page.locator('input[placeholder*="Ask a question"]')
    await input.fill('Where is the API?')
    await page.locator('button:has-text("Search")').click()
    
    // Wait for response
    await expect(page.locator('text=Relevant Code Location')).toBeVisible({ timeout: 10000 })
    
    // Click copy button for the link
    await page.locator('button:has([data-lucide="copy"])').click()
    
    // Check for success toast
    await expect(page.locator('text=Copied to clipboard')).toBeVisible()
  })

  test('should show instructions modal on first visit', async ({ page, context }) => {
    // Clear local storage to simulate first visit
    await context.clearCookies()
    await page.evaluate(() => localStorage.clear())
    
    // Navigate to the page
    await page.goto(BASE_URL)
    
    // Check that instructions modal is visible
    await expect(page.locator('text=Welcome to Documentation Explorer')).toBeVisible()
    await expect(page.locator('text=What is this?')).toBeVisible()
    
    // Close the modal
    await page.locator('button:has-text("Get Started")').click()
    await expect(page.locator('text=Welcome to Documentation Explorer')).not.toBeVisible()
  })

  test('should reopen instructions modal via help button', async ({ page }) => {
    // Click the How to Use button
    await page.locator('button:has-text("How to Use"), button:has-text("Help")').click()
    
    // Check that instructions modal is visible
    await expect(page.locator('text=Welcome to Documentation Explorer')).toBeVisible()
    
    // Close the modal
    await page.locator('button:has-text("Get Started")').click()
    await expect(page.locator('text=Welcome to Documentation Explorer')).not.toBeVisible()
  })
})

test.describe('Documentation Explorer Fallback Behavior', () => {
  test('should provide default link when question is unclear', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Close instructions if visible
    const closeButton = page.locator('button:has-text("Get Started")')
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
    
    // Ask an unclear question
    const input = page.locator('input[placeholder*="Ask a question"]')
    await input.fill('Something random that does not match anything')
    await page.locator('button:has-text("Search")').click()
    
    // Should still return a link (the default one)
    await expect(page.locator('text=Relevant Code Location')).toBeVisible({ timeout: 10000 })
    const link = page.locator('a[href*="github.com"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', /proto-portal-showcase-hub/)
  })
})