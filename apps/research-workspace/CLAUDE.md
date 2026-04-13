# Research Workspace Backend

Express.js server with 3 WebSocket servers (terminal, chat, run streams), file CRUD, and concurrent Claude Code run manager.

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
11. Run WSS: read-only stream of run output
12. Startup: `initClaudeCodeConfig()` + `hardenTokenStorage()`

## Run Manager

Runs use `spawn` (not PTY) with `--output-format stream-json --verbose`. The server parses JSON events, formats them as ANSI-colored text, broadcasts to WebSocket clients, and logs tool use to `.tool-activity.jsonl`.

**Do not use PTY for runs** — Claude Code with `-p` in a PTY has auth/TUI issues. PTY is only for the interactive terminal.

## Adding Routes

Use short paths: `/api/vault/new-route` (not the full CloudFront path). The prefix stripping middleware handles translation.

## Development

```bash
npm run dev   # nodemon on port 8080
```

SPA dev server (port 3009) proxies to localhost:8080 for API calls.

## Deploy

See `../../prototypes/research-workspace/AGENTS.md` for the full 4-layer deploy checklist. Key: server.js changes require Docker rebuild + ECR push + ECS force-deploy.
