---
name: new-prototype
description: "Launch checklist and integration workflow for adding a new prototype to the portfolio monorepo. Use when the user wants to: (1) Start a new prototype or portfolio item, (2) Dream up or brainstorm a new project, (3) Plan a new interactive demo, (4) Add a new app to the monorepo, (5) Publish any new content, feature, or experience to the production site. Triggers include phrases like 'new prototype', 'new project', 'new portfolio item', 'add a new app', 'I have an idea for', 'let's build', 'I want an app on my site', 'publish to the site', 'create a gallery', 'add to my portfolio', or any description of a new publicly-visible experience on portfolio.cookinupideas.com — even if the user doesn't use the word 'prototype'."
---

# New Prototype Launch Skill

When a user starts dreaming up a new project, this skill ensures every integration point is handled — nothing falls through the cracks, documentation stays current, and the new prototype leverages existing assets from day one.

## Launch Phases

### Phase 1: Dream (Understand the Vision)

Before touching code, gather enough context to shape the work:

1. **What does the prototype demonstrate?** — The portfolio pitch (1-2 sentences for a hiring reviewer)
2. **What interaction patterns does it need?** — Visualization, AI-assisted, data-driven, etc.
3. **What data does it need?** — Static data, API calls, database, external sources
4. **Does it need a subdomain?** — e.g., `newproject.cookinupideas.com`

Use the **breadboarding skill** (`.claude/skills/breadboarding/SKILL.md`) to shape non-trivial features before implementation.

### Phase 2: Scaffold (Create the Integration Points)

Every new prototype needs these files and updates. Create them as placeholders first, then fill in during implementation.

#### Files to Create

```
prototypes/{name}/
├── package.json              # @proto-portal/{name}, workspace member
├── vite.config.ts            # base: '/prototypes/{name}/', port: {next available}
├── tsconfig.json             # Extend from root patterns
├── tailwind.config.ts        # Import baseTailwindConfig, add prototype overrides
├── index.html                # Vite entry point
├── postcss.config.js         # Standard PostCSS with tailwind + autoprefixer
├── src/
│   ├── App.tsx               # Main component with Navigation + routes
│   ├── main.tsx              # React entry point
│   ├── index.css             # Import prototype-local tokens (see Phase 3)
│   ├── styles/tokens.css     # Prototype-local CSS custom properties (default)
│   ├── components/           # (empty, ready for components)
│   │   └── Navigation.tsx    # Top nav matching other prototypes
│   ├── data/                 # (if static data needed)
│   └── types.ts              # (if custom types needed)
├── e2e/                      # Playwright test directory
├── playwright.config.js      # Standard Playwright config
├── AGENTS.md                 # Prototype-specific agent guidance
└── README.md                 # Prototype documentation
```

#### Integration Checklist

These are the existing files that MUST be updated when adding a new prototype:

| File | What to Add |
|------|-------------|
| **Root `package.json`** | Add workspace to `workspaces` array; add `dev:{name}` and `build:{name}` scripts |
| **`scripts/build.sh`** | Add build step and copy-to-dist step for the new prototype |
| **`terraform/main.tf`** | Add prototype name to CloudFront Function's hardcoded list |
| **`terraform/route53.tf`** | Add subdomain record (if using a subdomain) |
| **`shared/api/src/server.js`** | Add new port to CORS origins (if the prototype has a new port) |
| **`src/components/Portfolio.tsx`** | Add prototype card to the landing page |
| **`.github/workflows/deploy.yml`** | Add test step for new prototype (if it has tests) |
| **Root `AGENTS.md`** | Add to architecture diagram, port reference table |
| **Root `CLAUDE.md`** | Add to port reference table |
| **Root `README.md`** | Add to prototypes table, port reference, and structure diagram |

**This is the most important part of the skill.** Missing any of these means documentation drifts from reality. Update them during scaffolding, not "later."

### Phase 3: Set Up the Design System

**Default: each prototype owns its own design system.** Different prototypes serve different purposes, so a single shared visual language no longer fits. Define tokens locally, then opt in to shared pieces only where it helps.

#### 3a. Own the visual tokens (default)

Create a prototype-local tokens file with your color palette, typography, radii, etc.:

```css
/* src/styles/tokens.css */
:root {
  --surface: #fafafa;
  --on-surface: #111;
  --border: #e5e5e5;
  --primary: #4a8a38;
  --on-primary: #fff;
  /* ...whatever visual language this prototype needs */
}
```

