# Agent Instructions: Proto Portal Showcase Hub

## What This Is

A portfolio monorepo demonstrating how to build, test, and deploy multiple interactive prototypes under a unified infrastructure. Each prototype explores a different approach to learning technology — from graph-based skill visualization to AI-powered documentation search to geospatial recipe exploration.

The monorepo also hosts the **AI Evals in Context** application (a Flask/ECS app teaching AI evaluation in the testing pyramid) under `apps/ai-evals-in-context/`.

**Live**: https://portfolio.cookinupideas.com

## Architecture

```
proto-portal-showcase-hub/
├── src/                              # Main portfolio landing page (React/Vite)
├── prototypes/
│   ├── ffx-skill-map/                # Graph-based skill development (Sigma.js, Neo4j)
│   ├── home-lending-learning/        # AI-powered mortgage education (Claude API)
│   ├── documentation-explorer/       # Semantic doc search with floating cards (Framer Motion)
│   └── learning-path/                # Geospatial recipe explorer (hex grids, country shapes)
├── apps/
│   └── ai-evals-in-context/          # Flask app: AI testing pyramid (ECS Fargate)
├── shared/
│   ├── design-tokens/                # Shared UI design system with theme overrides
│   └── api/                          # Express API proxy (Claude, security, rate limiting)
├── terraform/                        # AWS IaC: S3, CloudFront, Lambda, API Gateway
│   └── modules/                      # Reusable Terraform modules
├── scripts/                          # Build, deploy, and dev proxy scripts
└── .github/workflows/                # CI/CD: test -> deploy -> integration tests
```

## How It All Fits Together

**Frontend prototypes** are React/Vite SPAs built to `dist/prototypes/{name}/` and served from S3 via CloudFront. Each has a `base` path in its vite.config matching the production URL structure.

**The shared API** (`shared/api/`) is an Express server that proxies Claude API calls with security (Helmet, CORS, rate limiting) and deploys as a Lambda function behind API Gateway.

**The AI Evals app** is a separate Flask application deployed to ECS Fargate at `/ai-evals/` via CloudFront origin routing.

**Design tokens** provide consistent theming across prototypes. Each prototype can override the base tokens (e.g., FFX uses `presetOverrides.ffxSkillMap` for a light theme).

## Quick Commands

```bash
# Install dependencies (Yarn workspaces)
yarn install --immutable

# Start everything
yarn dev:all

# Individual prototypes
yarn dev                              # Main portfolio (port 8080)
yarn dev:ffx                          # FFX Skill Map (port 3001)
yarn dev:home-lending                 # Home Lending (port 3002)
yarn dev:documentation-explorer       # Docs Explorer (port 3005)
yarn dev:learning-path                # Learning Path (port 3006)
cd shared/api && npm run dev          # API server (port 3004)
yarn dev:proxy                        # Dev proxy (port 8082) — unified routing

# Testing
yarn workspace @proto-portal/ffx-skill-map test
yarn workspace @proto-portal/home-lending-learning test
yarn workspace @proto-portal/documentation-explorer test

# Build & deploy
./scripts/build.sh                    # Build all
./scripts/deploy.sh                   # Full deployment
./scripts/deploy-infrastructure.sh    # Terraform only
./scripts/deploy-site.sh              # S3 + CDN invalidation only
```

## Port Reference

| Service | Port | Production Base Path |
|---------|------|----------------------|
| Main Portfolio | 8080 | `/` |
| FFX Skill Map | 3001 | `/prototypes/ffx-skill-map/` |
| Home Lending | 3002 | `/prototypes/home-lending-learning/` |
| Documentation Explorer | 3005 | `/prototypes/documentation-explorer/` |
| Learning Path | 3006 | `/prototypes/learning-path/` |
| API Server | 3004 | `/api/v1/` |
| Dev Proxy | 8082 | Routes all of the above |
| AI Evals (Flask) | 5001 | `/ai-evals/` |
| Neo4j Browser | 7474 | - |
| Neo4j Bolt | 7687 | - |

## CI/CD Pipeline

GitHub Actions (`.github/workflows/deploy.yml`) runs on push to `main`:

1. **Test** — Unit tests for all prototypes on Node 20
2. **Deploy** — Terraform apply, build all apps, S3 sync, CDN invalidation
3. **Integration Tests** — Playwright E2E against production URLs

### Required Secrets

| Secret | Purpose |
|--------|---------|
| `CLAUDE_API_KEY` | AI features in prototypes |
| `JWT_SECRET` | API authentication |
| `API_KEY_SALT` | API key hashing |
| `API_GATEWAY_API_KEY` | API Gateway access |
| `ANTHROPIC_API_KEY` | AI Evals app |

### Required Variables

| Variable | Default |
|----------|---------|
| `BUCKET_NAME` | - |
| `AWS_REGION` | `us-east-1` |
| `ENVIRONMENT` | `production` |

## Terraform Infrastructure

See `terraform/AGENTS.md` for detailed infrastructure guidance.

Key resources: S3 (static hosting), CloudFront (CDN + SPA routing), Lambda (API), API Gateway, Route53 (DNS), Secrets Manager.

State stored in S3 with DynamoDB locking.

## Database (FFX Prototype)

```bash
yarn docker:up                        # Start Neo4j
cd prototypes/ffx-skill-map && yarn db:seed    # Seed graph data
yarn docker:down                      # Stop Neo4j
```

Neo4j credentials: `neo4j/testpassword` at `bolt://localhost:7687`

## Environment Configuration

### Local Development

Create `shared/api/.env`:
```bash
CLAUDE_API_KEY=sk-ant-your-api-key-here
AWS_SECRETS_ENABLED=false
NODE_ENV=development
```

### Production

Secrets stored in AWS Secrets Manager, retrieved by Lambda at runtime.

## Agent Methodology

This project uses two Claude skills for structured work:

### Breadboarding (Feature Shaping)
Skill: `.claude/skills/breadboarding/SKILL.md`

Before building a non-trivial feature:
1. Shape it — identify places, affordances (U for UI, N for code), and wiring
2. Produce an implementation plan with file manifest and acceptance criteria
3. Execute: models -> functions -> components -> wiring -> tests

### New Prototype Launch
Skill: `.claude/skills/new-prototype/SKILL.md`

When the user starts dreaming up a new project, this skill provides the full integration checklist — scaffolding, design system, terraform, testing, deployment, and all the files that must be updated to keep documentation in sync. **Always use this skill when creating a new prototype** to avoid documentation drift.

Each prototype has its own `AGENTS.md` with prototype-specific guidance. Read it before working on that prototype.

## Sculptor (AI Agent Sandbox) Workflow

When working with Sculptor, dev servers inside the sandbox aren't directly accessible from the browser.

**Pairing Mode (recommended)**: Sculptor syncs changes to local in real-time. Run `yarn dev:{prototype}` locally and watch hot-reload as the agent works.

**Sync to Local**: Pull completed changes from the sculptor task branch, then run locally.

**Build Verification**: Agent can run `yarn build:{prototype}` inside the sandbox to check for compilation errors without visual verification.
