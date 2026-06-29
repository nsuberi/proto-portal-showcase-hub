# Proto Portal Showcase Hub

A portfolio monorepo showcasing interactive prototypes deployed to AWS. Each prototype demonstrates a different approach to learning technology, visualization, or AI-assisted interaction.

**Live site**: https://portfolio.cookinupideas.com

## Prototypes

| Prototype | What It Does | Key Tech |
|-----------|-------------|----------|
| [FFX Skill Map](prototypes/ffx-skill-map/) | Graph-based skill development inspired by Final Fantasy X's Sphere Grid | Sigma.js, Graphology, Neo4j |
| [Home Lending Learning](prototypes/home-lending-learning/) | Interactive mortgage education with AI assessments | Claude API, adaptive difficulty |
| [Documentation Explorer](prototypes/documentation-explorer/) | AI-powered code documentation search with floating cards | Framer Motion, react-markdown |
| [Learning Path](prototypes/learning-path/) | Geospatial recipe explorer with pre-computed country boundaries | Hex grids, progress tracking |
| [AI Evals in Context](apps/ai-evals-in-context/) | AI evaluation in the testing pyramid (Flask/ECS). **Hosted demo retired 2026-06-28** to stop costs; source runs locally only, being reimagined as an eval-trace workspace. | Flask, ChromaDB, deepeval |

## Architecture

```
proto-portal-showcase-hub/
├── src/                              # Portfolio landing page (React/Vite)
├── prototypes/                       # 4 React/Vite prototype apps
├── apps/
│   └── ai-evals-in-context/          # Flask app (separate ECS deployment)
├── shared/
│   ├── design-tokens/                # Shared UI theme with override system
│   └── api/                          # Express API proxy (Claude, auth, rate limiting)
├── terraform/                        # AWS IaC (S3, CloudFront, Lambda, API Gateway)
├── scripts/                          # Build, deploy, and dev proxy scripts
└── .github/workflows/                # CI/CD pipeline
```

**How it deploys**: React prototypes build to `dist/prototypes/{name}/` and serve from S3 via CloudFront. The shared API runs as a Lambda function behind API Gateway. The Research Workspace runs on ECS Fargate behind the shared ALB. (The AI Evals app previously deployed to ECS Fargate as well; its hosted demo was retired on 2026-06-28.)

## Getting Started

### Prerequisites

- **Node.js 20+** with **Corepack** enabled (`corepack enable`)
- **Yarn 4.9+** (managed via Corepack — do not install globally)
- **Docker** (optional, for Neo4j database)
- **Python 3** (for AI Evals app and testing production builds)

### Installation

```bash
git clone <repository-url>
cd proto-portal-showcase-hub

# Enable Corepack for Yarn 4.9
corepack enable

# Install all workspace dependencies
yarn install --immutable
```

### Running Everything Locally

One command starts Docker services, the Flask app, all Node prototypes, the API server, and the dev proxy:

```bash
./scripts/dev-start.sh
```

Then open **http://localhost:8082** — the dev proxy routes everything through a single entry point, matching production CloudFront:

```
http://localhost:8082/                                    → Portfolio
http://localhost:8082/prototypes/ffx-skill-map/           → FFX Skill Map
http://localhost:8082/prototypes/home-lending-learning/    → Home Lending
http://localhost:8082/prototypes/documentation-explorer/   → Docs Explorer
http://localhost:8082/prototypes/learning-path/            → Learning Path
http://localhost:8082/api/v1/*                             → API Server
http://localhost:8082/ai-evals/                            → AI Evals (Flask)
```

Ctrl+C shuts everything down cleanly, including Docker containers.

**Flags:**

| Flag | Effect |
|------|--------|
| `--no-evals` | Skip the AI Evals app entirely |
| `--neo4j` | Also start Neo4j for FFX (default: skip, uses mock data) |
| `--evals-local` | Run Flask directly instead of via Docker (no PostgreSQL/Redis) |

### Running Individual Services

If you only need part of the stack:

```bash
yarn dev:all                          # All Node services + proxy (no Docker)
yarn dev                              # Main portfolio only (port 8080)
yarn dev:ffx                          # FFX Skill Map (port 3001)
yarn dev:home-lending                 # Home Lending (port 3002)
yarn dev:documentation-explorer       # Docs Explorer (port 3005)
yarn dev:learning-path                # Learning Path (port 3006)
cd shared/api && npm run dev          # API server (port 3004)
yarn dev:proxy                        # Dev proxy only (port 8082)
```

### AI Features (Claude API)

To enable AI-powered features (skill recommendations, lending assessments, doc search):

```bash
cd shared/api
cp .env.example .env
# Edit .env and add: CLAUDE_API_KEY=sk-ant-your-key-here
npm run dev
```

The API server runs on port 3004. Prototypes work without it but AI features will be unavailable.

### AI Evals App (Flask) — First-Time Setup

Before `dev-start.sh` can run the AI Evals app, create the `.env` file:

```bash
cd apps/ai-evals-in-context/ai-testing-resource
cp .env.example .env                  # Add ANTHROPIC_API_KEY
```