Import it from `src/index.css`:

```css
/* src/index.css */
@import "./styles/tokens.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Reference tokens via CSS custom properties or Tailwind arbitrary values:

```tsx
<div className="bg-[var(--surface)] text-[var(--on-surface)] border-[color:var(--border)]">
```

Or map tokens to semantic Tailwind colors in your prototype's own `tailwind.config.ts` so `bg-surface` / `text-on-surface` work.

#### 3b. Share structural layout — always

Structural patterns (fixed sidebar + scrolling viewport, fixed-header + scrolling-body panels, collapsible icon rails, bottom sheets) are hard to reimplement correctly. Use the shared primitives:

```tsx
import {
  AppShell,
  ScrollViewport,
  ContextPanel,
  SidebarRail,
  BottomSheet,
} from "@proto-portal/layout-primitives";
```

These components are headless for visuals — they encode the layout and scroll behavior only. Style them with your prototype's own classes via the `className` prop. See `shared/layout-primitives/README.md` for usage.

Add the peer dep in the prototype's `package.json`:

```json
"dependencies": {
  "@proto-portal/layout-primitives": "workspace:*"
}
```

#### 3b-i. Do you need a new layout primitive?

Before writing a bespoke shell, sidebar, panel, or sheet in a new prototype, **pause and have a conversation with the user** about whether the layout pattern is genuinely new, or a variant of an existing primitive.

Ask together:

1. **What is the structural goal?** — describe the layout in terms of "what is fixed, what scrolls, what collapses, what overlays." Strip away the visual intent.
2. **Can an existing primitive express this?** — can `AppShell` + `ScrollViewport`, `ContextPanel`, `SidebarRail`, or `BottomSheet` (possibly composed) cover it? If yes, use them and apply the prototype's own styling via `className`. Custom visuals don't justify a new primitive.
3. **If not, is the pattern generalizable?** — would at least one other prototype plausibly want this layout? A one-off visual effect is not a primitive. A reusable structural pattern (e.g. a split-pane with persistent left rail and right drawer; a floating action panel that pins on scroll) likely is.
4. **Where should it live?**
   - **Contribute it back** to `@proto-portal/layout-primitives` when the pattern is structural, visually unopinionated, and plausibly reusable. Match the existing contract: structural Tailwind classes only, `className` prop for consumer styling, no color/font opinions.
   - **Keep it local** in the prototype when the layout is tightly coupled to that prototype's visuals, content model, or state — build it in `src/components/layout/` and revisit promotion later if a second prototype wants the same shape.

When contributing back, open the conversation explicitly: *"I think this layout pattern could be shared — should I extract it to `@proto-portal/layout-primitives` or keep it prototype-local for now?"* Default to keeping it local until there's a second consumer; premature extraction is worse than mild duplication.

Update `shared/layout-primitives/README.md` when you add a new primitive, and include it in the doc-sync checklist above.

#### 3c. Opt in to shared visuals only when it helps

If your prototype wants the shared baseline look (e.g. dark-mode aware, same radii/shadows as the rest of the portfolio):

```css
/* src/index.css — opt-in shared baseline */
@import "@proto-portal/design-tokens/css/tokens.css";
@import "@proto-portal/design-tokens/css/utilities.css";
```

```ts
// tailwind.config.ts
import { baseTailwindConfig } from "@proto-portal/design-tokens/tailwind/base-config";
export default {
  ...baseTailwindConfig,
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
};
```

Similarly, `@proto-portal/ui-components` offers shared buttons/cards/etc. — opt in when your prototype doesn't need its own visual vocabulary.

#### When to share vs own

| Layer | Default | Notes |
|---|---|---|
| **Structural layout** (shells, sidebars, panels) | **Always share** via `@proto-portal/layout-primitives` | Layout bugs hide here; don't reinvent |
| **Visual tokens** (colors, type, motion) | **Own per prototype** | Each prototype has its own identity |
| **Baseline tokens** (`@proto-portal/design-tokens`) | **Opt-in** | Use when your prototype wants the portfolio baseline look |
| **Shared UI components** (`@proto-portal/ui-components`) | **Opt-in** | Use when you don't need a bespoke visual vocabulary |
| **Lint rule** | `yarn lint:tokens` still bans hardcoded hex/rgb and non-semantic Tailwind color classes | Keeps theming/dark-mode viable later |

### Phase 4: Set Up Testing

Follow the existing patterns:

```json
// package.json test scripts
{
  "scripts": {
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch --passWithNoTests",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

Create at minimum:
- `e2e/` directory with a basic smoke test
- Jest config (or `--passWithNoTests` until unit tests are added)

### Phase 5: Configure Deployment

#### Vite Config

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/prototypes/{name}/',
  server: {
    port: {PORT},  // Use next available: check CLAUDE.md port table
    host: '::',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### Build Script Update

Add to `scripts/build.sh`:

```bash
echo "Building {Display Name}..."
yarn workspace @proto-portal/{name} build
mkdir -p dist/prototypes/{name}
cp -r prototypes/{name}/dist/* dist/prototypes/{name}/
```

#### CloudFront / Terraform Updates

In `terraform/main.tf`, TWO changes are required:

**1. Add prototype to the CloudFront Function's known-prototype list:**

```javascript
if (prototypeName === 'ffx-skill-map' || prototypeName === 'home-lending-learning' ||
    prototypeName === 'documentation-explorer' || prototypeName === 'learning-path' ||
    prototypeName === '{name}') {
```

**2. Add an `ordered_cache_behavior` block** for the new prototype (copy an existing one, change `path_pattern`):

```terraform
ordered_cache_behavior {
  path_pattern           = "/prototypes/{name}/*"
  allowed_methods        = ["GET", "HEAD", "OPTIONS"]
  cached_methods         = ["GET", "HEAD"]
  target_origin_id       = "S3-${var.bucket_name}"
  ...
  function_association {
    event_type   = "viewer-request"
    function_arn = aws_cloudfront_function.prototype_router.arn
  }
}
```

**Important:** The `/*` path pattern does NOT match `/prototypes/{name}` (no trailing slash). The `default_cache_behavior` also has the CloudFront function attached to handle this case — do NOT remove it. Both the ordered behavior and the default behavior need the function for slash-agnostic routing to work.

### Phase 6: Write AGENTS.md

Every prototype gets its own `AGENTS.md` with:

```markdown
# Agent Instructions: {Display Name}

## What This Prototype Demonstrates
[1-2 paragraphs: what it does and why it matters for a portfolio]

## Architecture Decisions
[Key technical choices and why they were made]

## Key Files
[Table of important files and their purpose]

## Development
[Dev server command, port, test commands]

## Gotchas
[Non-obvious things an agent needs to know]

## Deployment
[Build command, production URL]

## Related
[Links to root AGENTS.md, shared resources used]
```

### Phase 7: Verify

Before considering the prototype "launched":

- [ ] `yarn dev:{name}` starts the dev server
- [ ] Navigating to `http://localhost:{PORT}/prototypes/{name}/` shows the app
- [ ] `yarn build:{name}` produces output in `dist/prototypes/{name}/`
- [ ] The dev proxy (`yarn dev:proxy`) routes to the new prototype
- [ ] All integration checklist files have been updated
- [ ] `AGENTS.md` exists with prototype-specific guidance
- [ ] Portfolio landing page links to the new prototype

## Reusable Assets

These existing assets can be leveraged in new prototypes:

| Asset | Location | How to Use |
|-------|----------|------------|
| **Layout primitives** (always share) | `shared/layout-primitives/` | `import { AppShell, ContextPanel, SidebarRail, BottomSheet } from "@proto-portal/layout-primitives"` |
| Design tokens (opt-in baseline) | `shared/design-tokens/` | CSS imports + Tailwind config extension — skip if you want your own visual language |
| UI components (opt-in) | `shared/ui-components/` | Buttons, cards, badges — skip if your prototype needs a bespoke visual vocabulary |
| Claude API proxy | `shared/api/` | POST to `localhost:3004/api/v1/...` |
| Navigation component pattern | Any prototype's `Navigation.tsx` | Copy and adapt |
| Instructions modal pattern | `documentation-explorer/InstructionsModal.tsx` | Copy for onboarding |
| Playwright config | Any prototype's `playwright.config.js` | Copy and update port/base |
| CI test step | `.github/workflows/deploy.yml` | Add workspace test command |

## Port Allocation

Current ports in use: 3001, 3002, 3004, 3005, 3006, 7474, 7687, 8080, 8082.

**Next available ports**: 3007, 3008, 3009.

When allocating a port, update the port reference tables in `CLAUDE.md`, `AGENTS.md`, and `README.md`.
