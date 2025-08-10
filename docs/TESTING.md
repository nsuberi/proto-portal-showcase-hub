# Testing Guide

## Overview

This repository uses a pragmatic, app-local testing approach. Core business logic is unit-tested where it matters, and UI is validated through manual and E2E-style checks when appropriate.

## Tools
- Jest: unit/integration tests in workspaces
- React Testing Library: component behavior
- jsdom: browser-like DOM environment
- Playwright: optional E2E for the FFX prototype

## Test Types

### 1) Unit tests
- Scope: pure logic, utilities, services
- Location: per app, e.g. `src/**/*.test.ts(x)`

### 2) Integration tests
- Scope: component interactions within a page
- Location: per app, e.g. `src/components/*.test.tsx` or `src/pages/*.test.tsx`

### 3) Visual/UX checks
- Validate token-driven classes (colors, gradients, shadows, transitions)
- Validate responsive utilities (no overflow > 100vw)

## Running tests

### Unit tests (FFX prototype)
```bash
cd prototypes/ffx-skill-map
npm install
npm test
```

**Note:** You may see ts-jest warnings about `esModuleInterop`. These warnings don't affect test execution and all tests should pass.

### Integration/E2E tests (FFX prototype)
These tests use Playwright to drive the built dev server.

Run locally:
```bash
cd prototypes/ffx-skill-map
npm run test:e2e
```

**Prerequisites:**
- Node.js 18.19 or higher is required for Playwright E2E tests
- If you get a Node version error, you can use nvm to switch versions:
  ```bash
  nvm use v20.16.0  # or any version >= 18.19
  # Or use nvm exec to run with a specific version:
  nvm exec v20.16.0 npm run test:e2e
  ```

Notes:
- The Playwright config will start the dev server on port 3001 if `BASE_URL` is not set.
- If you see a port in use, start the app in another terminal: `npm run dev` and rerun the tests.
- The E2E test performs a smoke test to ensure the app loads and renders the main heading
- All tests should pass across Chromium, Firefox, and WebKit browsers
- **Best Practice**: Use role-based selectors (e.g., `getByRole`) instead of text selectors for elements with gradient or styled text, as they're more reliable across different environments

## Design token checks
- Use Tailwind utilities backed by `@proto-portal/design-tokens`
- Verify classes like `bg-primary`, `text-foreground`, `hover:shadow-glow`, `transition-smooth`
- Confirm responsive utilities avoid overflow (100vw max)

## Prototype-specific notes

### FFX Skill Map
- Working suites (service/logic):
  - `src/services/xp-logic.test.ts`
  - `src/services/enhancedMockData.test.ts`
  - `src/pages/SkillMap.utils.test.ts`
- Integration/E2E (Playwright): `e2e/xp-persistence.spec.ts`
- Focus areas covered:
  - XP calculation and validation
  - localStorage persistence
  - Recommendation logic and UI persistence (E2E)

### Home Lending Learning
- Currently no tests implemented
- Add tests alongside components/services as they evolve
- Run tests with: `cd prototypes/home-lending-learning && npm test`
- Follow the same Jest setup and token checks described above

## CI suggestions
- Use `test:ci` in your pipeline for coverage
- Consider adding Playwright for E2E flows across the portfolio and prototypes
