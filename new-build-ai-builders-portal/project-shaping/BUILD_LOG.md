# AI Builders Portal — Build Log

## 2026-04-05: Project Kickoff

### Context
Completely redesigning the Code Dojo app as the **AI Builders Portal** — a community of practice platform for enterprise professionals building with AI. New design system (space-exploration metaphor), no carryover from old Code Dojo design.

### Source Materials
- `ai-builders-portal-creative-brief.docx` — Vision, persona, 7 JTBDs, 13 components, design principles
- `ai-builders-design-system.jsx` — Working React component code with design tokens (12 components)
- `vector-graphics-prompt-guide.md` — SVG illustration prompts for Recraft

### External Tools
- **Impeccable** (22 design skills) — `/Users/nathansuberi/Documents/GitHub/impeccable`
- **Playwright CLI** — `/Users/nathansuberi/Documents/GitHub/playwright-cli`

### MVP Scope (5 capabilities)
1. **Landing page** — Find the site, learn what it is
2. **Onboarding** — Articulate goals, current state, learning context
3. **Work submission** — Submit challenges with artifacts + devlogs
4. **Profile / certification** — Show your journey and progression
5. **Shareable portfolio** — Public view for managers/colleagues

---

## Planning Phase

### Impeccable Skills Strategy

The 22 impeccable skills map to our build workflow like this:

| Build Phase | Impeccable Skills | When |
|---|---|---|
| **Setup** | `/teach-impeccable` | Once, at start — gathers design context |
| **Foundation** | `/extract` | Extract reusable tokens and patterns from the JSX spec |
| **Components** | `/normalize`, `/typeset`, `/colorize` | As we build each component — ensure consistency |
| **Layout** | `/arrange` | Page layouts, spacing, visual rhythm |
| **Onboarding** | `/onboard` | Specifically designed for onboarding/empty state design |
| **Interaction** | `/animate`, `/delight` | Micro-interactions, transitions |
| **Copy** | `/clarify` | UX writing, labels, error messages |
| **Resilience** | `/harden` | Error handling, edge cases, i18n readiness |
| **Responsive** | `/adapt` | Cross-device testing and adaptation |
| **Quality Gate** | `/audit`, `/critique` | Run before each milestone |
| **Final Pass** | `/polish` | Before shipping each page |
| **Performance** | `/optimize` | Bundle size, loading, rendering |
| **Stretch** | `/overdrive`, `/bolder`, `/quieter`, `/distill` | As needed for specific areas |

### Architecture Decision

**New app at `new-build-ai-builders-portal/`** — NOT modifying the existing code-dojo. Reasons:
- Completely new design system (no carryover)
- Clean separation during development
- Can port to the code-dojo route later when ready

**Tech stack:**
- React 18 + TypeScript + Vite
- React Router for SPA routing
- Tailwind CSS (self-contained config, no shared baseTailwindConfig)
- System font stack only (enterprise CDN constraint from creative brief)
- shadcn/ui token architecture pattern (cn utility, CVA for variants)

---

## Sub-Agent Dispatch Log

### Wave 1: Foundation Setup ✅ COMPLETE
| Agent | Task | Status |
|---|---|---|
| `scaffold-app` | Create Vite + React + TS app, install deps, configure routing | ✅ done |
| `design-tokens` | Extract tokens from JSX spec → CSS custom properties + TS constants + Tailwind config | ✅ done |
| `install-impeccable` | Copy 21 impeccable skills, create .impeccable.md, update proxy + CLAUDE.md | ✅ done |

**Verification:** Vite dev server starts on port 3008, serves HTML at `/ai-builders/`. 19 files created, root package.json updated, yarn install succeeded.

### Wave 2: Component Library ✅ COMPLETE
| Agent | Task | Status |
|---|---|---|
| `core-components` | ChallengeCard, DevlogEntry, ProfileCard, OnboardingFlow | ✅ done |
| `viewer-components` | ArtifactRenderer, VideoViewer, ReferencePanel | ✅ done |
| `community-components` | ShowcaseGalleryItem, LiveRoomCard, GoalEvolution, JourneyMap, ToolkitItem | ✅ done |

