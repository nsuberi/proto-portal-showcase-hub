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

### 3. Concurrent Background Runs (Shipped)

- `POST /api/vault/runs` spawns `claude -p "..." --output-format stream-json --verbose --dangerously-skip-permissions`
- Multiple runs execute simultaneously as separate processes
- Each run gets its own terminal tab with ANSI-colored formatted output
- Tool use events logged to `.tool-activity.jsonl` tagged with runId
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

## Future Work

- [ ] Whisper API fallback for voice input (Firefox, better accuracy)
- [ ] Mobile microphone button (on-screen keyboard can't detect spacebar hold)
- [ ] Scheduled cron execution of recurring intentions (currently manual trigger only)
- [ ] Jupyter notebook viewer (.ipynb cell rendering)
- [ ] CodeMirror/Monaco for proper syntax highlighting with autocomplete
- [ ] Per-tool allow/deny policies in hooks (enterprise controls UI)
- [ ] Run history persistence (currently in-memory only)
- [ ] Gallery publishing from workspace (write to S3 content paths)
