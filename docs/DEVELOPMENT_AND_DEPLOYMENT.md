# Development and Deployment

A combined guide to local development, deployment strategy, and workspace architecture.

## Local Development Commands

### Initial Setup
```bash
# Clone the repository
git clone <repo-url>
cd proto-portal-showcase-hub

# Install all dependencies using Yarn workspaces
yarn install --immutable

# Copy environment files for local development
cp shared/api/.env.example shared/api/.env
# Edit shared/api/.env and add your CLAUDE_API_KEY
```

### Development Workflow
```bash
# Start all services (recommended for full development)
yarn dev:all
# This starts:
# - Main portfolio (port 8080)
# - FFX Skill Map (port 3001)
# - Home Lending Learning (port 3002)
# - Documentation Explorer (port 3003)
# - Development proxy (port 8082)
# - API server (port 3004)

# Or start services individually:
yarn dev                    # Main portfolio only
yarn dev:ffx               # FFX prototype only
yarn dev:home-lending      # Home Lending prototype only
yarn dev:documentation-explorer  # Documentation Explorer prototype only
cd shared/api && npm run dev  # API server only
```

### Testing Commands
```bash
# Run unit tests for all prototypes
cd prototypes/ffx-skill-map && npm test
cd prototypes/home-lending-learning && npm test
cd prototypes/documentation-explorer && npm test

# Run integration tests (requires API server running)
cd prototypes/ffx-skill-map && npm run test:integration
cd prototypes/home-lending-learning && npm run test:integration
cd prototypes/documentation-explorer && npm run test:integration

# Run E2E tests
cd prototypes/ffx-skill-map && npm run test:e2e
cd prototypes/home-lending-learning && npm run test:e2e
cd prototypes/documentation-explorer && npm run test:e2e
```

### Build and Preview
```bash
# Build all applications
yarn build

# Build individual prototypes
yarn build:ffx
yarn build:home-lending
yarn build:documentation-explorer

# Preview production build locally
yarn preview
```

### Environment Variables (Local)
- Use `.env` files locally; never commit real secrets. Keep example files only.
- Use consistent variable names across environments; values differ by env.
- API configuration in `shared/api/.env`:
  ```bash
  CLAUDE_API_KEY=sk-ant-your-api-key-here
  AWS_SECRETS_ENABLED=false
  NODE_ENV=development
  ```

## Deployment
- Deploy static frontends to object storage behind a CDN.
- Invalidate CDN caches on release.
- Manage infrastructure with IaC (e.g., Terraform); keep changes reviewable.
- Store secrets in AWS Secrets Manager; never embed secrets in client bundles.
- Use GitHub Actions and OIDC for CI/CD and temporary cloud credentials.

## Dev/prod parity
- Match base paths and SPA fallbacks locally and in prod.
- Test production builds locally before release.
- Verify API base URLs, CORS, and secret retrieval in prod.

## GitHub Actions CI/CD Flow

The CI/CD pipeline mirrors local development commands but uses Yarn workspace features for efficiency and consistency.

### Pipeline Stages

#### 1. **Test Stage** (Runs on PRs and main branch)
```yaml
# Equivalent local commands:
yarn install --immutable
cd prototypes/ffx-skill-map && npm test
cd prototypes/home-lending-learning && npm test
```

**GitHub Actions Implementation:**
- ✅ **Yarn workspace installation**: Single `yarn install --immutable` installs all dependencies
- ✅ **Unit tests only**: Integration tests are excluded from CI using Jest `testPathIgnorePatterns`
- ✅ **Parallel execution**: Tests run concurrently for both prototypes
- ✅ **Coverage upload**: Test results and coverage reports saved as artifacts

#### 2. **Deploy Stage** (Runs on main branch after tests pass)
```yaml
# Local equivalent:
yarn install --immutable
yarn build
yarn workspaces focus @proto-portal/ai-analysis-api --production
# Deploy infrastructure and upload dist/
```

**GitHub Actions Implementation:**
- ✅ **Workspace-aware dependency management**: 
  ```yaml
  yarn workspaces focus @proto-portal/ai-analysis-api --production
  ```
- ✅ **Unified build process**: Single `yarn build` command builds all SPAs
- ✅ **Infrastructure as Code**: Terraform deploys API and CDN infrastructure
- ✅ **CDN invalidation**: Automatic cache clearing on deployment

