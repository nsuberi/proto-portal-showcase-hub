# Testing Guide

## Overview

This repository uses a pragmatic, app-local testing approach. Core business logic is unit-tested where it matters, and UI is validated through manual and E2E-style checks when appropriate.

## Tools (planned)
- Vitest: unit/integration test runner
- React Testing Library: component behavior
- jsdom: browser-like DOM environment

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

## Running tests (suggested scripts)
Add to your `package.json` (root or per app):

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage"
  }
}
```

Run tests:
```bash
npm test
npm run test:watch
```

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
- Skipped (historical): deep component tests had ES module transform issues; prefer Vitest/Playwright if reintroducing
- Focus areas covered:
  - XP calculation and validation
  - localStorage persistence
  - Recommendation logic

### Home Lending Learning
- Add tests alongside components/services as they evolve. Follow the same Vitest setup and token checks described above.

## CI suggestions
- Use `test:ci` in your pipeline for coverage
- Consider adding Playwright for E2E flows across the portfolio and prototypes
