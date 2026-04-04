## Project Overview

A portfolio monorepo showcasing interactive prototypes deployed to AWS. Each prototype demonstrates a different approach to learning, visualization, or AI-assisted interaction. The repo also contains the AI Evals in Context application (Flask/ECS) under `apps/`.

**Live site**: https://portfolio.cookinupideas.com

## Development Notes

- The ffx-skill-map app is running on port 3001 already, you don't need to start the server to test
- If you try to test and the app does not appear up, prompt me to run `./scripts/dev-start.sh` (or `yarn dev:all` for Node services only) in another terminal
- Use `yarn` (not `npm`) for the root monorepo and React prototypes — Yarn 4.9+ via Corepack
- Use `python3` (not `python`) for the ai-evals Flask app under `apps/`
- The dev proxy (`yarn dev:proxy`, port 8082) routes between all prototypes using the same base paths as production

## Design Guidelines

- Whenever adding widgets to sites, always add responsive elements and ensure widgets don't exceed 100vw
- Use the shared design tokens from `shared/design-tokens/` for colors, typography, and spacing
- Prototype-specific overrides go through `createDesignTokens(presetOverrides.{name})`

### Mobile-First Responsive Patterns

Design for mobile first (320px minimum), then enhance for larger screens. Key patterns:

```jsx
// Containers: full-width on mobile, constrained on desktop
<div className="w-full max-w-none px-4 mx-auto sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8">

// Button groups: stack vertically on mobile
<div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 w-full sm:w-auto">
  <Button className="w-full sm:w-auto">...</Button>
</div>

// Text/icons: responsive sizing
<span className="text-sm sm:text-base lg:text-lg">
<Icon className="h-4 w-4 sm:h-5 sm:w-5" />

// Section spacing
<section className="py-12 px-4 sm:py-16 sm:px-6 lg:py-20 lg:px-8">
```

The shared design tokens provide utility classes: `px-mobile`, `py-mobile`, `container-mobile`, `btn-group-mobile`, `btn-mobile`, `flex-mobile`. Use these instead of writing responsive patterns from scratch.

**Checklist for new components:**
- No element exceeds 100vw
- Button groups stack on mobile (`flex-col` -> `sm:flex-row`)
- Touch targets are at least 44px
- Text uses responsive sizing (`text-sm sm:text-base`)

## Port Reference

| Service | Port | Base Path (prod) |
|---------|------|-------------------|
| Main Portfolio | 8080 | `/` |
| FFX Skill Map | 3001 | `/prototypes/ffx-skill-map/` |
| Home Lending | 3002 | `/prototypes/home-lending-learning/` |
| Documentation Explorer | 3005 | `/prototypes/documentation-explorer/` |
| Learning Path | 3006 | `/prototypes/learning-path/` |
| API Server | 3004 | `/api/v1/` |
| Dev Proxy | 8082 | (routes all of the above) |
| Neo4j Browser | 7474 | - |
| Neo4j Bolt | 7687 | - |

## Agent Workflow: Breadboarding

This project uses a breadboarding/affordances-first approach for feature shaping. The skill is defined in `.claude/skills/breadboarding/SKILL.md`.

**Before building a new feature:**
1. Shape it with breadboarding — identify places, affordances (U for UI, N for code), and wiring
2. Produce an implementation plan with file manifest, function signatures, and acceptance criteria
3. Execute the plan: models -> functions -> components -> wiring -> tests

## Git Commits

When work is complete and the user asks to commit:

- Write clear, informative commit messages that explain *why* the change was made
- Use conventional-style prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Keep the first line under 72 characters; add detail in the body if needed
- Stage specific files rather than using `git add -A` to avoid committing secrets or unrelated changes
- **Document architectural changes in the commit body.** When a commit introduces structural changes (new modules, changed data flow, new routes/endpoints), include an `Architecture:` section:
  ```
  feat: add real-time skill graph updates

  Replace polling with WebSocket push for skill node changes.

  Architecture:
  - New hook: src/hooks/useSkillUpdates.ts (WebSocket subscription)
  - Data flow: Neo4j change stream -> API -> WebSocket -> React state
  - Modified: SkillMap.tsx now subscribes to live updates
  ```