#### 3. **Integration Tests** (Runs against production after deploy)
```yaml
# Local equivalent (against production):
cd prototypes/ffx-skill-map
BASE_URL=https://production-cdn.cloudfront.net npx playwright test
```

**GitHub Actions Implementation:**
- ✅ **Production validation**: E2E tests run against deployed application
- ✅ **Steel thread testing**: Critical user flows validated post-deployment
- ✅ **Artifact collection**: Test reports and screenshots preserved

### Key Differences: Local vs CI/CD

| Aspect | Local Development | GitHub Actions |
|--------|------------------|----------------|
| **Dependency Installation** | `yarn install --immutable` | Same - consistent lockfile |
| **Unit Tests** | Run with API integration tests | API integration tests skipped |
| **Build Process** | `yarn build` | Same - workspace-aware |
| **API Dependencies** | `npm ci` (fails with workspaces) | `yarn workspaces focus @proto-portal/ai-analysis-api --production` |
| **Environment Variables** | `.env` files | GitHub Secrets/Variables |
| **Integration Testing** | Manual with API server running | Automated against production |

### Workspace Benefits in CI/CD

1. **Single Installation**: One `yarn install` command installs dependencies for all 5 workspaces
2. **Consistent Versions**: Shared dependencies use identical versions across all SPAs
3. **Efficient Caching**: GitHub Actions can cache the entire workspace `node_modules`
4. **Workspace Commands**: Can target specific packages without `cd` navigation:
   ```bash
   yarn workspaces focus @proto-portal/ai-analysis-api --production
   ```

### Environment Configuration

**Local Development:**
```bash
# shared/api/.env
CLAUDE_API_KEY=sk-ant-your-key
AWS_SECRETS_ENABLED=false
NODE_ENV=development
```

**GitHub Actions (Production):**
```yaml
env:
  TF_VAR_claude_api_key: ${{ secrets.CLAUDE_API_KEY }}
  TF_VAR_environment: production
  AWS_SECRETS_ENABLED: true
```

## Yarn Workspace Architecture

### Why Yarn Over NPM?

This monorepo uses **Yarn workspaces** instead of npm for several critical reasons:

1. **Multiple SPAs with Shared Dependencies**: We have 4+ separate applications:
   - Main portfolio (React/Vite)
   - FFX Skill Map prototype (React/Vite with Sigma.js)
   - Home Lending Learning prototype (React/Vite)
   - Shared API server (Node.js/Express)
   - Shared design token system (TypeScript)

2. **Dependency Deduplication**: Yarn automatically deduplicates shared dependencies (React, Vite, TypeScript, etc.) across all workspaces, reducing:
   - Total disk usage (single `node_modules` hierarchy)
   - Installation time (shared packages installed once)
   - Bundle sizes (consistent dependency versions)

3. **Workspace Protocol Support**: Enables internal package references like:
   ```json
   "dependencies": {
     "@proto-portal/design-tokens": "workspace:*"
   }
   ```

4. **Consistent Tooling**: All SPAs share the same versions of ESLint, TypeScript, and build tools without duplication.

### Workspace Structure
```
proto-portal-showcase-hub/
├── package.json                 # Root workspace coordinator
├── yarn.lock                   # Single lockfile for all dependencies
├── prototypes/
│   ├── ffx-skill-map/          # Independent SPA workspace
│   └── home-lending-learning/   # Independent SPA workspace
└── shared/
    ├── design-tokens/          # Shared UI system workspace
    └── api/                    # Shared API server workspace
```

### Workspace Configuration
The root `package.json` defines workspaces:
```json
{
  "workspaces": [
    "prototypes/ffx-skill-map",
    "prototypes/home-lending-learning", 
    "shared/design-tokens",
    "shared/api"
  ]
}
```

### Local Dependency Management
```bash
# Install dependencies for ALL workspaces
yarn install --immutable

# Install for specific workspace
yarn workspace @proto-portal/ffx-skill-map add react-router-dom

# Install production dependencies for specific workspace
yarn workspaces focus @proto-portal/ai-analysis-api --production

# Add shared development dependencies at root
yarn add -D eslint typescript --ignore-workspace-root-check
```

