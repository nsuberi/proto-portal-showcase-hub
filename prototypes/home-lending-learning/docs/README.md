# Home Lending Learning: Prototype Docs

## Design tokens
- Uses shared CSS tokens and utilities from `@proto-portal/design-tokens`.
- Tailwind extends from `baseTailwindConfig` for consistent semantics.

## Shared secure API
- Dev: `http://localhost:3003`
- Prod: API Gateway + Lambda endpoint (see `docs/SECURITY.md` and `docs/API.md`)
- Can consume the analysis API for assessment features; supports mock mode in dev.

## Local notes
- Dev server: port 3002
- Preview production build and verify routing.
