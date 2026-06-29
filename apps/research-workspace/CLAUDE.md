# Research Workspace Backend

Express.js server with 2 WebSocket servers (chat, run output streams) plus file CRUD and a quota-gated agent run manager. Agent execution uses the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) authenticated by a single operator `ANTHROPIC_API_KEY` (commercial API) — there is no per-user Claude subscription OAuth and no interactive PTY terminal.

## Quick Reference

- **Entry**: `src/server.js` (ESM). Agent calls go through `src/claude-runner.js`; per-user budgets through `src/quota.js`.
- **Port**: 8080, `VAULT_ROOT=/workspace`
- **Container**: `node:20-slim` + Agent SDK (bundles the Claude engine) + AWS CLI
- **Auth**: user identity from ALB Cognito JWT (GitHub OAuth) → per-user vault. Agent auth = operator `ANTHROPIC_API_KEY` (from Secrets Manager).
- **Path stripping**: ALB sends `/prototypes/research-workspace/vault/api/vault/tree` → middleware strips prefix → `/api/vault/tree`

## Server Structure (server.js)

1. Path prefix middleware (strips VAULT_BASE_PATH)
2. CORS middleware (allows `X-Project-Id`) + `[http]` request logger
3. Identity middleware → `req.userId`, GitHub claims, `req.projectId`
4. Quota: `GET /api/vault/quota`
5. Profile + Projects + Sources: `GET /api/vault/me`, `GET|POST /api/vault/projects`, `GET /api/vault/sources`
6. File CRUD: `GET|PUT|POST|DELETE|PATCH /api/vault/files/*`
7. Tree/links/search endpoints
6. Activity log: `GET|DELETE /api/vault/activity`
7. **Run manager**: `POST|GET /api/vault/runs`, `DELETE /api/vault/runs/:id` (SDK runs, quota-gated)
8. WebSocket upgrade handler (routes by pathname)
9. Terminal WSS: retired — returns a notice and closes
10. Chat WSS: Agent SDK stream → `init` / `assistant_text` / `tool_use` / `quota` / `blocked` / `done` events
11. Run WSS: read-only run-log stream
12. Publishing: `POST /api/vault/publish`, `GET /api/vault/published`, `GET /api/vault/published/:id`
13. Config: `GET /api/vault/config`
14. Folder creation: `POST /api/vault/folders/*`
15. Vault download: `GET /api/vault/download`
16. Vault size enforcement middleware
17. Scheduler: `runScheduler()` — OFF unless `ENABLE_SCHEDULER=1`; quota-gated when on
18. Startup: `initClaudeCodeConfig()` + `hardenUserVault()`

## Run Manager & Quota

Runs and chat both call `runAgent()` (`src/claude-runner.js`), which drives the Agent SDK `query()` with `cwd`/`HOME` = the user's vault, `permissionMode: 'bypassPermissions'`, and `settingSources: ['project']` so the vault's `.claude/skills` + `.claude/settings.json` command hooks load. Default model is Haiku 4.5 (synthesis/review opt up to Sonnet 4.6).

Every run is gated by `src/quota.js` (DynamoDB-backed; in-memory fallback for local dev when `QUOTA_TABLE` is unset): allowlist → per-user runs/day (5) + $/day ($5) + concurrency (1) → org daily cap. The per-run `maxBudgetUsd` is `min($1, remaining)`. Cost (`total_cost_usd`) is recorded on completion; the run WS streams a readable log (not a TUI). Runs are not interactive.

Tool activity is still logged via the Claude Code command hook (`.claude/hooks/log-activity.js`), loaded through `settingSources`.

## Env Vars

`ANTHROPIC_API_KEY` (required, from Secrets Manager) · `QUOTA_TABLE` (DynamoDB; unset → in-memory dev mode) · `ALLOWLIST` (comma-separated Cognito subs; empty → open) · `ENABLE_SCHEDULER` (`1` to enable recurring runs) · `AWS_REGION` · `VAULT_ROOT` · `PORT` · `MAX_VAULT_SIZE_MB`.

## Projects (isolated workspaces) & Sources

Each user vault holds multiple **projects** — isolated mini-vaults at `vaults/{userId}/projects/{projectId}/`, each with its own `.tree.json`, `.sources.json`, leaves, and `.claude/`. A `.projects.json` manifest at the user base lists them. `getUserVaultRoot(userId, projectId='default')` and `ensureUserVault(userId, projectId='default')` are project-aware; the active project comes from `req.projectId` (the `X-Project-Id` header, or `?project=` on the chat WS), defaulting to `default` — so older single-vault call sites keep working unchanged.

**Sources:** `WebSearch`/`WebFetch` `tool_use` events are captured by `recordSource()` (in the chat WS + run-manager `onEvent`) and de-duped into the project's `.sources.json`. `GET /api/vault/sources` returns them for the Sources panel + source-reliability meta-questions.

## Adding Routes

Use short paths: `/api/vault/new-route` (not the full CloudFront path). The prefix stripping middleware handles translation. New per-project endpoints should resolve the vault via `ensureUserVault(req.userId, req.projectId)`.

## Development

```bash
npm run dev   # node --watch on port 8080
```

SPA dev server (port 3009) proxies to localhost:8080 for API calls. Locally, set `ANTHROPIC_API_KEY` in your env; with `QUOTA_TABLE` unset the quota store is in-memory and the allowlist is open.

## Deploy

See `../../prototypes/research-workspace/AGENTS.md` for the full deploy checklist. Key: server.js changes require Docker rebuild + ECR push + ECS force-deploy.