### Build → Deploy Flow
- `yarn build` generates:
  - `dist/index.html` for the portfolio hub
  - `dist/prototypes/<prototype>/` for each prototype
- Upload `dist/` to storage; CDN serves `/` and `/prototypes/<prototype>/` with SPA fallback.

### Cross-Package References
Prototypes import shared systems using workspace protocol:
```typescript
// FFX prototype imports shared design tokens
import { baseTailwindConfig } from "@proto-portal/design-tokens";

// Resolved locally during development
// Bundled/built during production builds
```

### Adding a New Prototype

When implementing a new prototype, several components need to be updated to ensure proper local development and production deployment:

#### 1. Create the Prototype Workspace
```bash
# Create the new prototype directory
mkdir prototypes/new-prototype-name
cd prototypes/new-prototype-name

# Initialize with package.json, src/, etc.
# Import shared design tokens as needed
```

#### 2. Update Root Workspace Configuration
Add the new prototype to the root `package.json`:
```json
{
  "workspaces": [
    "prototypes/ffx-skill-map",
    "prototypes/home-lending-learning",
    "prototypes/documentation-explorer",
    "prototypes/new-prototype-name",  // Add this line
    "shared/design-tokens",
    "shared/api"
  ]
}
```

#### 3. Update Local Development Proxy
Update `scripts/dev-proxy.js` to include the new prototype:
```javascript
const prototypes = [
  { name: 'ffx-skill-map', port: 3001 },
  { name: 'home-lending-learning', port: 3002 },
  { name: 'documentation-explorer', port: 3003 },
  { name: 'new-prototype-name', port: 3005 }  // Add this line
];
```

#### 4. Update Build Script
Update `scripts/build.sh` to build and copy the new prototype:
```bash
# Build New Prototype
echo "🔧 Building New Prototype..."
yarn workspace @proto-portal/new-prototype-name build

# Copy New Prototype build to main dist directory
echo "📋 Copying New Prototype build to main dist..."
mkdir -p dist/prototypes/new-prototype-name
cp -r prototypes/new-prototype-name/dist/* dist/prototypes/new-prototype-name/
```

#### 5. Update CloudFront Configuration
**Critical:** Update the CloudFront function in `terraform/main.tf` to include the new prototype:

```javascript
// In the CloudFront function viewer-request code:
if (prototypeName === 'ffx-skill-map' || 
    prototypeName === 'home-lending-learning' || 
    prototypeName === 'documentation-explorer' ||
    prototypeName === 'new-prototype-name') {  // Add this condition
    request.uri = '/prototypes/' + prototypeName + '/index.html';
}
```

#### 6. Add CloudFront Cache Behavior
Add a cache behavior for the new prototype in `terraform/main.tf`:
```hcl
# New Prototype cache behavior
ordered_cache_behavior {
  path_pattern           = "/prototypes/new-prototype-name/*"
  allowed_methods        = ["GET", "HEAD", "OPTIONS"]
  cached_methods         = ["GET", "HEAD"]
  target_origin_id       = "S3-${var.bucket_name}"
  compress               = true
  viewer_protocol_policy = "redirect-to-https"
  
  function_association {
    event_type   = "viewer-request"
    function_arn = aws_cloudfront_function.prototype_router.arn
  }
}
```

#### 7. Add Development Scripts
Update root `package.json` with development scripts:
```json
{
  "scripts": {
    "dev:new-prototype": "yarn workspace @proto-portal/new-prototype-name dev",
    "build:new-prototype": "yarn workspace @proto-portal/new-prototype-name build"
  }
}
```

#### 8. Update Portfolio Links
Add the new prototype to the main portfolio's prototype list in `src/components/Portfolio.tsx`.

**Important Notes:**
- The CloudFront function update is critical for production routing
- Cache behaviors ensure proper CDN caching for the new prototype
- Local proxy configuration enables the unified development experience
- Build script updates ensure the prototype is included in production builds

**Testing Checklist:**
- [ ] Local development: `yarn dev:all` serves the new prototype
- [ ] Build process: `yarn build` includes the new prototype in `dist/`
- [ ] Production routing: CloudFront correctly routes `/prototypes/new-prototype-name/` requests

Related docs:
- Security and secrets: `./SECURITY.md`
- Testing: `./TESTING.md`
- Design tokens & responsive: `./DESIGN_TOKENS.md`
