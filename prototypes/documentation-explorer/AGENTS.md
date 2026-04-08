# Agent Instructions: Agent Memory & Skills Explorer

## What This Prototype Demonstrates

An interactive explorer that visualizes how Claude Code is configured for this portfolio project — the agent's persistent memories, reusable skills (slash commands), and the system concepts that tie them together. Items float as animated elements color-coded by type (memories in amber, skills in violet, concepts in teal), with full markdown rendering when clicked.

**Why it matters for a portfolio**: Shows understanding of AI agent configuration as a first-class engineering concern — not just "using AI" but building transparent, maintainable systems around it. Demonstrates the layered approach: CLAUDE.md for operations, AGENTS.md for architecture, skills for workflows, memory for cross-session context.

## Architecture Decisions

- **Category-based color coding**: Floating items use distinct color families (amber/violet/teal) to visually distinguish memories, skills, and concepts at a glance.
- **Real content, not mock data**: The floating items contain actual memory and skill content from this project's `.claude/` directory structure.
- **AI-powered search**: Natural language queries are processed through the shared Claude API proxy to find relevant agent configuration files.
- **Floating card UI**: Items appear as animated floating elements (Framer Motion) that users can click into, expand, and read.
- **Markdown rendering**: Uses `react-markdown` with `remark-gfm` for GitHub-flavored markdown support.
- **Manual chunk optimization**: Vite config uses `manualChunks` to split framer-motion and react-markdown into separate bundles.
- **Instructions modal**: First-time visitors see an onboarding modal explaining the three layers of agent configuration.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Routes + instructions modal state (localStorage persistence) |
| `src/pages/DocumentationExplorer.tsx` | Main search/browse interface with floating items and category colors |
| `src/data/documentsData.ts` | Memory, skill, and concept data with category metadata |
| `src/components/Navigation.tsx` | Top nav with "Agent Memory & Skills" branding |
| `src/components/InstructionsModal.tsx` | Onboarding explaining the three configuration layers |
| `src/services/documentationService.ts` | API client for Claude-powered search |
| `vite.config.ts` | Manual chunk splitting, shared alias config |

## Development

```bash
# Start dev server (port 3005)
yarn dev:documentation-explorer    # from monorepo root
npm run dev                        # from this directory

# For AI search, also start the API server:
cd ../../shared/api && npm run dev    # port 3004

# Tests
npm test                    # Unit tests (Jest)
npm run test:e2e            # Playwright E2E
npm run test:integration    # Requires API server on port 3004

# Build
npm run build
```

## Gotchas

- **Port is 3005, not 3003.** The vite.config explicitly sets port 3005. The API server is on 3004.
- The `manualChunks` config in vite means build output has separate chunks for framer-motion and react-markdown. If adding large dependencies, consider adding them to the chunk config.
- The instructions modal auto-shows on first visit and persists its "seen" state in `localStorage['agent-memory-skills-instructions-seen']`.
- The vite base path is `/prototypes/documentation-explorer/`.
- The `DocumentData` interface is defined in both `documentsData.ts` (with required `category`) and `documentationService.ts` (with optional `category`). The service version is optional to maintain API compatibility.

## Deployment

Built and deployed as part of the monorepo: `yarn build:documentation-explorer` outputs to `dist/prototypes/documentation-explorer/`.

Production URL: `https://portfolio.cookinupideas.com/prototypes/documentation-explorer/`

## Related

- [Root AGENTS.md](../../AGENTS.md) — Monorepo overview
- [Shared API](../../shared/api/) — Claude API proxy (required for AI search)
- [Skills directory](../../.claude/skills/) — Source for the skill content displayed
