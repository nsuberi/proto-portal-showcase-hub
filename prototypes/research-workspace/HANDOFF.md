# Research Workspace — Implementation Handoff

**Date:** 2026-04-11
**Branch:** `feature/add-insights-research`
**Plan file:** `.claude/plans/shiny-dreaming-walrus.md`

## What This Project Is

A multi-user research platform at `portfolio.cookinupideas.com/prototypes/research-workspace/` that combines:
- **Public gallery** — browse published insights, syntheses, and architecture diagrams
- **Authenticated workspace** — Milkdown WYSIWYG markdown editor, file browser, xterm.js terminal, all in a React SPA
- **Automated research loop** — Claude Code Cloud Scheduled Tasks generate content from arXiv papers based on user-set "learning intentions"

## Current State (What's Done)

### Infrastructure (fully deployed, working in production)
- **Cognito user pool** with GitHub OAuth via custom OIDC proxy Lambda
- **DynamoDB table** `research-workspace` (pk/sk, on-demand, PITR enabled, GSI `by-type`)
- **EFS file system** `fs-0acd734075980e9b2` with per-user access points
- **ECS Fargate service** `research-workspace-prod` on shared `ai-testing-resource-prod` cluster
- **ECR repository** `research-workspace-prod`
- **ALB listener rule** at priority 90: `/prototypes/research-workspace/vault/*` → Cognito auth → ECS
- **CloudFront behaviors**: `/vault/*` → ALB (auth'd), `/*` → S3 (public), `/oauth2/*` → ALB
- **GitHub OIDC proxy Lambda** at `https://32bifa3eedi5upmz5u7zikje2m0mhlsb.lambda-url.us-east-1.on.aws/`
- **IAM**: two-tier credential chain (assume-only user → append-only role, 1hr TTL)
- **S3 versioning** enabled on `portfolio-portal-code` bucket

### Terraform Outputs (key values)
```
cognito_user_pool_id        = us-east-1_gVoyPQj68
cognito_client_id           = 3ijo51536r6uvsppm9qbtpef02
cognito_domain              = https://cookinupideas.auth.us-east-1.amazoncognito.com
github_oidc_proxy_url       = https://32bifa3eedi5upmz5u7zikje2m0mhlsb.lambda-url.us-east-1.on.aws/
ecr_repository_url          = 671388079324.dkr.ecr.us-east-1.amazonaws.com/research-workspace-prod
ecs_service_name            = research-workspace-prod
efs_id                      = fs-0acd734075980e9b2
dynamodb_table              = research-workspace
deploy_role_arn             = arn:aws:iam::671388079324:role/research-workspace-append-only
s3_bucket                   = portfolio-portal-code
cloudfront_distribution_id  = E25WB0ZPQ7JJFT
```

### Auth Flow (working end-to-end)
1. User visits `/prototypes/research-workspace/vault/`
2. ALB → Cognito → directly to GitHub OAuth (skips Cognito hosted UI via `identity_provider=GitHub`)
3. GitHub → OIDC proxy Lambda (translates GitHub OAuth → OIDC JWT) → Cognito
4. Cognito validates JWT → sets session cookie → ALB forwards to ECS
5. GitHub OAuth App: Client ID `Ov23limPUjSbaPOZ4PFW`, registered at github.com/settings/developers

### Gallery SPA (built, deployed to S3)
- **Public gallery** at `/prototypes/research-workspace/` — works, shows tabbed view (All/Insights/Syntheses/Architectures)
- Components: GalleryPage, ContentDetailPage, ContentCard, ContentTypeTabs, MermaidRenderer, CodeCanvas, MarkdownRenderer, DomainFilter
- Content fetched at runtime via `fetch()` from S3-backed paths
- Build: `yarn workspace @proto-portal/research-workspace build` — passes cleanly

### Workspace SPA Components (built and deployed)
These components are built and deployed. The ECS container runs the Express.js backend (`node src/server.js`):
- `src/components/layout/WorkspaceLayout.tsx` — resizable three-panel layout (file browser | editor | terminal)
- `src/components/file-browser/FileBrowser.tsx` — tree view from `/api/vault/tree`
- `src/components/editor/MarkdownEditor.tsx` — editor wrapper with save status + auto-save
- `src/components/editor/MilkdownEditor.tsx` — Milkdown WYSIWYG with textarea fallback
- `src/components/terminal/TerminalPanel.tsx` — xterm.js with WebSocket
- `src/hooks/useVaultApi.ts` — file CRUD API client
- `src/hooks/useTerminal.ts` — terminal WebSocket hook
- Route: `/workspace` in App.tsx

### Backend (built and deployed)
The Express.js backend serves the workspace:
- `apps/research-workspace/src/server.js` — Express + file API + WebSocket terminal
- `apps/research-workspace/Dockerfile` — Node.js 20 + node-pty + Claude Code CLI
- `apps/research-workspace/vault-readme.md` — getting started guide baked into vault
- `apps/research-workspace/package.json` — express, ws, node-pty, glob

### API Routes (deployed via Lambda)
`shared/api/src/routes/research-workspace.js` — DynamoDB-backed endpoints:
- `GET /published` — query published content (public)
- `POST /publish` — publish from vault (auth'd)
- `POST /intentions` — create learning intention (auth'd)
- `GET /intentions` — list intentions (auth'd)
- `PATCH /intentions/:id` — update intention status (auth'd)
- `POST /feedback` — submit feedback (auth'd)
- `GET /feedback` — get feedback (auth'd)

### Cloud Scheduled Task Prompt (written, NOT yet registered)
`scripts/research-workspace-cloud-prompt.md` — instructions for the Cloud Scheduled Task to read DynamoDB intentions, query arXiv, generate content to S3, update DynamoDB.

## What's NOT Done (Remaining Work)

### ~~Immediate: Deploy the new backend + workspace SPA~~ (COMPLETED)
The Express.js backend is deployed. The ECS container runs `node src/server.js`. Deploy instructions are in AGENTS.md.

### Phase 2: Wiki-Links + Graph (not started)
- Wiki-link `[[]]` remark plugin for Milkdown
- `[[` autocomplete dropdown
- Sigma.js + graphology graph view (reuse pattern from `prototypes/ffx-skill-map/src/pages/SkillMap.tsx`)
- Backlinks panel

### Phase 3: Polish (partially shipped)
- Command palette (Ctrl+P) — not started
- ~~Publish integration in editor UI~~ — **shipped** (PublishDialog.tsx)
- ~~Tab system for multiple files~~ — **shipped** (TerminalPanel tabbed interface)
- ~~Intentions dashboard~~ — **shipped** (IntentionsPanel with CRUD, schedules, manual triggers)
- ~~Mobile responsive~~ — **shipped** (5-tab swipeable layout with useIsMobile hook)

### Cloud Scheduled Task (not registered)
The prompt is at `scripts/research-workspace-cloud-prompt.md`. To register:
```
RemoteTrigger action: create
body:
  name: "research-workspace"
  schedule: "7 11,17,21,1 * * *"
  repo_url: "https://github.com/nsuberi/proto-portal-showcase-hub"
  prompt: <contents of scripts/research-workspace-cloud-prompt.md>
  env_vars: S3_BUCKET, CLOUDFRONT_ID, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
```

## Architecture Diagram

```
portfolio.cookinupideas.com
  │
  ├── /prototypes/research-workspace/*  (S3)
  │   ├── Public gallery SPA (React + Vite)
  │   └── /workspace (client-side route → workspace layout)
  │
  ├── /prototypes/research-workspace/vault/* (ALB → Cognito → ECS)
  │   ├── /api/vault/tree         → Express.js (file listing)
  │   ├── /api/vault/files/*      → Express.js (file CRUD)
  │   ├── /api/vault/links        → Express.js (wiki-link graph)
  │   ├── /api/vault/terminal     → WebSocket (xterm.js ↔ node-pty)
  │   └── /healthz                → Express.js (health check)
  │
  ├── /api/v1/research-workspace/* (API Gateway → Lambda)
  │   ├── /published              → DynamoDB (public content)
  │   ├── /publish                → DynamoDB + S3 (auth'd)
  │   ├── /intentions             → DynamoDB (auth'd)
  │   └── /feedback               → DynamoDB (auth'd)
  │
  └── /oauth2/*  (ALB → Cognito callback)

ECS Cluster: ai-testing-resource-prod
  ├── ai-testing-resource-prod (AI Evals Flask)
  ├── code-dojo-prod (Code Dojo Flask)
  └── research-workspace-prod (Express.js + node-pty)

EFS: fs-0acd734075980e9b2
  └── /users/nathan/  (access point, uid 1000)

DynamoDB: research-workspace
  ├── CONTENT#<id> / META          (published content)
  ├── INTENTION#<user>#<id> / CONFIG (learning intentions)
  ├── STATE#memory / v1             (research loop state)
  └── STATE#feedback / v1           (aggregated feedback)
```

## Key Files

### Infrastructure
| File | Purpose |
|------|---------|
| `terraform/research-workspace.tf` | Cognito, DynamoDB, EFS, IAM, OIDC proxy Lambda, S3 versioning |
| `terraform/modules/research-workspace/main.tf` | ECS task def, ECR, ALB listener rules, service discovery |
| `terraform/modules/research-workspace/variables.tf` | Module inputs (VPC, subnets, Cognito, EFS) |
| `terraform/additional-iam-policy.tf` | Terraform role permissions (Cognito, EFS, DynamoDB, Lambda) |
| `terraform/main.tf` | CloudFront behaviors (vault→ALB, gallery→S3, oauth2→ALB) |
| `infrastructure/github-oidc-proxy/index.mjs` | OIDC proxy Lambda (GitHub OAuth → OIDC JWT) |

### Backend (ECS container)
| File | Purpose |
|------|---------|
| `apps/research-workspace/Dockerfile` | Node.js 20 + node-pty + Claude CLI |
| `apps/research-workspace/src/server.js` | Express.js: file API + WebSocket terminal |
| `apps/research-workspace/package.json` | express, ws, node-pty, glob |
| `apps/research-workspace/vault-readme.md` | Getting started guide baked into vault |

### Frontend (SPA)
| File | Purpose |
|------|---------|
| `prototypes/research-workspace/src/App.tsx` | Router: gallery routes + /workspace route |
| `prototypes/research-workspace/src/components/layout/WorkspaceLayout.tsx` | Resizable 3-panel layout |
| `prototypes/research-workspace/src/components/file-browser/FileBrowser.tsx` | File tree from API |
| `prototypes/research-workspace/src/components/editor/MarkdownEditor.tsx` | Editor wrapper + auto-save |
| `prototypes/research-workspace/src/components/editor/MilkdownEditor.tsx` | Milkdown WYSIWYG + textarea fallback |
| `prototypes/research-workspace/src/components/terminal/TerminalPanel.tsx` | xterm.js + WebSocket |
| `prototypes/research-workspace/src/hooks/useVaultApi.ts` | File CRUD API client |
| `prototypes/research-workspace/src/hooks/useTerminal.ts` | Terminal WebSocket hook |
| `prototypes/research-workspace/src/pages/GalleryPage.tsx` | Public gallery (existing) |
| `prototypes/research-workspace/src/pages/ContentDetailPage.tsx` | Content detail (existing) |

### API Routes (Lambda)
| File | Purpose |
|------|---------|
| `shared/api/src/routes/research-workspace.js` | DynamoDB-backed intentions, publish, feedback |
| `shared/api/src/server.js` | Mounts research-workspace routes |

### Scripts
| File | Purpose |
|------|---------|
| `scripts/research-workspace-cloud-prompt.md` | Cloud scheduled task prompt (not registered yet) |
| `scripts/seed-research-workspace.sh` | One-time DynamoDB seed from inference-insights data |
| `scripts/build.sh` | Builds all prototypes including research-workspace |
| `scripts/inference-insights-session.sh` | DEPRECATED — old LaunchAgent script |

## Security Model

```
Layer 1: Cognito + GitHub OAuth (at ALB)
  - ALB rejects unauthenticated requests to /vault/*
  - identity_provider=GitHub skips Cognito hosted UI

Layer 2: Per-User EFS Access Points
  - Kernel-level NFS isolation between user vaults

Layer 3: Per-User ECS Tasks (future — currently single user)

Layer 4: Per-User Claude OAuth
  - Each user runs `claude login` in terminal
  - Token at ~/.claude/ persists on EFS

IAM for cloud task:
  - Tier 1: IAM user (can only sts:AssumeRole)
  - Tier 2: IAM role (append-only S3 + DynamoDB, 1hr TTL)
  - No delete permissions anywhere
```

## Architectural Decisions (documented in README.md)

1. Custom workspace (Express.js + Milkdown + xterm.js) instead of code-server/Obsidian (completed — IDE is overkill for the JTBD)
2. GitHub OIDC proxy Lambda (GitHub OAuth is not OIDC-compliant)
3. Cognito at ALB level (no auth in app code)
4. Per-user EFS access points (kernel-level token isolation)
5. Two-tier IAM credential chain (append-only, 1hr TTL)
6. S3 + DynamoDB instead of git for content storage
7. Intentions system (user-driven, not autonomous)
8. Mermaid for architecture diagrams (client-side rendering)
9. Max plan auth via `claude login` in terminal
10. CloudFront path-based routing (vault vs gallery)
11. Consolidated from inference-insights into research-workspace

## Known Issues

1. ~~**ECS still runs code-server**~~ — **RESOLVED.** Express.js backend is deployed. Dockerfile runs `node src/server.js`.
2. **Milkdown may fall back to textarea** — the MilkdownEditor.tsx has a dynamic import fallback; if Milkdown fails to initialize in production, users get a plain textarea. This is intentional for resilience but should be debugged if it happens.
3. **Large Mermaid.js chunks** — ~600KB. Dynamically imported but still large. Consider lazy-loading only on architecture content pages.
4. **DynamoDB table is empty** — run `scripts/seed-research-workspace.sh` after assuming IAM role to migrate existing inference-insights data.
5. **Cloud scheduled task not registered** — prompt exists at `scripts/research-workspace-cloud-prompt.md` but RemoteTrigger hasn't been called yet.
6. **node-pty on ARM64** — The Dockerfile installs `build-essential` and `python3` for native compilation. If the build fails, try `npm rebuild node-pty` inside the container.
7. **Single ECS task for all users** — Application-layer isolation only (no container or kernel-level isolation). See PRD Security Architecture for isolation tiers and cost analysis.
