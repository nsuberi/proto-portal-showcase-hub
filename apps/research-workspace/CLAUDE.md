# Research Workspace Backend

Express.js server with 3 WebSocket servers (terminal, chat, run PTY sessions), file CRUD, and concurrent Claude Code run manager.

## Quick Reference

- **Entry**: `src/server.js` (ESM, single file)
- **Port**: 8080, `VAULT_ROOT=/workspace`
- **Container**: `node:20-slim` + Claude CLI + node-pty + AWS CLI
- **Path stripping**: ALB sends `/prototypes/research-workspace/vault/api/vault/tree` → middleware strips prefix → `/api/vault/tree`

## Server Structure (server.js)

1. Path prefix middleware (strips VAULT_BASE_PATH)
2. CORS middleware
3. File CRUD: `GET|PUT|POST|DELETE|PATCH /api/vault/files/*`
4. Tree/links/search endpoints
5. Activity log: `GET|DELETE /api/vault/activity`
6. **Run manager**: `POST|GET /api/vault/runs`, `DELETE /api/vault/runs/:id`
7. Auth endpoints: `POST /api/vault/auth-code`, `DELETE /api/vault/auth`
8. WebSocket upgrade handler (routes by pathname to 3 WSS instances)
9. Terminal WSS: PTY → `claude --dangerously-skip-permissions`
10. Chat WSS: stream-json Claude with auth flow
11. Run WSS: bidirectional PTY I/O (same protocol as terminal WSS)
12. Publishing: `POST /api/vault/publish`, `GET /api/vault/published`, `GET /api/vault/published/:id`
13. Config & onboarding: `GET /api/vault/config`, `GET /api/vault/onboarding-status`
14. Folder creation: `POST /api/vault/folders/*`
15. Vault download: `GET /api/vault/download`
16. Vault size enforcement middleware
17. Scheduler: `runScheduler()` at 60s interval for recurring intentions
18. Startup: `initClaudeCodeConfig()` + `hardenUserVault()`

## Run Manager

Runs spawn a full interactive Claude Code PTY session (same as the interactive terminal). The research prompt is auto-injected after Claude Code starts up by watching for output to settle (~1.5s silence after initial activity, 10s max wait). Run WebSockets are bidirectional — clients can type input and resize, just like the main terminal. Each run tab shows the real Claude Code TUI.

Tool activity is logged via Claude Code hooks (`.claude/hooks/log-activity.js`) rather than server-side JSON parsing.

## Adding Routes

Use short paths: `/api/vault/new-route` (not the full CloudFront path). The prefix stripping middleware handles translation.

## Development

```bash
npm run dev   # nodemon on port 8080
```

SPA dev server (port 3009) proxies to localhost:8080 for API calls.

## Deploy

See `../../prototypes/research-workspace/AGENTS.md` for the full 4-layer deploy checklist. Key: server.js changes require Docker rebuild + ECR push + ECS force-deploy.
