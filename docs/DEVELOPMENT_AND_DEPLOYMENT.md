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
# - Development proxy (port 8081)
# - API server (port 3003)

# Or start services individually:
yarn dev                    # Main portfolio only
yarn dev:ffx               # FFX prototype only
yarn dev:home-lending      # Home Lending prototype only
cd shared/api && npm run dev  # API server only
```

### Testing Commands
```bash
# Run unit tests for all prototypes
cd prototypes/ffx-skill-map && npm test
cd prototypes/home-lending-learning && npm test

# Run integration tests (requires API server running)
cd prototypes/ffx-skill-map && npm run test:integration
cd prototypes/home-lending-learning && npm run test:integration

# Run E2E tests
cd prototypes/ffx-skill-map && npm run test:e2e
cd prototypes/home-lending-learning && npm run test:e2e
```

### Build and Preview
```bash
# Build all applications
yarn build

# Build individual prototypes
yarn build:ffx
yarn build:home-lending

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

### Adding a new prototype (high level)
- Create `prototypes/<name>` workspace.
- Import shared tokens in CSS and Tailwind; add overrides as needed.
- Include in the unified build and ensure subpath routing works locally and in prod.

Related docs:
- Security and secrets: `./SECURITY.md`
- Testing: `./TESTING.md`
- Design tokens & responsive: `./DESIGN_TOKENS.md`