**Verification:** 12 components created, `tsc --noEmit` passes clean. All use Tailwind + inline styles for dynamic alpha colors.

### Wave 3: MVP Pages ✅ COMPLETE
| Agent | Task | Status |
|---|---|---|
| `landing-page` | Hero, showcase preview, "how it works", featured challenge, CTA | ✅ done |
| `onboarding-page` | OnboardingFlow + localStorage persist + skip option | ✅ done |
| `challenges-pages` | Filterable list + detail/submission with live previews | ✅ done |
| `profile-page` | ProfileCard, JourneyMap, GoalEvolution, DevlogHistory, share link | ✅ done |
| `portfolio-showcase` | Public portfolio (own chrome) + filterable showcase gallery | ✅ done |
| `community-page` | LiveRoomCards with mock rooms (built directly, no agent) | ✅ done |

**Verification:** `tsc --noEmit` passes clean. 12 components, 9 pages, 3 data files, 2 layouts created.

**File count:** 35 source files in src/, plus config files at root.

### Summary of all files created
```
new-build-ai-builders-portal/
├── .claude/skills/          (21 impeccable skills)
├── .impeccable.md           (design context)
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── vite-env.d.ts
    ├── design-system/
    │   ├── tokens.ts
    │   └── tokens.css
    ├── lib/utils.ts
    ├── layouts/
    │   ├── PortalLayout.tsx
    │   └── OnboardingLayout.tsx
    ├── components/ (12 files)
    │   ├── ArtifactRenderer.tsx
    │   ├── ChallengeCard.tsx
    │   ├── DevlogEntry.tsx
    │   ├── GoalEvolution.tsx
    │   ├── JourneyMap.tsx
    │   ├── LiveRoomCard.tsx
    │   ├── OnboardingFlow.tsx
    │   ├── ProfileCard.tsx
    │   ├── ReferencePanel.tsx
    │   ├── ShowcaseGalleryItem.tsx
    │   ├── ToolkitItem.tsx
    │   └── VideoViewer.tsx
    ├── data/
    │   ├── challenges.ts
    │   ├── showcase.ts
    │   └── user.ts
    └── pages/ (9 files)
        ├── LandingPage.tsx
        ├── OnboardingPage.tsx
        ├── ChallengesPage.tsx
        ├── ChallengeDetailPage.tsx
        ├── ProfilePage.tsx
        ├── PortfolioPage.tsx
        ├── ShowcasePage.tsx
        ├── CommunityPage.tsx
        └── NotFoundPage.tsx
```

### Wave 4: Visual Audit ✅ COMPLETE
| Check | Result |
|---|---|
| Desktop (1280px) | All 9 pages render correctly with proper tokens |
| Mobile (375px) | Landing, challenges stack cleanly — single column, proper spacing |
| Challenge detail | Phase accent, reference panels, submission form all correct |
| Portfolio | Own minimal chrome, gradient banner, artifact + devlog + video |
| Showcase | 4-column grid, tag filters, all 8 items |
| Community | LiveRoomCards with live pulse, RSVP buttons |
| Onboarding | Fixed contrast with orbital-blue header + shadow + ring |
| TypeScript | `tsc --noEmit` passes clean across all files |

### Wave 5: Polish & Testing ✅ COMPLETE
| Agent | Task | Status |
|---|---|---|
| `mobile-nav` | Hamburger menu with Menu/X icons, mobile dropdown | ✅ done |
| `design-polish` | Touch targets (44px), filter pill spacing, 404 personality | ✅ done |
| `playwright-tests` | 6 E2E tests across 5 MVP flows — all passing | ✅ done |

**Playwright test results:** 6 passed, 0 failed (2.7s)
- Landing page discovery
- Onboarding flow (3 steps → localStorage → profile navigation)
- Challenge browsing + filtering + detail navigation
- Profile page (user info, journey, goals, devlogs, clipboard copy)
- Portfolio page (public view)
- Showcase page (gallery + tag filtering)

### Remaining Work
| Task | Status |
|---|---|
| Impeccable /audit, /critique, /polish passes | ready for next session |
| Vector graphics generation (Recraft SVGs) | ready — prompts in vector-graphics-prompt-guide.md |
| Real API integration (replace mock data) | future |
| Authentication system | future |
