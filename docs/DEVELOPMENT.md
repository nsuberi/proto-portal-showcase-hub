# Development Guide

- Run SPAs locally on `http://localhost` so routing mirrors production.
- Use a single local entry point (dev proxy/reverse proxy) to forward to each SPA; keep base paths consistent.
- Always smoke-test a production build locally before release (build + static preview server).
- The FFX Skill Map app runs on port 3001 during development.

## Environment variables (local)
- Use dotenv-style files (`.env`, `.env.local`) for local-only config.
- Do not commit real secrets; keep examples in a sample file.
- Use the same variable names across environments; only values differ.

## Dev/prod parity
- Keep routing and base paths identical between dev and prod.
- Verify assets and SPA fallbacks work when served statically.
- Point to staging or realistic APIs; mock when needed but test against real endpoints before release.

## Local testing checklist
- Build with the same Node/tooling versions as CI.
- Preview the built site via a static server.
- Navigate across portfolio and all prototypes; verify subpaths and 404-to-index fallbacks.

See also:
- Security and secrets: `./SECURITY.md`
- Deployment automation: `./DEPLOYMENT.md`
- Design tokens and responsive utilities: `./DESIGN_TOKENS.md`
