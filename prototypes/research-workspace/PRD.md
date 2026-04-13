# Research Workspace — Product Requirements Document

## Vision

An AI-powered research workspace where users set research intentions (papers, synthesis tasks, comparative reviews), trigger them as background Claude Code sessions, and view results as structured markdown, code assets, and architecture diagrams — all within a glassmorphism-styled multi-panel web interface with real-time observability into agent tool use via Claude Code hooks.

## Users

- Researchers exploring ML/AI papers and generating structured reviews
- Developers building code assets derived from paper architectures
- Portfolio visitors evaluating the builder's dev maturity and AI integration skills

## Architecture

```
CloudFront
├── /prototypes/research-workspace/vault*  →  ALB → Cognito → ECS (Express.js)
│   ├── REST: file CRUD, intentions, runs, activity log, auth
│   ├── WS: interactive terminal (PTY), run streams, chat
│   └── /healthz
├── /prototypes/research-workspace/*       →  S3 (React SPA)
│   ├── /                    Gallery (public)
│   ├── /content/:id         Content detail (public)
│   └── /workspace           Authenticated workspace
└── /api/v1/research-workspace/*           →  API Gateway → Lambda (DynamoDB)
```

**Stack:** React 18 + Vite (SPA) | Express.js + node-pty + ws (backend) | ECS Fargate + EFS + Cognito (infra)

## Features

### 1. Glassmorphism Workspace (Shipped)

Five resizable glass widgets on a dark dot-grid backdrop:
- **Files** — vault file browser (EFS-backed, hides dotfiles)
- **Intentions** — create/edit/run research plans with recurring schedules
- **Editor** — Milkdown WYSIWYG for .md, regex syntax highlighting for .py/.ts/.js/.json/.sh
- **Claude Terminal** — tabbed xterm.js: interactive Claude Code session + per-run output tabs
- **Hooks & Activity** — real-time PreToolUse hook log showing every tool invocation with allow/block status

Desktop: 3-column resizable panels. Mobile: 5-tab swipeable layout.

### 2. Intentions System (Shipped)

Three intention types:
| Type | Purpose | Output |
|------|---------|--------|
| **Research** | Analyze a paper/URL | `reviews/<slug>.md` |
| **Synthesis** | Connect findings across papers | `syntheses/*.md` + Mermaid diagrams |
| **Review** | Compare selected docs, produce architecture | Code in `assets/`, comparative analysis, Mermaid diagrams |

Each intention has:
- Recurring schedule (1x/2x/4x/8x per day, optional end date)
- Manual trigger (play button → spawns background Claude Code session)
- Inline editing (expand card → edit title/description → auto-save)
- Document selection (review type — multi-select vault files)

### 3. Concurrent Interactive Runs (Shipped)

- `POST /api/vault/runs` spawns an interactive Claude Code PTY session (`claude --dangerously-skip-permissions`)
- Research prompt is auto-injected after Claude Code starts (output-settle detection with 10s max wait)
- Each run opens a fully interactive Claude Code terminal tab — users see the real TUI and can steer the session
- Run WebSockets are bidirectional: input, resize, and output all flow between browser and PTY
- Multiple runs execute simultaneously as separate PTY sessions
- Tool use events logged via Claude Code hooks (`.claude/hooks/log-activity.sh`)
- Run status tracking: running → completed/failed/cancelled
- Output buffer (100KB rolling) for late-joining WebSocket clients

### 4. Claude Code Hooks — Enterprise Controls Demo (Shipped)

PreToolUse hook (`log-activity.sh`) fires before every tool invocation:
- Logs tool name, input, timestamp, decision to activity file
- Currently allows all tools (`{"decision":"allow"}`)
- Could block specific tools for enterprise policy enforcement
- Activity panel shows real-time feed with tool type icons, counts, allow/block badges

### 5. Voice Input (Shipped)

Hold-spacebar-to-dictate in the terminal:
- Quick tap (<300ms) → space character
- Long hold → mic capture → Web Speech API transcription → inject into terminal
- Visual indicator (pulsing red dot + volume level) in terminal header

### 6. Token Security (Shipped)

- OAuth tokens stored on encrypted EFS (AES-256 at rest)
- File permissions: `.claude/` → 0700, credentials → 0600
- Revoke button in Intentions panel deletes all credential files
- Auth note warns about token storage, recommends scoped API keys for automation

### 7. Fullscreen Editor (Shipped)

- Maximize button on editor panel → fixed overlay covering entire viewport
- Escape key or minimize button to exit
- Works for both markdown and code files

## Data Model

**Intentions** — stored as `.intentions.json` in vault (hidden from file browser)
```typescript
{ id, type, title, description, schedule?: { timesPerDay, endDate? }, status, documents?, createdAt }
```

**Tool Activity** — `.tool-activity.jsonl` (JSONL, one event per line)
```typescript
{ timestamp, tool, input, decision, runId?, runTitle? }
```

**Runs** — in-memory on server (ephemeral, cleaned after 30min)
```typescript
{ id, title, status, startedAt, finishedAt, toolCount, error, intentionId }
```

## Key Metrics

- Time from intention creation to first research output
- Concurrent run throughput (how many simultaneous Claude sessions)
- Tool activity volume per run (hooks observability)
- Auth token longevity (~90 days for Max plan OAuth)

