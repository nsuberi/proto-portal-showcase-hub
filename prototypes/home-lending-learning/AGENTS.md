# Agent Instructions: Home Lending Learning Platform

## What This Prototype Demonstrates

An interactive educational platform for home lending fundamentals, featuring a process flow visualization, a 50+ term glossary, 20+ knowledge testing cards with adaptive difficulty, and AI-powered assessments via the Claude API.

**Why it matters for a portfolio**: Shows ability to structure complex domain knowledge (Fannie Mae/Freddie Mac lending standards) into an interactive learning experience with progress tracking, adaptive difficulty, and AI-assisted assessment — a pattern applicable to any domain-specific training tool.

## Architecture Decisions

- **Content-driven**: The educational content (flow map nodes, glossary terms, study cards) is defined as structured data in `src/` rather than a database. This keeps the prototype self-contained and fast to iterate on.
- **AI assessment integration**: Claude API calls go through the shared API proxy (`shared/api/` on port 3004) for security. The API handles rate limiting and CORS. Assessments evaluate user responses for accuracy against lending standards.
- **Progress tracking**: User progress is tracked client-side with persistent state. Cards adapt difficulty based on performance (beginner -> intermediate -> advanced).
- **Cross-referencing**: Glossary terms, flow map nodes, and study cards are cross-linked — clicking a term in a study card can navigate to its glossary entry.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main application with routes and state management |
| `src/pages/` | Page components for each learning mode |
| `src/components/` | Reusable UI (cards, flow map, glossary browser) |
| `src/services/` | API service layer for Claude assessments |

## Development

```bash
# Start dev server (port 3002)
yarn dev:home-lending       # from monorepo root
npm run dev                 # from this directory

# For AI features, also start the API server:
cd ../../shared/api && npm run dev    # port 3004

# Tests
npm test                    # Unit tests (Jest)
npm run test:e2e            # Playwright E2E
npm run test:integration    # Requires API server on port 3003

# Build
npm run build
```

## Test Suites

| Suite | Location | What It Tests |
|-------|----------|---------------|
| Unit (Jest) | `src/` | Component and service tests |
| E2E (Playwright) | `e2e/api-claude-integration.spec.ts` | Claude assessment flow, difficulty levels |
| Integration | `*.integration.test.ts` | API endpoint testing (needs server on 3003) |

## Gotchas

- The Claude API integration requires the shared API server running. Without it, AI assessment features won't work but the rest of the app functions fine.
- Educational content is based on 2025 Fannie Mae/Freddie Mac documentation — if updating content, verify against current GSE guidelines.
- The vite base path is `/prototypes/home-lending-learning/` — all routing and asset references use this prefix.

## Deployment

Built and deployed as part of the monorepo: `yarn build:home-lending` outputs to `dist/prototypes/home-lending-learning/`.

Production URL: `https://portfolio.cookinupideas.com/prototypes/home-lending-learning/`

## Related

- [Root AGENTS.md](../../AGENTS.md) — Monorepo overview
- [Shared API](../../shared/api/) — Claude API proxy (required for AI features)
