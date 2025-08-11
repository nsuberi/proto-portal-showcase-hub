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

## CORS Configuration & API Gateway Setup

### CORS Settings
The API Gateway is configured with specific CORS settings to support prototype applications:

**Allowed Origins:**
- `https://portfolio.cookinupideas.com` (production domain)
- Local development origins (localhost:3000-3005, 8080, 8082)

**Allowed Headers:**
- `Content-Type`
- `Authorization`
- `X-Amz-Date`
- `X-Api-Key`
- `X-Client-Key`
- `X-Amz-Security-Token`

**Allowed Methods:**
- `GET`, `POST`, `PUT`, `OPTIONS`

### API Route Pattern Requirements

**All new endpoints MUST follow the `/api/v1/*` pattern** to work with the existing API Gateway configuration:

#### ✅ Correct Pattern
```javascript
// Backend route definition
router.post('/documentation/ask', ...)
router.get('/documentation/files', ...)

// Mounted at /api/v1 in server.js
app.use('/api/v1', documentationRoutes)

// Final URLs: 
// POST /api/v1/documentation/ask
// GET /api/v1/documentation/files
```

#### ❌ Incorrect Pattern
```javascript
// This would create /api/documentation/* routes
// which are NOT configured in API Gateway
app.use('/api', documentationRoutes)
```

### CORS Preflight Considerations

**Avoid Custom Headers:** Custom headers like `X-API-Key` trigger CORS preflight requests. For prototypes that need to work without complex CORS setup, omit custom headers:

```javascript
// Simple request (no preflight)
fetch('/api/v1/documentation/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ question })
})

// Complex request (triggers preflight)
fetch('/api/v1/documentation/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'some-key'  // ← This triggers preflight
  },
  body: JSON.stringify({ question })
})
```

### API Gateway Resource Structure

The API Gateway is configured with this resource hierarchy:
```
/ (root)
└── api/
    └── v1/
        └── {proxy+} (catches all /api/v1/* requests)
```

**Key Points:**
- All routes must be under `/api/v1/*` to be proxied to Lambda
- The `{proxy+}` resource catches all sub-paths
- OPTIONS method is configured for CORS preflight
- Lambda integration uses `AWS_PROXY` type

### API Gateway URL Replacement

**Important:** Prototypes that use the API must include a placeholder URL that gets replaced during deployment.

#### Frontend Service Configuration

Use this pattern in your service files (e.g., `documentationService.ts`):

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:3003/api' 
    : 'PLACEHOLDER_API_GATEWAY_URL/api')
```

#### Build-Time URL Replacement

The deployment process must include a step to replace `PLACEHOLDER_API_GATEWAY_URL` with the actual API Gateway URL:

```bash
# In terraform/deploy workflow, after building:
find dist/ -name "*.js" -type f -exec sed -i.bak 's|PLACEHOLDER_API_GATEWAY_URL|https://actual-api-gateway-id.execute-api.region.amazonaws.com/prod|g' {} \;
find dist/ -name "*.js.bak" -type f -delete
```

**Why This is Required:**
- Vite builds bundle the API URL at build time
- The actual API Gateway URL is only known after Terraform creates the resources
- The placeholder allows the build to succeed while enabling runtime replacement
- This pattern works for both local development and production deployment

**Current Implementation:**
- `scripts/build.sh` builds all prototypes with the placeholder
- Terraform deployment workflow replaces the placeholder with the real API Gateway URL
- Local development uses `localhost:3003` automatically

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

# From Documentation Explorer prototype
cd prototypes/documentation-explorer
npm test
```
