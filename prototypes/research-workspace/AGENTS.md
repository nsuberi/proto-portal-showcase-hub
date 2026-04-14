# Agent Instructions: Research Workspace

## What This Is

AI research workspace: glassmorphism multi-panel UI with intentions system, concurrent Claude Code runs, real-time tool activity hooks, voice input, file browser, and markdown/code editors. Gallery is public; workspace requires Cognito auth.

**Live**: `portfolio.cookinupideas.com/prototypes/research-workspace/`

## Architecture

```
CloudFront (E25WB0ZPQ7JJFT)
├── /prototypes/research-workspace/vault*  →  ALB → Cognito → ECS (Express.js)
│   ├── REST: /api/vault/{tree,files/*,links,search,activity,runs,auth,auth-code}
│   ├── WS: /api/vault/{terminal,chat,runs/:id/ws}
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
| `src/components/intentions/IntentionsPanel.tsx` | CRUD intentions, trigger runs, auth note |
| `src/components/activity/ToolActivityPanel.tsx` | Poll runs + tool activity, display hook events |
| `src/components/editor/MarkdownEditor.tsx` | Milkdown WYSIWYG, auto-save (800ms), hotkey menu |
| `src/components/editor/CodeEditor.tsx` | Regex syntax highlight for py/ts/js/json/sh, edit/preview toggle |
| `src/components/terminal/TerminalPanel.tsx` | Tabbed xterm.js: interactive + per-run tabs |
| `src/hooks/useVoiceInput.ts` | Spacebar hold-to-dictate (Web Speech API) |
| `src/hooks/useTerminal.ts` | xterm.js + WebSocket to PTY |

### Backend (ECS container)
| File | Purpose |
|------|---------|
| `../../apps/research-workspace/src/server.js` | Express: path stripping, file API, 3 WebSocket servers, run manager, security |
| `../../apps/research-workspace/Dockerfile` | node:20-slim + Claude CLI + AWS CLI + node-pty |

### Infrastructure
| File | Purpose |
|------|---------|
| `../../terraform/main.tf` | CloudFront `vault*` behavior → ALB origin |
| `../../terraform/modules/research-workspace/main.tf` | ECS task def, ALB rule (priority 90), EFS |
| `../../terraform/research-workspace.tf` | Cognito, DynamoDB, EFS, OIDC proxy |

## Server API Surface

**REST:**
`GET /api/vault/tree` · `GET|PUT|POST|DELETE|PATCH /api/vault/files/*` · `POST /api/vault/folders/*` · `GET /api/vault/links` · `GET /api/vault/search?q=` · `GET|DELETE /api/vault/activity` · `POST|GET /api/vault/runs` · `DELETE /api/vault/runs/:id` · `POST /api/vault/publish` · `GET /api/vault/published` · `GET /api/vault/published/:id` · `GET /api/vault/config` · `GET /api/vault/onboarding-status` · `GET /api/vault/download?path=` · `POST /api/vault/auth-code` · `DELETE /api/vault/auth` · `GET /healthz`

**WebSocket:**
`/api/vault/terminal` (interactive PTY) · `/api/vault/runs/:id/ws` (run output stream) · `/api/vault/chat` (stream-json Claude interaction)

## Data Files (vault)

| File | Purpose |
|------|---------|
| `.intentions.json` | Intentions list (hidden from file browser) |
| `.tool-activity.jsonl` | Hook-logged tool use events |
| `.claude/settings.json` | Claude Code hook config |
| `.claude/hooks/log-activity.js` | PreToolUse hook script (Node.js) |
| `.claude/skills/research/SKILL.md` | Research skill for Claude Code |
| `reviews/` | Paper review outputs |
| `syntheses/` | Cross-paper synthesis outputs |
| `assets/` | Code assets from reviews |

## Development

```bash
yarn workspace @proto-portal/research-workspace dev   # SPA (port 3009)
cd apps/research-workspace && npm run dev              # Backend (port 8080)
```

## Deployment — COMPLETE CHECKLIST

### Prerequisites
```bash
eval $(aws sts assume-role --role-arn "arn:aws:iam::671388079324:role/terraform-cooking-up-ideas" \
  --role-session-name "deploy-session" --output json \
  | python3 -c "import json,sys;c=json.load(sys.stdin)['Credentials'];print(f'export AWS_ACCESS_KEY_ID={c[\"AccessKeyId\"]} AWS_SECRET_ACCESS_KEY={c[\"SecretAccessKey\"]} AWS_SESSION_TOKEN={c[\"SessionToken\"]}')")
```

**CRITICAL: Credentials do NOT persist between separate shell commands. Chain with `&&`.**

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
```
**GitHub OAuth vars required** — without them Terraform destroys Cognito identity provider.

### Layer 3: Force ECS Redeployment
```bash
LATEST_TD=$(aws ecs describe-task-definition --task-definition research-workspace-prod \
  --region us-east-1 --query 'taskDefinition.taskDefinitionArn' --output text)
aws ecs update-service --cluster ai-testing-resource-prod --service research-workspace-prod \
  --task-definition "$LATEST_TD" --force-new-deployment --region us-east-1
```
**Required because** ECS has `lifecycle { ignore_changes = [task_definition] }`.

### Layer 4: SPA → S3 + CDN
```bash
cd /path/to/repo
./scripts/build.sh
aws s3 sync dist/ s3://portfolio-portal-code --delete --exclude "*.map"
aws cloudfront create-invalidation --distribution-id E25WB0ZPQ7JJFT --paths "/prototypes/research-workspace/*"
```

### Verification
```bash
curl -s https://portfolio.cookinupideas.com/prototypes/research-workspace/vault/healthz
aws logs tail /ecs/research-workspace-prod --since 5m --region us-east-1
```

## Gotchas

1. **Path prefix stripping**: ALB forwards full CloudFront path. Express strips `/prototypes/research-workspace/vault`. Use short paths in routes.
2. **CloudFront pattern**: `vault*` (no slash before `*`). Previous `vault/*` caused 404 on `/vault`.
3. **ECS `ignore_changes` trap**: `terraform apply` ≠ container update. Always force-deploy.
4. **Cognito OAuth vars**: Omitting destroys auth. Always pass or use `-target`.
5. **Runs use PTY, chat uses spawn**: Both the interactive terminal AND background runs use interactive PTY sessions (`pty.spawn`). The chat WebSocket uses `child_process.spawn` with `--output-format stream-json`.
6. **Token security**: `.claude/` is chmod 700, credentials chmod 600. Revoke via `DELETE /api/vault/auth`.
