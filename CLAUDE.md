## Project Overview

Portfolio monorepo: interactive prototypes (React/Vite) + AI Evals app (Flask/ECS) under `apps/`. Live at https://portfolio.cookinupideas.com

## Development

- Use `yarn` (not npm) — Yarn 4.9+ via Corepack
- Use `python3` (not python) for the ai-evals Flask app
- ffx-skill-map runs on port 3001 already; if any app isn't up, prompt me to run `./scripts/dev-start.sh`
- Dev proxy (`yarn dev:proxy`, port 8082) routes all prototypes using production base paths

## Ports

| Service | Port | Prod Path |
|---------|------|-----------|
| Portfolio | 8080 | `/` |
| FFX Skill Map | 3001 | `/prototypes/ffx-skill-map/` |
| Home Lending | 3002 | `/prototypes/home-lending-learning/` |
| Doc Explorer | 3005 | `/prototypes/documentation-explorer/` |
| Learning Path | 3006 | `/prototypes/learning-path/` |
| API Server | 3004 | `/api/v1/` |
| Dev Proxy | 8082 | (routes all) |
| Code Dojo (Flask) | 5002 | `/code-dojo/` |
| Code Dojo (Vite) | 3007 | `/code-dojo/` |
| AI Builders (Vite) | 3008 | `/ai-builders/` |
| Neo4j | 7474/7687 | - |

## Design Rules

- Nothing exceeds 100vw. Mobile-first (320px min).
- Use shared design tokens from `shared/design-tokens/` — not hardcoded colors
- Prototype overrides: `createDesignTokens(presetOverrides.{name})`
- Utility classes available: `px-mobile`, `py-mobile`, `container-mobile`, `btn-group-mobile`, `btn-mobile`, `flex-mobile`
- Button groups: `flex-col` on mobile -> `sm:flex-row`
- Touch targets >= 44px, responsive text sizing (`text-sm sm:text-base`)
- Dark mode via `tokens.css` (`.dark` class). Light-only prototypes override CSS vars in `theme.css` on `:root`

## Linting

```bash
yarn lint                   # Full (ESLint + tokens + Python) — runs in CI
yarn lint:code              # ESLint
yarn lint:tokens            # Design token compliance
yarn lint:python            # black --check + flake8 + mypy
yarn lint:python --fix      # Auto-format with black
```

Pre-commit hook: `./scripts/setup-hooks.sh`

**Blocking:** No hardcoded hex/rgb in TS/TSX. Every prototype CSS must import `tokens.css` or `theme.css`.
**Escape hatch:** `// design-token-lint-ignore` per-line or per-file. For Sigma.js hex, use `hslToHex()`.

## Testing

```bash
yarn workspace @proto-portal/ffx-skill-map test          # Unit
yarn workspace @proto-portal/home-lending-learning test
yarn workspace @proto-portal/documentation-explorer test
cd prototypes/ffx-skill-map && npm run test:e2e           # E2E (Playwright)
cd prototypes/home-lending-learning && npm run test:e2e
```

AI Evals tests: see `apps/ai-evals-in-context/.claude/CLAUDE.md`

## Build & Deploy

```bash
./scripts/build.sh              # Build all
./scripts/deploy.sh             # Full deploy (Terraform + build + S3 + CDN invalidation)
./scripts/deploy-infrastructure.sh
./scripts/deploy-site.sh        # Site content only
```

**ARM64:** ECS uses Graviton. Do NOT add `--platform linux/amd64` to Docker builds. CI uses ARM64 runners.

## Git Commits

- Conventional prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Stage specific files, not `git add -A`
- Include `Architecture:` section in commit body for structural changes (new modules, routes, data flow)

## Feature Shaping

Use breadboarding before building new features. Skill: `.claude/skills/breadboarding/SKILL.md`

## Doc Explorer Sync

Keep `prototypes/documentation-explorer/src/data/documentsData.ts` in sync when changing skills, MCP servers, or significant memories. Categories: amber=memory, violet=skill, blue=MCP tool, teal=concept.
