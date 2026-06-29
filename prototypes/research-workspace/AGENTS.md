# Agent Instructions: Research Workspace

## What This Is

AI research workspace: glassmorphism multi-panel UI with intentions system, concurrent quota-gated agent runs, real-time tool activity hooks, voice input, file browser, and markdown/code editors. Gallery is public; workspace requires Cognito auth (GitHub OAuth). Agent execution uses the **Claude Agent SDK** authenticated by a single operator `ANTHROPIC_API_KEY` (commercial API) — no per-user Claude subscription OAuth.

**Live**: `portfolio.cookinupideas.com/prototypes/research-workspace/`

## Architecture

```
CloudFront (E25WB0ZPQ7JJFT)
├── /prototypes/research-workspace/vault*  →  ALB → Cognito → ECS (Express.js)
│   ├── REST: /api/vault/{tree,files/*,links,search,activity,runs,quota,config,...}
│   ├── WS: /api/vault/{chat,runs/:id/ws}
│   └── /healthz
├── /prototypes/research-workspace/*       →  S3 (React SPA)
└── /api/v1/research-workspace/*           →  API Gateway → Lambda → DynamoDB
```

## Key Files

### Frontend (SPA on S3)
| File | Purpose |
|------|---------|
| `src/App.tsx` | Router: `/` gallery, `/content/:id`, `/workspace` |
| `src/components/layout/WorkspaceLayout.tsx` | 5-panel glass layout (desktop) / 5-tab (mobile) |
| `src/components/intentions/IntentionsPanel.tsx` | CRUD intentions, trigger runs (handles 429 quota) |
| `src/components/chat/ChatPanel.tsx` | Chat UI + quota banner (remaining $/runs, per-run cost, block messages) |
| `src/hooks/useChat.ts` | Chat WebSocket client + quota state |
| `src/components/activity/ToolActivityPanel.tsx` | Poll runs + tool activity, display hook events |
| `src/components/editor/MarkdownEditor.tsx` | Milkdown WYSIWYG, auto-save (800ms), hotkey menu |
| `src/components/editor/CodeEditor.tsx` | Regex syntax highlight for py/ts/js/json/sh, edit/preview toggle |

### Backend (ECS container)
| File | Purpose |
|------|---------|
| `../../apps/research-workspace/src/server.js` | Express: path stripping, file API, chat/run WebSockets, run manager, security |
| `../../apps/research-workspace/src/claude-runner.js` | Claude Agent SDK wrapper (model, budget, hooks, streaming) |
| `../../apps/research-workspace/src/quota.js` | Per-user + org quota (DynamoDB; in-memory fallback for dev) |
| `../../apps/research-workspace/Dockerfile` | node:20-slim + Agent SDK (bundles Claude engine) + AWS CLI |

### Infrastructure
| File | Purpose |
|------|---------|
| `../../terraform/main.tf` | CloudFront `vault*` behavior → ALB origin; module inputs (quota table, API key secret, allowlist) |
| `../../terraform/modules/research-workspace/main.tf` | ECS task def (env + ANTHROPIC_API_KEY secret), IAM (DynamoDB + secret read), ALB rule, EFS |
| `../../terraform/research-workspace.tf` | Cognito, DynamoDB (with TTL), EFS, OIDC proxy |

## Server API Surface

**REST:**
`GET /api/vault/tree` · `GET|PUT|POST|DELETE|PATCH /api/vault/files/*` · `POST /api/vault/folders/*` · `GET /api/vault/links` · `GET /api/vault/search?q=` · `GET|DELETE /api/vault/activity` · `POST|GET /api/vault/runs` · `DELETE /api/vault/runs/:id` · `GET /api/vault/quota` · `POST /api/vault/publish` · `GET /api/vault/published` · `GET /api/vault/published/:id` · `GET /api/vault/config` · `GET /api/vault/download?path=` · `GET /healthz`

(Removed with the auth-model change: `POST /api/vault/auth-code`, `DELETE /api/vault/auth`, `GET /api/vault/onboarding-status`.)

**WebSocket:**
`/api/vault/chat` (Agent SDK stream — `init`/`assistant_text`/`tool_use`/`quota`/`blocked`/`done`) · `/api/vault/runs/:id/ws` (read-only run log). `/api/vault/terminal` is retired (returns a notice and closes).

