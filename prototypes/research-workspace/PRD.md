# Research Workspace — Product Requirements Document

## Vision

Built on one principle: **users state intentions and organize their information**, while Claude Code handles execution.

An AI-powered research workspace where users set research intentions (papers, synthesis tasks, comparative reviews), trigger them as background Claude Code sessions, and view results as structured markdown, code assets, and architecture diagrams — all within a glassmorphism-styled multi-panel web interface with real-time observability into agent tool use via Claude Code hooks. Users decide what to research, when to run, and what to publish. Nothing auto-publishes; the user curates their vault and explicitly shares what they choose.

## Users

- Researchers exploring ML/AI papers and generating structured reviews
- Developers building code assets derived from paper architectures
- Portfolio visitors evaluating the builder's dev maturity and AI integration skills

## Architecture

```
CloudFront
├── /prototypes/research-workspace/vault/api/vault/published*  →  ALB → ECS (no auth, public)
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
- Tool use events logged via Claude Code hooks (`.claude/hooks/log-activity.js`)
- Run status tracking: running → completed/failed/cancelled
- Output buffer (100KB rolling) for late-joining WebSocket clients

### 4. Claude Code Hooks — Enterprise Controls Demo (Shipped)

PreToolUse hook (`log-activity.js`) fires before every tool invocation:
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

### 8. Publishing System (Shipped)

Publish vault files to the public gallery with tag-based categorization:
- `POST /api/vault/publish` — publishes a vault markdown file as a gallery item
- Auto-extracts title (first `#` heading) and summary (first non-heading paragraph) from markdown
- Generates stable ID: `pub-{userId}-{slug}`
- Tag system: existing tags suggested + content-derived tags from headings/bold phrases
- Writes snapshot to `/workspace/published/{id}.json` and forwards to Lambda API for public access
- `GET /api/vault/published` — list all published items (no auth required)
- `PublishDialog.tsx` component with tag selection UI

### 9. Chat Panel (Shipped)

WebSocket-based Claude Code interaction at `/api/vault/chat`:
- Spawns `claude -p "{prompt}" --output-format stream-json` for each message
- Session continuity via `--resume {sessionId}`
- Auth flow integration: `/login` command triggers `claude auth login --claudeai`
- Returns structured events: `assistant_text`, `tool_use`, `done`, `auth_url`, `error`
- Tool use badges displayed inline (Read, Write, Bash, Glob, Grep, WebFetch)
- Markdown rendering of Claude responses

### 10. Session Config Panel (Shipped)

Read-only viewer for Claude Code configuration at `GET /api/vault/config`:
- Displays configured skills from `.claude/skills/` directory
- Shows hook configuration from `settings.json`
- Lists tool policy (blocked tools from `.claude/tool-policy.json`)
- No editing — config is managed by the server initialization

### 11. Scheduler (Shipped)

Automated recurring intention execution:
- `runScheduler()` executes every 60 seconds
- Iterates all vaults, checks `.intentions.json` for recurring schedules
- Spawns PTY sessions when due (same pattern as manual runs)
- Schedule options: 1x/2x/4x/8x per day, optional end date
- Completion detection via output volume (>500 bytes) + idle timer (3s silence)
- Auto-sends `/exit` after task completes
- Logs events to `.scheduler-log.jsonl` per vault (timestamp, intentionId, event, runId, error)
- Updates `lastRunAt` in `.intentions.json` to track schedule adherence

### 12. Onboarding Flow (Shipped)

Detects Claude Code readiness at `GET /api/vault/onboarding-status`:
- Three states: `not_launched` (no `.claude.json`), `not_onboarded` (no settings), `not_authenticated` (no credentials)
- Frontend gates run launches with a helpful modal explaining what's needed
- Auth note in Intentions panel warns about token storage and recommends scoped API keys

### 13. Vault Download/Export (Shipped)

Download folder contents or entire vault as a ZIP file:
- `GET /api/vault/download?path=<folder>` — download specific folder
- `GET /api/vault/download` — download entire vault
- Excludes dotfiles (`.claude/`, `.intentions.json`, `.tool-activity.jsonl`, etc.)
- Streams ZIP via `archiver` (constant memory usage regardless of vault size)
- Download buttons in file browser header (full vault) and per-folder on hover

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

### Current Limitation: Single Shared ECS Task

All users share one ECS Fargate task (`desired_count=1`, 1 vCPU, 2 GB, ARM64). User isolation is enforced at the **application layer** via Cognito JWT parsing + `sanitizePath()` + per-user HOME directories. There is one EFS access point (hardcoded to `/users/nathan`). Users share the same container PID namespace, Linux UID (1000), and network stack.

**Suitable for:** Internal teams, trusted users, portfolio demonstrations.
**Not suitable for:** Multi-tenant production with untrusted users.

### Isolation Maturity Tiers

| Tier | Model | Isolation | Monthly Cost (5 users) | Cold Start |
|------|-------|-----------|----------------------|------------|
| **Current** | Shared task, app-layer paths | Application | ~$14 (Spot) | 0s (always on) |
| **Tier 2** | Per-user Fargate tasks | Container + application | ~$24 (Spot, 8hr/day) | 45-170s |
| **Tier 3** | Per-user tasks + per-user EFS APs | Container + kernel | ~$24 (Spot, APs free) | 45-170s |

Per-user task cold-start breakdown: ECS placement (5-15s) + image pull (10-30s, cached after first) + Express boot (3-5s) + health check (30-120s). Mitigable with faster health checks (~20s total), pre-warming (~$14/mo Spot), or loading screen UX.

Per-user EFS access points are free ($0). They provide kernel-level NFS isolation but only make practical sense when combined with per-user tasks, since a shared container would need dynamic NFS mounts.

### Remaining Gaps

| Gap | Impact | Mitigation Path |
|-----|--------|-----------------|
| Single ECS task serves all users | Shared container memory/processes, PID namespace visible to all | Per-user Fargate tasks (~$24/mo Spot for 5 users, 45-170s cold start) |
| Single EFS access point | All vaults under one mount, isolation is app-enforced only | Per-user EFS access points (free, requires per-user tasks) |
| All users run as UID 1000 | POSIX can't distinguish users at OS level | Server-enforced path isolation (implemented) |
| `--dangerously-skip-permissions` | Claude can run arbitrary Bash | Tool policy hooks can block `Bash` tool |
| Network egress unrestricted | Claude can make external HTTP calls | VPC security groups / NAT gateway controls |

## Future Work

- [ ] Whisper API fallback for voice input (Firefox, better accuracy)
- [ ] Mobile microphone button (on-screen keyboard can't detect spacebar hold)
- [ ] Jupyter notebook viewer (.ipynb cell rendering)
- [ ] CodeMirror/Monaco for proper syntax highlighting with autocomplete
- [ ] UI for editing tool policy (currently manual JSON edit)
- [ ] Run history persistence (currently in-memory only)
- [ ] Wiki-link `[[]]` remark plugin for Milkdown with autocomplete
- [ ] Sigma.js + graphology graph view for backlinks
- [ ] Command palette (Ctrl+P)
- [ ] Per-user EFS access points (filesystem-level isolation, not just server-enforced)
- [ ] Per-user Fargate tasks (container-level isolation, ~$24/mo Spot for 5 users)
- [x] ~~Scheduled cron execution of recurring intentions~~ — shipped (scheduler runs every 60s)
- [x] ~~Gallery publishing from workspace~~ — shipped (POST /api/vault/publish + PublishDialog UI)
- [x] ~~Vault download/export~~ — shipped (GET /api/vault/download, ZIP with dotfile exclusion)
