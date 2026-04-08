# Agent Instructions: FFX Skill Map

## What This Prototype Demonstrates

A graph-based skill development system inspired by Final Fantasy X's Sphere Grid. It visualizes 48 skills across 5 categories (Combat, Magic, Support, Special, Advanced) as an interactive node graph, with prerequisite paths, XP-based progression, and AI-powered skill recommendations.

**Why it matters for a portfolio**: Shows ability to work with graph data structures, interactive visualization libraries (Sigma.js/Graphology), and the architectural pattern of mocking a database layer (Neo4j) in-browser with localStorage persistence while keeping the real database integration path clean.

## Architecture Decisions

- **Mock-first data layer**: The app uses `sharedEnhancedService` (localStorage-backed mock) by default. Neo4j is optional and only needed if you want real graph database operations. This was a deliberate choice so the prototype works without Docker.
- **Single-page graph**: The app routes everything to `SkillMap` — there's no multi-page navigation. Dashboard, Employees, Quiz, and Recommendations were removed in favor of focusing the demo on the interactive graph.
- **XP system**: Skills have levels 1-6 with prerequisite chains. The quiz uses 10 behavioral questions with a confidence scoring algorithm that maps answers to specific skills.
- **Design tokens**: Uses `presetOverrides.ffxSkillMap` for a light theme with custom chart colors defined in `shared/design-tokens/tokens/components/skill-categories.ts`.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Entry point — connects to shared mock service, single route to SkillMap |
| `src/pages/SkillMap.tsx` | Main interactive graph component (Sigma.js + Graphology) |
| `src/services/sharedService.ts` | Enhanced mock data service (localStorage persistence) |
| `src/services/xp-logic.ts` | XP calculation, level thresholds, validation |
| `src/data/` | Static quiz questions and skill definitions |
| `docker-compose.yml` | Neo4j 5.15 container (optional) |
| `scripts/seed-database.js` | Seeds Neo4j with skill graph data |

## Development

```bash
# Start dev server (port 3001)
yarn dev:ffx                # from monorepo root
npm run dev                 # from this directory

# Tests
npm test                    # Unit tests (Jest)
npm run test:e2e            # Playwright E2E
npm run test:integration    # Requires API server on port 3003

# Build
npm run build
```

## Database (Optional)

```bash
npm run docker:up           # Start Neo4j
npm run db:seed             # Seed skill graph
npm run db:reset            # Tear down + reseed
npm run docker:down         # Stop Neo4j
```

Neo4j: `bolt://localhost:7687`, credentials `neo4j/testpassword`, browser at `http://localhost:7474`

## Test Suites

| Suite | Location | What It Tests |
|-------|----------|---------------|
| Unit (Jest) | `src/services/xp-logic.test.ts` | XP calculation, level validation |
| Unit (Jest) | `src/services/enhancedMockData.test.ts` | Mock data generation correctness |
| Unit (Jest) | `src/pages/SkillMap.utils.test.ts` | Graph layout utilities |
| E2E (Playwright) | `e2e/xp-persistence.spec.ts` | localStorage XP save/load |
| E2E (Playwright) | `e2e/api-claude-integration.spec.ts` | Claude API recommendation flow |
| Integration | `*.integration.test.ts` | API endpoints (needs server on 3003) |

## Gotchas

- The Sigma.js graph can be CPU-intensive. If you're adding nodes or changing layout, test on lower-end hardware.
- `sharedEnhancedService` is a singleton — if tests modify its state, they affect each other unless you reset localStorage between tests.
- The vite base path is `/prototypes/ffx-skill-map/` — all asset references must be relative or use the base path.

## Deployment

Built and deployed as part of the monorepo: `yarn build:ffx` outputs to `dist/prototypes/ffx-skill-map/`.

Production URL: `https://portfolio.cookinupideas.com/prototypes/ffx-skill-map/`

## Related

- [Root AGENTS.md](../../AGENTS.md) — Monorepo overview
- [Shared Design Tokens](../../shared/design-tokens/) — Theme system
- [Shared API](../../shared/api/) — Claude API proxy
