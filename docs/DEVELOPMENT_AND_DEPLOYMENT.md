# Development and Deployment

A combined guide to local development, deployment strategy, and workspace architecture.

## Local development
- Run SPAs on `http://localhost` with consistent base paths to mirror production routing.
- Prefer a single local entry point (proxy) that forwards to each SPA.
- Smoke-test a production build locally (build + static preview) before release.
- FFX Skill Map runs on port 3001 during development.

### Environment variables (local)
- Use `.env` files locally; never commit real secrets. Keep example files only.
- Use consistent variable names across environments; values differ by env.

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

## CI/CD flow (GitHub Actions)
- PRs: lint, type-check, tests, build checks.
- Main: build, apply infra, upload artifacts, invalidate CDN.

## Workspaces and build architecture (Yarn)
- Yarn workspaces deduplicate dependencies and simplify cross-package references.
- Prototypes import shared tokens (`@proto-portal/design-tokens`) for consistency.
- Unified build produces an integrated `dist/` with subpaths per prototype.

### Local dependency management
- `yarn install --immutable` to ensure deterministic installs.
- Shared dev tooling (ESLint/TS) lives at the root; apps inherit configs.

### Build → Deploy flow
- `yarn build` generates:
  - `dist/index.html` for the portfolio hub
  - `dist/prototypes/<prototype>/` for each prototype
- Upload `dist/` to storage; CDN serves `/` and `/prototypes/<prototype>/` with SPA fallback.

### Adding a new prototype (high level)
- Create `prototypes/<name>` workspace.
- Import shared tokens in CSS and Tailwind; add overrides as needed.
- Include in the unified build and ensure subpath routing works locally and in prod.

Related docs:
- Security and secrets: `./SECURITY.md`
- Testing: `./TESTING.md`
- Design tokens & responsive: `./DESIGN_TOKENS.md`