The start script handles Docker (or virtualenv creation with `--evals-local`). Access via `http://localhost:8082/ai-evals/`.

Key routes: `/` (landing), `/ask` (live demo), `/viewer/tests` (test navigator), `/governance` (TSR dashboard).

### Neo4j Database (FFX Prototype, Optional)

The FFX prototype uses mock data by default. For real graph database operations:

```bash
yarn docker:up                        # Start Neo4j container
cd prototypes/ffx-skill-map
yarn db:seed                          # Seed skill graph
# Neo4j Browser: http://localhost:7474 (neo4j/testpassword)
yarn docker:down                      # Stop when done
```

## Port Reference

| Service | Port | Production Path |
|---------|------|-----------------|
| Main Portfolio | 8080 | `/` |
| FFX Skill Map | 3001 | `/prototypes/ffx-skill-map/` |
| Home Lending | 3002 | `/prototypes/home-lending-learning/` |
| Documentation Explorer | 3005 | `/prototypes/documentation-explorer/` |
| Learning Path | 3006 | `/prototypes/learning-path/` |
| API Server | 3004 | `/api/v1/` |
| Dev Proxy | 8082 | All of the above |
| AI Evals (Flask) | 5000 (5001 via Docker) | `/ai-evals/` |
| Neo4j Browser | 7474 | - |
| Neo4j Bolt | 7687 | - |

## Testing

```bash
# Unit tests (all prototypes)
yarn workspace @proto-portal/ffx-skill-map test
yarn workspace @proto-portal/home-lending-learning test
yarn workspace @proto-portal/documentation-explorer test

# E2E tests (Playwright)
cd prototypes/ffx-skill-map && npm run test:e2e
cd prototypes/home-lending-learning && npm run test:e2e

# Integration tests (needs API server running on port 3004)
cd shared/api && npm run dev          # start API first
cd prototypes/ffx-skill-map && npm run test:integration

# AI Evals tests
cd apps/ai-evals-in-context/ai-testing-resource
source .venv/bin/activate
python3 -m pytest tests/unit/ tests/e2e/ -v
```

## Building & Deploying

```bash
# Build all prototypes
yarn build
# Or: ./scripts/build.sh

# Test the production build locally
cd dist && python3 -m http.server 8000
# Visit http://localhost:8000 and http://localhost:8000/prototypes/ffx-skill-map/

# Full deployment (Terraform + build + S3 + CDN invalidation)
./scripts/deploy.sh

# Infrastructure only
./scripts/deploy-infrastructure.sh

# Site content only
./scripts/deploy-site.sh
```

## Design Token System

All prototypes share a design token system from `shared/design-tokens/`:

```css
/* Import in any prototype's CSS */
@import "@proto-portal/design-tokens/css/tokens.css";
@import "@proto-portal/design-tokens/css/utilities.css";
```

```ts
// Extend in Tailwind config
import { baseTailwindConfig } from "@proto-portal/design-tokens";

// Per-prototype overrides
import { createDesignTokens, presetOverrides } from "@proto-portal/design-tokens";
const tokens = createDesignTokens(presetOverrides.ffxSkillMap);
```

Available presets: `ffxSkillMap` (light theme), `highContrast` (accessibility), `vibrant` (colorful).

## CI/CD Pipeline

GitHub Actions (`.github/workflows/deploy.yml`) runs on push to `main`:

1. **Test** — Unit tests for all prototypes
2. **Deploy** — Terraform apply, build all apps, S3 sync, CDN invalidation
3. **Integration Tests** — Playwright E2E against production

Uses OIDC federation for AWS access — no static credentials.

## Infrastructure

Terraform in `terraform/` manages:
- **S3** — Static file hosting
- **CloudFront** — CDN with SPA routing (CloudFront Function handles prototype paths)
- **Lambda** — Express API from `shared/api/`
- **API Gateway** — Routes to Lambda with rate limiting
- **Route53** — DNS for cookinupideas.com subdomains
- **Secrets Manager** — Claude API key storage

State: S3 bucket `portfolio-portal-terraform-state` with DynamoDB locking.

## Security Model

