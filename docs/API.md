# API Overview

Secure backend for AI analysis supporting local development and cloud deployment.

- Local: Express server on `http://localhost:3003`
- Production: API Gateway + Lambda behind CloudFront
- Auth: API key (HMAC-SHA256) via `X-API-Key`
- Security: helmet, rate limiting, CORS, payload limits, structured logging

Endpoints and setup details are implemented in `shared/api/`.

Related docs:
- Security and secrets: `./SECURITY.md`

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp shared/api/.env.example shared/api/.env
   # Edit .env and add your Claude API key
   ```

3. **Start the development server:**
   ```bash
   npm run dev:all
   ```

The API will be available at `http://localhost:3003`

## Environment Configuration

### Local Development (.env file)
```bash
CLAUDE_API_KEY=sk-ant-your-api-key-here
AWS_SECRETS_ENABLED=false
NODE_ENV=development
```

### Production (AWS Secrets Manager)
```bash
AWS_SECRETS_ENABLED=true
CLAUDE_SECRET_NAME=prod/proto-portal/claude-api-key
AWS_REGION=us-east-1
NODE_ENV=production
```

### Mock Mode (Development without API key)
```bash
# Don't set CLAUDE_API_KEY
AWS_SECRETS_ENABLED=false
NODE_ENV=development
```

## Testing the API

### Health Check
```bash
curl http://localhost:3003/health
```

### Test with E2E Tests
```bash
# From FFX prototype
cd prototypes/ffx-skill-map
npm run test:e2e -- e2e/api-claude-integration.spec.ts

# From Home Lending prototype
cd prototypes/home-lending-learning
npm run test:e2e -- e2e/api-claude-integration.spec.ts
```