## Security Architecture (Implemented)

### IAM Role — ECS Task

The task role (`research-workspace-prod-ecs-task`) has a single scoped policy:

| Permission | Scope | Purpose |
|------------|-------|---------|
| `elasticfilesystem:ClientMount` | This EFS + this access point only | Mount the vault volume |
| `elasticfilesystem:ClientWrite` | This EFS + this access point only | Write files to vault |

All other AWS API calls (S3, DynamoDB, Secrets Manager, Lambda, etc.) are **denied** — the role has no other policies. The execution role has `secretsmanager:GetSecretValue` scoped to the Anthropic API key ARN for env injection at startup only.

EFS authorization uses **IAM enforcement** (`iam = "ENABLED"`) — only this task role, with this specific access point, can mount the filesystem. Other containers or services on the same account cannot access the EFS volume.

### Per-User File Isolation (Implemented)

```
EFS File System (AES-256 at rest, transit encryption)
└── Access Point: /users/nathan (UID 1000, GID 1000)
    └── /workspace (container mount)
        └── /vaults/{cognito-sub}/    ← per-user isolation
            ├── reviews/
            ├── .claude/              ← per-user tokens + config
            ├── .intentions.json
            └── .tool-activity.jsonl
```

**How user identity flows:**
1. ALB Cognito authenticator adds `x-amzn-oidc-data` JWT header
2. Server middleware parses the JWT payload → extracts `sub` (unique Cognito user ID)
3. All file operations scoped to `/workspace/vaults/{sub}/`
4. `sanitizePath()` validates every path against user's vault root — blocks directory traversal
5. Claude Code spawned with `HOME = /workspace/vaults/{sub}/` — per-user tokens
6. Dev mode: falls back to `dev-local` user ID (no ALB headers)

**What this prevents:**
- User A cannot read User B's files, intentions, or activity logs
- User A cannot see User B's OAuth tokens (different HOME directory)
- Directory traversal from `/vaults/user-a/` to `/vaults/user-b/` is blocked by path validation

### Claude Code Session Capabilities

Claude Code runs with `--dangerously-skip-permissions` but with these mitigations:

| Control | Implementation |
|---------|---------------|
| **Env filtering** | `ANTHROPIC_API_KEY`, AWS credentials stripped from spawned process env. Claude uses per-user OAuth. |
| **Per-user HOME** | Each user's Claude Code reads/writes its own `.claude/` directory |
| **Tool policy hooks** | PreToolUse hook reads `.claude/tool-policy.json` — can block specific tools (e.g., `["Bash"]` for read-only agents) |
| **Activity auditing** | Every tool invocation logged to per-user `.tool-activity.jsonl` with tool name, input, and allow/block decision |
| **Token revocation** | `DELETE /api/vault/auth` removes all credential files from user's vault |

Claude Code can still execute arbitrary Bash and make HTTP requests within the container. The `--dangerously-skip-permissions` flag is required for automated background runs. Enterprise-grade restriction is achieved via the configurable tool policy hooks.

### Hardening Summary

| Layer | Measure | Status |
|-------|---------|--------|
| **Network** | ALB Cognito auth on all `/vault*` requests | Shipped |
| **Identity** | Cognito JWT parsed from ALB headers per request | Shipped |
| **File system** | Per-user vault directories with path traversal protection | Shipped |
| **EFS IAM** | IAM auth enabled, scoped to task role + access point | Shipped |
| **Encryption** | EFS AES-256 at rest + transit encryption | Shipped |
| **Credentials** | `.claude/` dir 0700, credential files 0600 per user | Shipped |
| **Env isolation** | API key + AWS creds stripped from Claude Code processes | Shipped |
| **Tool policy** | Configurable allow/block per tool via `.claude/tool-policy.json` | Shipped |
| **Audit trail** | PreToolUse hook logs every tool invocation per user | Shipped |
| **Token revocation** | One-click revoke via API + UI button | Shipped |

### Remaining Gaps

| Gap | Impact | Mitigation Path |
|-----|--------|-----------------|
| Single ECS task serves all users | Shared container memory/processes | Per-user Fargate tasks or task-per-session |
| All users run as UID 1000 | POSIX can't distinguish users at OS level | Server-enforced path isolation (implemented) |
| `--dangerously-skip-permissions` | Claude can run arbitrary Bash | Tool policy hooks can block `Bash` tool |
| Network egress unrestricted | Claude can make external HTTP calls | VPC security groups / NAT gateway controls |

## Future Work

- [ ] Whisper API fallback for voice input (Firefox, better accuracy)
- [ ] Mobile microphone button (on-screen keyboard can't detect spacebar hold)
- [ ] Scheduled cron execution of recurring intentions (currently manual trigger only)
- [ ] Jupyter notebook viewer (.ipynb cell rendering)
- [ ] CodeMirror/Monaco for proper syntax highlighting with autocomplete
- [ ] UI for editing tool policy (currently manual JSON edit)
- [ ] Run history persistence (currently in-memory only)
- [ ] Gallery publishing from workspace (write to S3 content paths)
- [ ] Per-user EFS access points (filesystem-level isolation, not just server-enforced)
- [ ] Per-user Fargate tasks (container-level isolation)
