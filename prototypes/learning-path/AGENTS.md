# Agent Instructions: Learning Path (Recipes Explorer)

## What This Prototype Demonstrates

An interactive geospatial recipe explorer with clustered cuisine nodes, a parchment-styled world cuisines list with progress tracking, and pre-computed country boundary shapes for viewport-aware rendering. Users explore world cuisines through a synchronized two-section layout where selecting a recipe in one section highlights it in the other.

**Why it matters for a portfolio**: Shows ability to build performant geospatial visualization with pre-computed boundaries, synchronized multi-section interactions, progress tracking state management, and responsive design across mobile and desktop.

## Architecture Decisions

- **Two synchronized sections**: Section1 (clustered recipe nodes with map) and Section2 (parchment-styled list with progress tracking) share state through the parent App component. Selecting a recipe in either section updates both.
- **Pre-computed country boundaries**: Country shapes are computed at build time for the viewport rather than calculated on the fly, which was a key performance optimization.
- **Progress tracking**: Each recipe has a 0-3 progress level tracked in `recipeProgress` state (stored as `Record<string, number>`). The `initialRecipeProgress` seed comes from `src/data/recipes.ts`.
- **Modal recipe detail**: Clicking a recipe opens a Radix UI dialog with full details and a progress increment button.
- **No backend needed**: This prototype is entirely client-side with static recipe data.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | State coordination between sections, recipe dialog |
| `src/components/Section1.tsx` | Clustered recipe nodes with map visualization |
| `src/components/Section2.tsx` | Parchment-styled cuisines list with country shapes |
| `src/components/Navigation.tsx` | Top nav with instructions trigger |
| `src/data/recipes.ts` | Recipe data and initial progress seed |
| `src/types.ts` | `CuisineCluster`, `Recipe` type definitions |

## Development

```bash
# Start dev server (port 3006, opens browser automatically)
yarn dev:learning-path      # from monorepo root
npm run dev                 # from this directory

# Tests
npm test                    # Unit tests (Jest, --passWithNoTests)
npm run test:e2e            # Playwright E2E

# Build
npm run build
```

## Gotchas

- The vite config has `open: true` — it will open a browser tab automatically when you start the dev server.
- Section3 was removed for performance reasons (see comment in App.tsx). Don't re-add a third section without profiling first.
- Country boundary computation is the performance-critical path. If you modify Section2's map rendering, profile the boundary calculations.
- The vite base path is `/prototypes/learning-path/`.
- `--passWithNoTests` is set on the test script — there are currently no unit tests. E2E tests exist in `e2e/`.

## Deployment

Built and deployed as part of the monorepo: `yarn build:learning-path` outputs to `dist/prototypes/learning-path/`.

Production URL: `https://portfolio.cookinupideas.com/prototypes/learning-path/`

## Related

- [Root AGENTS.md](../../AGENTS.md) — Monorepo overview
- [Shared Design Tokens](../../shared/design-tokens/) — Theme system