- **Zero static credentials** — AWS auth via OIDC federation (short-lived tokens)
- **Branch protection** — PRs required for `main`, enforce admins enabled
- **Environment-gated secrets** — `ANTHROPIC_API_KEY` only accessible from `main` branch
- **API security** — Helmet, CORS whitelist, rate limiting, Secrets Manager
- See the [detailed security model](#security-details) below for attack vector analysis

## Adding a New Prototype

1. Create `prototypes/{name}/` with `package.json` (workspace: `@proto-portal/{name}`)
2. Set `base: '/prototypes/{name}/'` in `vite.config.ts`
3. Import shared design tokens in CSS and Tailwind config
4. Add dev/build scripts to root `package.json`
5. Update `scripts/build.sh` to include the new prototype
6. Update CloudFront Function in `terraform/main.tf` (add to prototype list)
7. Add an `AGENTS.md` with prototype-specific guidance
8. Add to the portfolio component in `src/components/Portfolio.tsx`

## Agent Workflow

This project uses Claude Code agents with structured guidance:

- **Root `AGENTS.md`** — Full monorepo overview and quick commands
- **Per-prototype `AGENTS.md`** — Architecture decisions, key files, gotchas
- **`CLAUDE.md`** — Development workflow, commit conventions, port reference
- **`.claude/skills/breadboarding/`** — Feature shaping methodology (places, affordances, wiring)

## Documentation

- [AGENTS.md](AGENTS.md) — Agent instructions and architecture overview
- [CLAUDE.md](CLAUDE.md) — Development workflow and design guidelines
- [Shared API](shared/api/AGENTS.md) — API route patterns, security posture, CORS
- [Terraform](terraform/AGENTS.md) — Infrastructure guide
- [FFX Skill Map](prototypes/ffx-skill-map/README.md)
- [Home Lending Learning](prototypes/home-lending-learning/README.md)
- [Terraform Infrastructure Docs](terraform/docs/)

---

<details>
<summary><h2 id="security-details">Security Details</h2></summary>

### Access control: who can merge and deploy

Only `nsuberi` can merge pull requests to `main` and trigger deployments. This is enforced by three independent layers:

1. **GitHub collaborator model** — On a personal (non-organization) repository, only collaborators with write access can merge PRs or push to branches. `nsuberi` is the sole collaborator. Only the repo owner can add new collaborators. Anyone can fork the repo and open a PR, but they cannot merge it.

2. **Branch protection on `main`** — Direct pushes to `main` are blocked. All changes must go through a pull request. `enforce_admins` is enabled, so this applies to the owner too. The required approval count is 0, which means the owner can merge their own PRs immediately without waiting for a review (necessary for a solo project).

3. **Environment-gated secrets** — The `ANTHROPIC_API_KEY` is stored as a GitHub environment secret in the `production` environment, which has a branch deployment policy restricting it to `main` only. Even if a workflow runs on another branch, it cannot access production secrets.

### Zero static credentials

There are no AWS access keys stored anywhere in GitHub. AWS authentication uses OpenID Connect (OIDC) federation:

- GitHub Actions requests a short-lived OIDC token from GitHub's token service
- The `aws-actions/configure-aws-credentials` action exchanges this token with AWS STS
- AWS validates the token's claims against the IAM role's trust policy
- Temporary credentials (valid ~1 hour) are issued for the workflow run

### How credentials flow in CI

```
PR merged to main (only nsuberi can do this)
  -> deploy.yml triggers (push to main)
    -> deploy job declares: environment: production
      -> GitHub checks environment branch policy: is this main? yes
        -> Job receives OIDC token
           (sub: repo:nsuberi/proto-portal-showcase-hub:environment:production)
        -> Job receives ANTHROPIC_API_KEY from production environment secret
          -> aws-actions/configure-aws-credentials exchanges OIDC token with AWS STS
            -> AWS validates trust policy on terraform-cooking-up-ideas role
              -> Temporary credentials issued, Terraform runs
```

### AWS IAM trust policy

The IAM role `terraform-cooking-up-ideas` is managed in `terraform/additional-iam-policy.tf`. Its trust policy allows:

| Principal | Action | Condition |
|-----------|--------|-----------|
| IAM user `nsuberi` | `sts:AssumeRole` | None (local CLI access) |
| GitHub OIDC provider | `sts:AssumeRoleWithWebIdentity` | Subject must be `repo:nsuberi/proto-portal-showcase-hub:environment:production` AND audience must be `sts.amazonaws.com` |
| `ecs-tasks.amazonaws.com` | `sts:AssumeRole` | None (ECS task execution) |

The OIDC subject condition is the critical AWS-side control. It ensures that only workflows running in the `production` environment of this specific repository can assume the role.

### GitHub settings summary

| Setting | Value |
|---------|-------|
| Repo-level secrets | None |
| Production environment secrets | `ANTHROPIC_API_KEY` |
| Production environment branch policy | `main` only |
| Branch protection on `main` | PRs required, enforce admins, no force push, no deletions |
| Required PR approvals | 0 (owner can self-merge) |
| Collaborators | `nsuberi` (admin) -- sole collaborator |

### What blocks each attack vector

| Vector | Defense |
|--------|---------|
| Fork PR attempts to read secrets | GitHub blocks environment secrets from fork PRs |
| Fork PR modifies workflow to exfiltrate on merge | Only `nsuberi` can merge; changes visible in diff |
| Workflow on a feature branch references production env | Branch policy rejects -- only `main` allowed |
| OIDC token from another repo tries to assume AWS role | STS rejects -- subject claim doesn't match |
| Someone tries to push directly to `main` | Branch protection blocks it |
| Someone tries to add themselves as collaborator | Only repo owner can manage collaborators |

### Terraform state

State is stored in S3 (`portfolio-portal-terraform-state`) with DynamoDB locking and encryption at rest. The state file contains sensitive values (database passwords, API keys). Access is limited to the `terraform-cooking-up-ideas` IAM role and the `nsuberi` IAM user.

</details>

## License

This project is intended for educational and demonstration purposes.
