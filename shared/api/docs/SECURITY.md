# Security Guide

## Overview
This document consolidates the security architecture and implementation details for the secure AI analysis API and secrets management. It replaces SECURITY_ARCHITECTURE.md, SECURE_AI_ANALYSIS.md, and AWS_SECRETS_SETUP.md.

## Architecture
Recommended production flow:
```
Client → CloudFront → API Gateway → Lambda → Claude API
```
Benefits:
- Request validation, rate limiting, CORS at the gateway
- DDoS protection via CloudFront + AWS controls
- Centralized logging, metrics, and tracing
- TLS termination and cert management

Development alternative:
- Local Express server at http://localhost:3003 for rapid iteration

## Implementation (API)
- Location: `api/`
- Server: Express (local) or Lambda (prod)
- Security middleware: helmet, rate limiting, CORS
- Endpoints: see `api/README.md` for full API reference

Key behaviors:
- No client-side secrets; API key retrieved server-side or mock mode in dev
- Input validation and payload size limits
- Structured logging without sensitive data

## Secrets Management (AWS Secrets Manager)
- Default secret name: `prod/proto-portal/claude-api-key`
- Region: `us-east-1`
- Secret format (JSON):
```json
{ "apiKey": "sk-ant-api03-your-actual-api-key-here" }
```
- Required IAM permission: `secretsmanager:GetSecretValue` for the secret ARN

Environment variables:
```bash
AWS_SECRETS_ENABLED=true
AWS_REGION=us-east-1
CLAUDE_SECRET_NAME=prod/proto-portal/claude-api-key
CLAUDE_API_URL=https://api.anthropic.com/v1/messages
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

Local development options:
- Use `.env` with `AWS_SECRETS_ENABLED=false` and `CLAUDE_API_KEY=...`
- Or test Secrets Manager locally if AWS CLI is configured
- Or run mock mode (no key) for dev

## API usage and auth
- Development base URL: `http://localhost:3003`
- Production base URL: API Gateway URL for your stage
- Production auth: include `X-API-Key` header (see `api/README.md`)

## Data handling
- Only analysis-related data is sent to the AI provider
- HTTPS-only; no server-side storage of user API keys
- Logs never include full secret values

## Deployment
- Infrastructure via Terraform in `terraform/`
- S3 + CloudFront for static site
- API Gateway + Lambda for the secure API
- See `DEVELOPMENT_AND_DEPLOYMENT.md` for deployment overview; see `api/README.md` for API details

## Troubleshooting
- 401: invalid Claude API key configuration
- 429: provider rate limit exceeded
- Secrets not found: verify name/region/IAM
- CORS: ensure allowed origins include your frontend

## References
- API details: `api/README.md`
- Terraform: `terraform/*.tf`
- Local proxy: `scripts/dev-proxy.js`

## API access controls and restricting use to approved prototypes

This section documents how the deployed Lambda-backed API is currently exposed and whether it is protected from use by non-approved clients.

### What protects the API today
- CORS is enforced by the Express app and limited in production to `https://portfolio.cookinupideas.com` (via `CORS_ORIGIN`). This limits calls from browsers not running on the approved origin.
- Basic rate limiting is enabled at the application layer and keyed by client IP.
- Secrets for upstream AI providers are stored in AWS Secrets Manager and never exposed to clients.

### Gaps (why other applications can still call it)
- API Gateway methods are configured with anonymous access (no AWS IAM auth, no JWT/Cognito, and no API Gateway API key requirement).
- A public Lambda Function URL is configured with `authorization_type = "NONE"` (if enabled), which allows direct invocation outside the browser and bypasses CORS entirely.
- Application-layer API key auth is currently skipped for the AI analysis endpoints, so requests to those endpoints are not challenged for a key.
- CORS only restricts browsers; non-browser clients (e.g., curl, server-side scripts) can still invoke the API endpoints directly.

Conclusion: as currently configured, the deployed API is not restricted strictly to “approved prototypes.” It can be invoked by any client that knows the URL.

### Recommendations to restrict access

Short-term (fastest to implement):
- Enforce API key auth in the app for AI endpoints by removing the skip and requiring `X-API-Key` on all protected routes. Issue per-prototype keys and inject them at build time as environment variables. Keep server-side rate limiting.
- Disable the Lambda Function URL entirely (or set it to `AWS_IAM`) so API access goes only through API Gateway.

More robust (recommended for production):
- Put API Gateway behind CloudFront as a second origin and configure CloudFront to add a private header (for example, `X-Edge-Auth: <random-secret>`) on origin requests. Attach AWS WAF to API Gateway to block requests missing or with an incorrect header. This ensures browsers cannot exfiltrate the secret and only traffic coming via your CloudFront distribution reaches the API.
- Alternatively or additionally, require API Gateway API keys and a Usage Plan for rate limiting. This is suitable for prototypes but note that any key embedded in browser code can be copied; prefer the CloudFront+WAF header approach to keep secrets off the client.
- If you need identity-aware access, use a Lambda authorizer or Cognito JWT authorizer at API Gateway.

Implementation pointers (in this repo):
- Disable or lock down Lambda Function URL: manage in `terraform/lambda-api.tf` (remove it or set `authorization_type = "AWS_IAM"`).
- Require API keys at API Gateway: set `api_key_required = true` on methods and add `aws_api_gateway_api_key`, `aws_api_gateway_usage_plan`, and `aws_api_gateway_usage_plan_key` resources in Terraform.
- Enforce app-layer key until gateway auth is in place: require `X-API-Key` on AI routes in `shared/api/` and remove any auth bypass on those paths.
- For the CloudFront+WAF pattern: add API Gateway as a CloudFront origin with a behavior for `/api/*`, configure a secret header in the origin request policy, and attach an `aws_wafv2_web_acl` to the API Gateway stage that validates the header.

Operational hardening:
- Keep CORS restricted to the exact production origin.
- Monitor 4xx/5xx rates and WAF blocks; alert on spikes.
- Rotate API keys and the CloudFront secret header periodically.

### Temporary allowances during rollout
- Per request to keep prototypes working without embedding a client key:
  - API Gateway `api_key_required` is temporarily disabled on the proxy method, so calls from the site do not need a client API key.
  - `TEMP_ALLOW_NO_CLIENT_KEY=true` is set on the Lambda, and `authMiddleware` bypasses client-key checks when this flag is present.
  - Deployed assets are configured to call the API Gateway execute-api.* URL (not the Lambda Function URL), and CORS is enforced at the app to allow `https://portfolio.cookinupideas.com`.
  - When ready to re-enable keys, unset the TEMP flag and set `api_key_required=true` again; then issue per‑prototype keys and rotate regularly.

Note on API key budget/limits:
- The supplied API key(s) used for client access are constrained by an API Gateway usage plan and by a limited provider budget to hedge against abuse by outside sources. Keep limits tight during pilots and raise gradually as needed, monitoring usage and error rates.
