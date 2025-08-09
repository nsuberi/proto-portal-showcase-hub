# FFX Skill Map: Prototype Docs

## Design tokens
- Imports shared tokens CSS and utilities from `@proto-portal/design-tokens`.
- Tailwind extends from `baseTailwindConfig` and applies FFX-specific chart color overrides via `createDesignTokens(presetOverrides.ffxSkillMap)`.
- Components use token-backed classes (`bg-primary`, `text-foreground`, `hover:shadow-glow`) and responsive utilities.

## Shared secure API
- Dev: `http://localhost:3003`
- Prod: API Gateway + Lambda (see root docs `docs/SECURITY.md` and `docs/API.md`)
- In dev without keys, runs in mock mode.

## Local notes
- Dev server: port 3001
- Preview production build before release to validate subpath routing

Additional theme docs:
- Light theme notes: `./LIGHT_THEME.md`
