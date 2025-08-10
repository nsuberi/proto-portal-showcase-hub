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
- **Important**: E2E tests must handle different base URLs between local dev and CI/production environments. The test checks if the baseURL already includes the prototype path and navigates accordingly

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

## API Integration Testing

### Claude API E2E Tests
Both prototypes now include comprehensive E2E tests that showcase Claude API integration:

#### FFX Skill Map API Tests
```bash
cd prototypes/ffx-skill-map
npm run test:e2e -- e2e/api-claude-integration.spec.ts
```

**Test Coverage:**
- API key validation and authentication
- Skill recommendation analysis with Claude
- Just-in-time learning recommendations
- Rate limiting and error handling
- Environment configuration validation

#### Home Lending Learning API Tests  
```bash
cd prototypes/home-lending-learning
npm run test:e2e -- e2e/api-claude-integration.spec.ts
```

**Test Coverage:**
- Home lending term assessment with Claude
- Different user response quality handling (poor, good, excellent)
- Multiple learning contexts and difficulty levels
- Input validation and length limits
- Assessment comprehension level accuracy

### Environment Configuration Testing

#### Local Development (.env file)
Create `shared/api/.env` based on `.env.example`:
```bash
CLAUDE_API_KEY=sk-ant-your-api-key-here
AWS_SECRETS_ENABLED=false
NODE_ENV=development
```

#### Production (AWS Secrets Manager)
```bash
AWS_SECRETS_ENABLED=true
CLAUDE_SECRET_NAME=prod/proto-portal/claude-api-key
AWS_REGION=us-east-1
NODE_ENV=production
```

#### Mock Mode (No API Key)
```bash
# Don't set CLAUDE_API_KEY
AWS_SECRETS_ENABLED=false
NODE_ENV=development
```

**Environment Tests:**
- API configuration validation
- CORS policy testing
- Rate limiting configuration
- Mock mode fallback verification

### Running Full Integration Tests
To run all API integration tests with the API server:

1. **Start the API server:**
   ```bash
   cd shared/api
   cp .env.example .env  # Add your CLAUDE_API_KEY
   npm run dev
   ```

2. **Run prototype E2E tests:**
   ```bash
   # FFX Skill Map
   cd prototypes/ffx-skill-map
   npm run test:e2e -- e2e/api-claude-integration.spec.ts
   
   # Home Lending Learning
   cd prototypes/home-lending-learning  
   npm run test:e2e -- e2e/api-claude-integration.spec.ts
   ```

**Note:** Without a valid Claude API key, tests will verify mock mode functionality. With a valid API key, tests will demonstrate actual Claude API integration.

## Test Types and Separation

### Unit Tests vs Integration Tests

**Unit Tests:**
- Test individual functions in isolation (e.g., `getApiUrl` function)
- Run as part of `npm test` and in CI/CD
- Do not require external services

**Integration Tests:**
- Test API endpoints and service communication
- Located in `*.integration.test.ts` files
- **Assume API server is already running** at `localhost:3003`
- Should be run separately from unit tests

### Running Integration Tests

**Prerequisites:**
1. Start the API server:
   ```bash
   cd shared/api
   npm run dev
   ```

2. Run integration tests separately:
   ```bash
   # Run specific integration tests
   npm test -- --testPathPattern="integration.test.ts"
   
   # Or run individual files
   npm test src/services/api.integration.test.ts
   ```

## CI Pipeline Recommendations
- Use `test:ci` for unit tests in CI/CD pipelines
- Integration tests should be run in separate staging environments where API server is available
- E2E tests with Playwright can test full user workflows
- Set up environment-specific API key management for full integration testing
