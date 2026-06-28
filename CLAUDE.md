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
| AI Builders (Vite) | 3008 | `/prototypes/ai-builders/` |
| Research Workspace | 3009 | `/prototypes/research-workspace/` |
| AI Visualizer | 3010 | `/prototypes/ai-integration-visualizer/` |
| Island Algorithms | 3012 | `/prototypes/island-algorithms-visualizer/` |
| AI Evals (Flask) | 5000 | `/prototypes/ai-evals/` |
| Neo4j | 7474/7687 | - |

## Design Rules

**Two-tier model:** structure is shared, style is per-prototype.

- **Structural layout — always share** via `@proto-portal/layout-primitives` (`AppShell`, `ScrollViewport`, `ContextPanel`, `SidebarRail`, `BottomSheet`). These encode the hard-to-get-right patterns (fixed sidebar + independently-scrolling viewport, fixed header + scrolling body, etc.) and ship no color/font opinions.
- **Before building a bespoke shell**, pause and discuss with the user: can this layout be expressed with existing primitives styled differently? If it's a genuinely new structural pattern that another prototype would plausibly want, discuss contributing it back to `@proto-portal/layout-primitives`. Default to keeping it prototype-local until there's a second consumer. See `.claude/skills/new-prototype/SKILL.md` → Phase 3b-i for the conversation checklist.
- **Visual tokens — own per prototype.** Each prototype defines its own `src/styles/tokens.css` with CSS custom properties. No required shared design system.
- **Opt-in baselines:** `@proto-portal/design-tokens` (shared tokens + Tailwind base config) and `@proto-portal/ui-components` (shared buttons/cards/etc.) remain available — use when a prototype wants the portfolio baseline look.
- **Still banned** (lint-enforced): hardcoded hex/rgb in TS/TSX, non-semantic Tailwind color classes (`bg-gray-500`, `text-blue-600`). Define colors as CSS custom properties in your prototype's tokens file.
- Nothing exceeds 100vw. Mobile-first (320px min).
- Button groups: `flex-col` on mobile → `sm:flex-row`. Touch targets ≥ 44px, responsive text sizing (`text-sm sm:text-base`).
- Dark mode: define a `.dark` class in your prototype's tokens file that overrides the custom properties (the shared `tokens.css` does this for prototypes that opt in).

## Linting

```bash
yarn lint                   # Full (ESLint + tokens + Python) — runs in CI
yarn lint:code              # ESLint
yarn lint:tokens            # Design token compliance
yarn lint:python            # black --check + flake8 + mypy
yarn lint:python --fix      # Auto-format with black
```

Pre-commit hook: `./scripts/setup-hooks.sh`

**Blocking:** No hardcoded hex/rgb in TS/TSX. Every prototype must define tokens — either a local `tokens.css` / `theme.css` with CSS custom properties, or import the shared `@proto-portal/design-tokens/css/tokens.css`.
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

**IAM Role:** Local deploys assume the `terraform-cooking-up-ideas` role via a named AWS CLI profile. The CLI assumes the role automatically on every call — **credentials are never printed to stdout, so they never land in shell history or agent transcripts.**

One-time setup (your `nsuberi` IAM user keys live only in `~/.aws/credentials` under the `default` profile; the secret value is never typed on the command line):
```bash
aws configure                        # enter the nsuberi access key + secret ONCE; stored in ~/.aws/credentials
aws configure set role_arn       arn:aws:iam::671388079324:role/terraform-cooking-up-ideas --profile deploy
aws configure set source_profile default      --profile deploy
aws configure set region         us-east-1     --profile deploy
```

Per session — just select the profile, then run any `aws`/`terraform` command. No secrets in output:
```bash
export AWS_PROFILE=deploy
aws sts get-caller-identity          # verifies; the CLI assumes the role under the hood
```

> ⚠️ **NEVER** use `eval $(aws sts assume-role ... | python3 -c "print('export AWS_SECRET_ACCESS_KEY=...')")` or otherwise echo/`export` raw credential values — that writes the live secret into the transcript. `AWS_PROFILE` also fixes the "creds don't persist between shells" problem, since the role is re-assumed automatically on each invocation. A PreToolUse guard hook (`.claude/hooks/guard-secrets.sh`) blocks credential-leaking commands.

**ARM64:** ECS uses Graviton. Do NOT add `--platform linux/amd64` to Docker builds. CI uses ARM64 runners.

## Git Commits

- Conventional prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Stage specific files, not `git add -A`
- Include `Architecture:` section in commit body for structural changes (new modules, routes, data flow)

## Feature Shaping

Use breadboarding before building new features. Skill: `.claude/skills/breadboarding/SKILL.md`

## Doc Explorer Sync

Keep `prototypes/documentation-explorer/src/data/documentsData.ts` in sync when changing skills, MCP servers, or significant memories. Categories: amber=memory, violet=skill, blue=MCP tool, teal=concept.