## Linting

```bash
# Full lint (ESLint + design tokens + Python) — runs in CI
yarn lint

# Individual lint targets
yarn lint:code              # ESLint only
yarn lint:tokens            # Design token compliance (summary)
yarn lint:tokens --verbose  # Show all Tailwind class warnings
yarn lint:python            # Python: black --check + flake8 + mypy
yarn lint:python --fix      # Auto-format Python with black
```

**Pre-commit hook**: Install with `./scripts/setup-hooks.sh` — runs ESLint, design token checks, and Python linting on staged files before each commit.

### Design Token Lint

**Blocking:** No hardcoded hex (`'#FF0000'`) or `rgb()/rgba()` in TS/TSX. Every prototype CSS must import `tokens.css` or a `theme.css` override.

**Warnings (non-blocking):** Non-semantic Tailwind classes (`bg-gray-500`) — prefer `bg-muted`, `text-foreground`.

**Escape hatches:** Per-line `// design-token-lint-ignore` or per-file (add the comment anywhere). Sigma.js needs hex — use `hslToHex()` with token HSL values.

### Python Lint

**Tools:** `black` (formatter) + `flake8` (linter) + `mypy` (type checker, non-blocking)
**Config:** `apps/ai-evals-in-context/ai-testing-resource/pyproject.toml`
**Blocking:** `black --check` failures and flake8 F811/F821/E999 (redefined names, undefined names, syntax errors)
**Warnings:** Unused imports (F401), import order (E402), spacing (E302/E305)

### Dark Mode Policy

- **Default**: All prototypes inherit dark mode support via `tokens.css` (`.dark` class)
- **Light-only prototypes** (e.g. ffx-skill-map): Override all CSS variables in a `theme.css` that sets light values on `:root`
- Do not use CSS hacks to block `.dark` — set the variables explicitly

## Testing

```bash
# Unit tests for prototypes
yarn workspace @proto-portal/ffx-skill-map test
yarn workspace @proto-portal/home-lending-learning test
yarn workspace @proto-portal/documentation-explorer test

# E2E tests (Playwright)
cd prototypes/ffx-skill-map && npm run test:e2e
cd prototypes/home-lending-learning && npm run test:e2e

# Integration tests (requires API server on port 3004)
cd shared/api && npm run dev  # start API first
cd prototypes/ffx-skill-map && npm run test:integration

# AI Evals tests (from apps/ai-evals-in-context/ai-testing-resource/)
source .venv/bin/activate
python3 -m pytest tests/unit/ -v
python3 -m pytest tests/e2e/ -v
```

## Building & Deploying

```bash
# Build everything
./scripts/build.sh

# Full deployment (Terraform + build + S3 upload + CDN invalidation)
./scripts/deploy.sh

# Infrastructure only
./scripts/deploy-infrastructure.sh

# Site content only (assumes infrastructure exists)
./scripts/deploy-site.sh
```

## Agent Memory & Skills Explorer Sync

The Agent Memory & Skills Explorer (`prototypes/documentation-explorer/`) visualizes the agent configuration layer. Its data lives in `prototypes/documentation-explorer/src/data/documentsData.ts`. **Keep this file in sync whenever the configuration layer changes:**

| What changed | Action in documentsData.ts |
|---|---|
| New or updated `.claude/skills/*.SKILL.md` | Add or update the `skill` category entry |
| New MCP server in `shared/mcp-servers/` | Add a `tool` category entry with its tools, resources, and prompts |
| Updated MCP server capabilities | Update the existing `tool` entry |
| New significant memory in `~/.claude/projects/.../memory/` | Add a `memory` entry (snapshot of the content) |

Item categories map to colors: amber = memory, violet = skill, blue = MCP tool, teal = concept.

## Continuous Improvement

When you discover something useful about this project (gotchas, patterns, architecture decisions, debugging tips), add it to this CLAUDE.md so future sessions benefit. Keep notes concise and in the most relevant section.
