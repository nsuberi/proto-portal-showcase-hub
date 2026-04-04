# Agent Instructions: Shared API Server

## What This Is

An Express API proxy that provides secure access to the Claude API for all prototypes. It handles authentication, rate limiting, CORS, and secrets management. In production, it runs as a Lambda function behind API Gateway.

## Architecture

```
Prototypes → API Server (port 3004) → Claude API (api.anthropic.com)
                  │
                  ├── /health              → Service status
                  ├── /api/v1/* (POST)     → AI analysis endpoints
                  └── /api/v1/* (GET)      → Documentation endpoints
```

**Security layers**: Helmet (headers), CORS (origin whitelist), express-rate-limit (100 req/15min in prod), API key validation.

## Key Files

| File | Purpose |
|------|---------|
| `src/server.js` | Express app setup, middleware, route mounting |
| `src/routes/ai-analysis.js` | POST endpoints: skill recommendations, home lending assessment |
| `src/routes/documentation.js` | GET endpoints: documentation search and retrieval |
| `src/services/claude-service.js` | Claude API wrapper (prompt construction, response parsing) |
| `src/middleware/auth.js` | API key and JWT authentication |
| `src/middleware/error-handlers.js` | Error and 404 handlers |
| `src/utils/logger.js` | Logging utility |

## Development

```bash
cd shared/api

# Create .env from example
cp .env.example .env
# Edit .env: add CLAUDE_API_KEY=sk-ant-...

# Start dev server (port 3004, with --watch)
npm run dev

# Run tests
npm test
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `CLAUDE_API_KEY` | - | Required for AI features |
| `AWS_SECRETS_ENABLED` | `false` | Use Secrets Manager instead of .env |
| `NODE_ENV` | `development` | Controls rate limiting, CORS |
| `PORT` | `3004` | Server port |
| `CORS_ORIGIN` | localhost:3000-3005,8080,8082 | Comma-separated origins |

## CORS Origins

Default whitelist: `localhost:3000`, `3001` (FFX), `3002` (Home Lending), `3004`, `3005` (Docs Explorer), `8080` (portfolio), `8082` (dev proxy).

If you add a new prototype on a new port, add it to the CORS origins in `src/server.js`.

## API Route Pattern (Critical)

**All endpoints MUST be under `/api/v1/*`.** The API Gateway uses a `{proxy+}` resource at `/api/v1/` to catch all sub-paths. Routes outside this prefix won't be proxied to Lambda.

```javascript
// Correct: mounted at /api/v1 in server.js
app.use('/api/v1', aiAnalysisRoutes);
app.use('/api/v1', documentationRoutes);

// Wrong: /api/documentation/* is NOT configured in API Gateway
app.use('/api', documentationRoutes);
```

## Build-Time API URL Replacement

Prototypes reference the API with a placeholder that gets replaced during deployment:

```javascript
// In prototype service files:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:3004/api'
    : 'PLACEHOLDER_API_GATEWAY_URL/api');
```

The deployment process replaces `PLACEHOLDER_API_GATEWAY_URL` with the actual API Gateway URL:
```bash
find dist/ -name "*.js" -type f -exec sed -i.bak \
  's|PLACEHOLDER_API_GATEWAY_URL|https://actual-api-gateway-id.execute-api.region.amazonaws.com/prod|g' {} \;
```

This is necessary because Vite bundles the URL at build time, but the API Gateway URL is only known after Terraform creates the resources.

## CORS Preflight Avoidance

Custom headers like `X-API-Key` trigger CORS preflight (OPTIONS) requests. For prototypes that need to work without complex CORS setup, use simple requests:

```javascript
// Simple request (no preflight)
fetch('/api/v1/documentation/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question })
});

// This triggers preflight — avoid unless needed:
fetch('/api/v1/documentation/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': 'key' },
  body: JSON.stringify({ question })
});
```

## Security Posture & Known Gaps

**What protects the API today:**
- CORS limited in production to `https://portfolio.cookinupideas.com`
- Rate limiting keyed by client IP
- Secrets in AWS Secrets Manager (never exposed to clients)

**Known gaps:**
- API Gateway methods use anonymous access (no IAM auth, no JWT, no API key requirement)
- CORS only restricts browsers — non-browser clients (curl, scripts) can call the API directly
- `TEMP_ALLOW_NO_CLIENT_KEY=true` is set on Lambda, bypassing client-key checks

**Temporary allowance:** API Gateway `api_key_required` is disabled and `authMiddleware` bypasses client-key checks when `TEMP_ALLOW_NO_CLIENT_KEY=true`. This keeps prototypes working without embedding client keys. To re-enable: unset the flag, set `api_key_required=true`, issue per-prototype keys.

**Recommended hardening (when ready):**
1. Disable Lambda Function URL or set to `AWS_IAM`
2. Put API Gateway behind CloudFront as a second origin with a private header (`X-Edge-Auth`)
3. Attach AWS WAF to API Gateway to reject requests without the header
4. Require API Gateway API keys with a Usage Plan

See `terraform/lambda-api.tf` for the relevant resources.

## Gotchas

- Rate limiting is effectively disabled in development (uses a fixed key for all requests).
- The Lambda deployment excludes `.env`, `node_modules`, test files, and `@types` — see `lambda-api.tf` for the archive file configuration.
- In production, the Claude API key comes from AWS Secrets Manager (`prod/proto-portal/claude-api-key`), not from environment variables.
- The `trust proxy` setting is required for Lambda/API Gateway to correctly resolve client IPs for rate limiting.

## Related

- [Root AGENTS.md](../../AGENTS.md) — Monorepo overview
- [Terraform lambda-api.tf](../../terraform/lambda-api.tf) — Lambda packaging and API Gateway config
