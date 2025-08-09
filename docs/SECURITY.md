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
- See `DEPLOYMENT.md` for static site; see `api/README.md` for API details

## Troubleshooting
- 401: invalid Claude API key configuration
- 429: provider rate limit exceeded
- Secrets not found: verify name/region/IAM
- CORS: ensure allowed origins include your frontend

## References
- API details: `api/README.md`
- Terraform: `terraform/*.tf`
- Local proxy: `scripts/dev-proxy.js`
