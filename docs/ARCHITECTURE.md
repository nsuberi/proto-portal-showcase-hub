# Workspace Architecture

Monorepo using workspaces for a portfolio hub (main SPA) and multiple prototype SPAs sharing design tokens.

- Hub-and-spokes model with unified build output under a single site and subpaths for prototypes
- Shared `@proto-portal/design-tokens` for consistency; prototypes extend via overrides
- Build pipeline produces an integrated `dist/` with subpaths for each prototype

See also:
- Design tokens: `./DESIGN_TOKENS.md`
- Development: `./DEVELOPMENT.md`
- Deployment: `./DEPLOYMENT.md`