## Data Files (vault)

| File | Purpose |
|------|---------|
| `.intentions.json` | Intentions list (hidden from file browser) |
| `.tool-activity.jsonl` | Hook-logged tool use events |
| `.claude/settings.json` | Command-hook config (loaded by the SDK via `settingSources: ['project']`) |
| `.claude/hooks/log-activity.js` | PreToolUse hook script (Node.js) |
| `.claude/skills/*/SKILL.md` | Skills (gardener, researcher, synthesizer, …) |
| `reviews/` | Paper review outputs |
| `syntheses/` | Cross-paper synthesis outputs |
| `assets/` | Code assets from reviews |

## Development

```bash
yarn workspace @proto-portal/research-workspace dev   # SPA (port 3009)
cd apps/research-workspace && npm run dev              # Backend (port 8080)
```

Local dev: the backend `dev` script auto-loads `prototypes/research-workspace/.env` (`--env-file-if-exists`), so put `ANTHROPIC_API_KEY=...` there. With `QUOTA_TABLE` unset the quota store is in-memory and the allowlist is open (no DynamoDB needed).

## Deployment — COMPLETE CHECKLIST

### Prerequisites
Use a named AWS CLI profile that assumes the role automatically — credential values are never
printed to stdout (so they can't leak into transcripts):
```bash
# One-time profile setup (default profile = nsuberi IAM user keys from `aws configure`):
aws configure set role_arn       arn:aws:iam::671388079324:role/terraform-cooking-up-ideas --profile deploy
aws configure set source_profile default      --profile deploy
aws configure set region         us-east-1     --profile deploy

# Per session:
export AWS_PROFILE=deploy
```

**`AWS_PROFILE` persists across separate shell commands and re-assumes the role automatically on each
call — so you no longer need to chain AWS commands with `&&` to keep credentials alive.**
⚠️ NEVER `eval`/`export` raw `AWS_SECRET_ACCESS_KEY` values — that writes the live secret into the transcript.

**Anthropic key:** the agent uses a research-workspace-scoped secret `research-workspace-prod/anthropic-api-key`, sourced from `prototypes/research-workspace/.env`. Sync it into Secrets Manager **before** `terraform plan/apply` (the module reads it via a data source) and before any ECS redeploy:
```bash
export AWS_PROFILE=deploy
./scripts/research-workspace-sync-key.sh     # or: cd apps/research-workspace && npm run sync-key
```

### Layer 1: Docker Image → ECR
```bash
cd apps/research-workspace
docker build -t research-workspace .
docker tag research-workspace:latest 671388079324.dkr.ecr.us-east-1.amazonaws.com/research-workspace-prod:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 671388079324.dkr.ecr.us-east-1.amazonaws.com
docker push 671388079324.dkr.ecr.us-east-1.amazonaws.com/research-workspace-prod:latest
```
ARM64 native — do NOT add `--platform linux/amd64`.

### Layer 2: Terraform (if infra changed)
```bash
cd terraform
terraform apply -auto-approve \
  -var="github_oauth_client_id=Ov23limPUjSbaPOZ4PFW" \
  -var="github_oauth_client_secret=<secret>"
# Optional: -var='research_workspace_allowlist=<sub1>,<sub2>'  (invite-only)
#           -var='research_workspace_enable_scheduler=1'        (recurring runs)
```
**GitHub OAuth vars required** — without them Terraform destroys the Cognito identity provider.

### Layer 3: Point the service at the new task def
```bash
LATEST_TD=$(aws ecs describe-task-definition --task-definition research-workspace-prod \
  --region us-east-1 --query 'taskDefinition.taskDefinitionArn' --output text)
aws ecs update-service --cluster ai-testing-resource-prod --service research-workspace-prod \
  --task-definition "$LATEST_TD" --force-new-deployment --region us-east-1
```
**Required because** ECS has `lifecycle { ignore_changes = [task_definition, desired_count] }`.

**Scale-to-zero note:** the service idles at `desired_count=0` (the scaler Lambda owns
`desired_count` at runtime — see "Scale-to-Zero" below). With desired=0 a force-deploy starts
**no** task; the new task def is picked up on the **next wake**. To validate a new image now,
wake it: `curl -X POST https://portfolio.cookinupideas.com/prototypes/research-workspace/vault/_control/wake`,
poll `curl .../vault/_control/status` until `ready:true`. It reaps back to 0 after `idle_minutes` (default 15).

### Layer 4: SPA → S3 + CDN
```bash
cd /path/to/repo
./scripts/build.sh
aws s3 sync dist/ s3://portfolio-portal-code --delete --exclude "*.map"
aws cloudfront create-invalidation --distribution-id E25WB0ZPQ7JJFT --paths "/prototypes/research-workspace/*"
```

### Verification
```bash
curl -s https://portfolio.cookinupideas.com/prototypes/research-workspace/vault/_control/status   # asleep: ready:false
aws logs tail /ecs/research-workspace-prod --since 5m --region us-east-1
aws logs tail /aws/lambda/research-workspace-prod-scaler --since 5m --region us-east-1            # wake/reap activity
```

## Scale-to-Zero (cost → $0 when idle)

The ECS service idles at `desired_count=0`. A **scaler Lambda** (`research-workspace-prod-scaler`,
`terraform/modules/research-workspace/scaler.tf` + `scaler-lambda/index.mjs`) owns `desired_count`
at runtime; Terraform ignores it.

- **Wake (browser):** the SPA's `BackendGate` (front of `/workspace`) calls the unauthenticated
  control plane behind ALB listener rule **priority 88** (`/vault/_control/*` → Lambda target group,
  no Cognito): `POST /_control/wake` scales 0→1 and stamps a heartbeat; `GET /_control/status`
  reports `{ready,desiredCount,runningCount,healthyTargets}`. The splash polls status until ready
  (~20–40s cold start), then renders the workspace.
- **Reap (idle):** an EventBridge `rate(5 minutes)` rule sends `{action:"reap"}`; the Lambda scales
  to 0 when the DynamoDB heartbeat (`pk=SYSTEM, sk=HEARTBEAT`) is older than `idle_minutes` (15).
  A nightly `scheduled_stop_cron` is a hard backstop.
- **Heartbeat (don't kill active work):** the backend (`server.js`) refreshes the heartbeat every
  60s while there's an in-flight run, an open chat WS, or HTTP activity within 5 min — so an active
  agent run is never reaped mid-flight.
- **Compute:** task runs on `FARGATE_SPOT`, right-sized to 0.5 vCPU / 1 GB.
- **The gallery does NOT wake the backend** — `usePublishedContent` falls back to the public Lambda
  API (`/api/v1/research-workspace/published`), so public visitors keep idle cost at $0.

⚠️ Operator `ANTHROPIC_API_KEY` lives in Secrets Manager at `research-workspace-prod/anthropic-api-key`
(bootstrap before first apply: `aws secretsmanager create-secret --name research-workspace-prod/anthropic-api-key --secret-string file://<key>`).

## Gotchas

1. **Path prefix stripping**: ALB forwards full CloudFront path. Express strips `/prototypes/research-workspace/vault`. Use short paths in routes.
2. **CloudFront pattern**: `vault*` (no slash before `*`). Previous `vault/*` caused 404 on `/vault`.
3. **ECS `ignore_changes` trap**: `terraform apply` ≠ container update. Always force-deploy.
4. **Cognito OAuth vars**: Omitting destroys auth. Always pass or use `-target`.
5. **Agent auth is one operator key**: chat + runs call the Claude Agent SDK with the task's `ANTHROPIC_API_KEY`. There is no per-user OAuth, no interactive terminal. All runs are quota-gated (`src/quota.js`); cost bills to the operator account.
6. **Quota state in DynamoDB**: per-user budgets live in the `research-workspace` table (pk=`USER#<sub>`, sk=`DAY#<date>`), TTL-expired after 48h. The task role needs DynamoDB R/W (granted in the module). Hard cost floor = the Anthropic Console workspace spend limit.
7. **Allowlist is non-transferable**: keyed on the Cognito `sub`; a shared link is useless to a non-allowlisted identity. Empty `ALLOWLIST` = open to any logged-in user.
