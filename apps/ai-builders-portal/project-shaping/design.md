# AI Builders Portal — Design System

## Origin

The visual language is adapted from the **Astro-Cozy Editorial** design system, originally generated via Google Stitch for a "Space Home Builder" project. The reference screen — "The Journey: Star Chart" — established the palette, typography, surface hierarchy, and interaction patterns. That screen is preserved at `public/screens/star-chart.html` and served at `/screens/star-chart`.

The creative north star is **The Celestial Hearth**: warmth and precision in deep space. Technical data is clean and geometric; narrative content is intimate and serif. The galaxy itself is always present behind the UI.

---

## Color Palette

Dark mode only. Based on Material Design 3 tonal surface roles.

### Surface Hierarchy

Surfaces are layered like frosted glass sheets, from darkest to lightest:

| Token | Hex | Role |
|---|---|---|
| `surface` | `#121317` | Page background, base layer |
| `surface-dim` | `#121317` | Alias for surface |
| `surface-container-lowest` | `#0d0e12` | Recessed areas (inputs, deliverables, expanded content) |
| `surface-container-low` | `#1a1b20` | Cards, sidebar |
| `surface-container` | `#1f1f24` | Elevated cards, hover states, form bodies |
| `surface-container-high` | `#292a2e` | Not-started status bg |
| `surface-container-highest` | `#343439` | Pills, tags, inactive nav items |
| `surface-variant` | `#343439` | Alias for surface-container-highest |
| `surface-bright` | `#38393e` | Bright accent surface (rarely used) |

### Accent Colors

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#bbc6e2` | Cool blue-silver. Links, stat numbers, code text, primary star dots |
| `primary-container` | `#0f1a2e` | Dark blue. Phase 1 badge bg, onboarding header, expanded devlog section |
| `on-primary` | `#263046` | Text on primary buttons |
| `on-primary-container` | `#78839c` | Muted metadata text, sidebar labels, timestamps |
| `secondary` | `#ffb4a5` | Terracotta. Live room indicators, Phase 3 accent |
| `secondary-container` | `#802918` | Dark terracotta. Reviewed status bg |
| `tertiary` | `#ffba38` | Amber. Active nav, current goals, active stars, hover accents |
| `tertiary-container` | `#261700` | Dark amber. Phase 2 badge bg, submitted status bg |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `on-surface` | `#e3e2e8` | Primary text (never pure white) |
| `on-surface-variant` | `#c4c6cc` | Secondary text, descriptions |
| `on-primary-container` | `#78839c` | Tertiary text, metadata, labels. Do not use below 14px |

### Borders

| Token | Hex | Usage |
|---|---|---|
| `outline` | `#8e9196` | Visible borders (rarely used) |
| `outline-variant` | `#44474c` | Ghost borders at 15-20% opacity on inputs |

### Phase Colors

| Phase | Token | Hex | Label |
|---|---|---|---|
| 1 | `phase-1` | `#bbc6e2` | Guided |
| 2 | `phase-2` | `#ffba38` | Constrained |
| 3 | `phase-3` | `#ffb4a5` | Discovery |

Phase badges use dark tonal backgrounds (`#0f1a2e`, `#261700`, `#3e0500`) with the phase color as text.

### Status Colors

All status badges use dark tonal backgrounds:

| Status | Bg | Text |
|---|---|---|
| Not started | `#292a2e` | `#8e9196` |
| In progress | `#0f1a2e` | `#bbc6e2` |
| Submitted | `#261700` | `#ffba38` |
| Reviewed | `#3e0500` | `#ffb4a5` |

---

## Typography

Three-font system. Each font has a distinct semantic role:

| Font | Family | Role |
|---|---|---|
| `font-headline` | Space Grotesk | Headlines, titles, nav labels, stat numbers, phase names. Geometric, technical, evokes space exploration. |
| `font-body` | Newsreader | Body text, descriptions, devlog prose, journal entries, questions. Serif, intimate, "the soul." |
| `font-label` | Inter | Labels, badges, buttons, metadata, timestamps, filter pills, uppercase tracking text. Maximum legibility for data. |
| `font-mono` | SF Mono / Cascadia Code / Fira Code | Code blocks only. |

### Typography Rules

- Page titles: `font-headline text-xl font-bold`
- Section headings: `font-headline text-[20px] font-semibold`
- Card titles: `font-headline text-base font-semibold`
- Body text: `font-body text-sm leading-relaxed`
- Metadata/labels: `font-label text-[10px]-[11px] uppercase tracking-wider`
- Button text: `font-label text-[11px] font-bold uppercase tracking-widest`
- Author bylines: `font-body italic`

### Icons

Material Symbols Outlined via Google Fonts. Configured with `FILL 0, wght 400, GRAD 0, opsz 24`. Used for nav items, devlog section icons, UI controls. Inline via `<span class="material-symbols-outlined">icon_name</span>`.

---

## Layout

### Shell Structure

**Desktop:**
- Fixed 80px left sidebar (`bg-surface-container-low`): logo, icon nav (Material Symbols), rotated "PORTAL" label at bottom
- Frosted top header bar (`bg-surface/70 backdrop-blur-xl`): brand left, text nav links center, profile icon right. Offset `md:left-20`
- Main content: `md:ml-20 pt-[72px]`, max-width 5xl, centered

**Mobile:**
- No sidebar
- Frosted top header (full-width, brand text only)
- Persistent bottom tab bar (`bg-surface/80 backdrop-blur-2xl rounded-t-[2rem]`): icon + label columns for each nav item

### Galaxy Background

A fixed nebula image (`GALAXY_BG_URL` from `tokens.ts`) covers the entire viewport behind all content:
- Positioned as `fixed inset-0 z-0`
- Radial gradient overlay from `surface-container-low` via `surface` to `surface-container-lowest`
- Image at `opacity-40 mix-blend-screen`
- Content floats above at `z-10`

Used in: PortalLayout, OnboardingLayout, PortfolioPage.

---

## Component Design Rules

### No Borders for Sectioning

Boundaries between components are defined by **tonal surface shifts**, not borders. A card at `bg-surface-container-low` sits on the galaxy background. A recessed area inside it uses `bg-surface-container-lowest`. An elevated hover state shifts to `bg-surface-container`.

Exceptions:
- Reference panels keep a `border-left: 3px` in their category accent color (architecture=primary, building=tertiary, data=phase-2, design=secondary)
- Inputs use ghost borders: `border border-outline-variant/15`
- Live room cards use `ring-1 ring-secondary/30` when live

### No Drop Shadows

Components do not use `box-shadow` for elevation. Depth comes from surface tonal differences and the galaxy background bleeding through. No shadow utilities (`shadow-ambient`, `shadow-glow-*`, etc.) are defined in the Tailwind config. The only shadow-like effects are:
- The white inset glow on challenge cards (inline arbitrary value)
- The `live-pulse` keyframe animation, which uses a pulsing `box-shadow` ring on live room indicators (not a static drop shadow)

### White Inset Glow

Challenge cards and the challenge detail header use a subtle white inset glow on the left side: `shadow-[inset_3px_0_12px_-4px_rgba(227,226,232,0.15)]`. This replaces the previous colored phase accent bar.

### Cards

- Background: `bg-surface-container-low`
- Corners: `rounded-xl` (1.5rem)
- Hover: `hover:bg-surface-container` (tonal shift, not shadow)
- No explicit border
- Padding: `p-5`

### Badges and Pills

- Phase badges: `rounded-full font-label text-[10px] font-semibold uppercase tracking-wider` with tonal dark bg + phase accent text
- Status badges: same shape, using statusConfig colors
- Tag pills: `bg-surface-container-highest rounded-full font-label text-[11px] text-on-surface-variant`
- Filter pills: `rounded-full font-label text-xs font-medium`, active state `bg-primary/10 text-primary`, inactive `bg-surface-container-highest text-on-surface-variant`

### Buttons

- Primary CTA: `bg-gradient-to-br from-primary to-on-primary-container text-on-primary-fixed font-label font-bold uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-95`
- Ghost/secondary: `ring-1 ring-outline-variant/20 text-on-primary-container hover:text-primary hover:ring-primary/30`
- No solid-color buttons (no `bg-signal-orange` etc.)

### Inputs

- Recessed: `bg-surface-container-lowest`
- Ghost border: `border border-outline-variant/15`
- Focus: `focus:border-tertiary/50 focus:ring-1 focus:ring-tertiary/30`
- Font: `font-label text-sm`

### Glass Panels

Two utility classes for floating/overlay elements:
- `.astro-glass`: `background: rgba(52,52,57,0.6); backdrop-filter: blur(20px)`
- `.astro-glass-heavy`: `background: rgba(18,19,23,0.7); backdrop-filter: blur(40px)`

Used sparingly: hero section, share portfolio card, CTA footer, coming-soon card. Cards use opaque `bg-surface-container-*` fills, not glass, to avoid GPU overhead.

### Lists

No divider lines between list items. Separation via vertical gap (`gap-4` to `gap-6`). This applies to devlog accordion sections, goal timeline entries, community rooms, and challenge grids.

### Accordion Sections (DevlogEntry)

- Sections separated by `gap-1` with no borders
- Collapsed: `hover:bg-surface-container-highest`
- Expanded trigger: `bg-primary-container text-primary`
- Expanded content: `bg-surface-container-lowest rounded-b-lg`
- Section icons: Material Symbols (deployed_code, palette, workspaces, school, sync)
- Chevron: Material Symbol `expand_more`, rotates 180deg on expand
- Content text: `font-body` for narrative prose

### Reference Panels

Keep multi-colored category accents:
- `architecture` → `primary` (#bbc6e2)
- `building` → `tertiary` (#ffba38)
- `data` → `phase-2` (#ffba38)
- `design` → `secondary` (#ffb4a5)

Left border `3px` in accent color. Category badge uses `${accent}20` bg with accent text. Expanded content on `bg-surface-container-lowest`.

---

## Page-Level Design Decisions

### Landing Page

1. **Hero**: Astro-glass panel floating on galaxy. `font-headline` for the headline, `text-primary` for emphasis span. Gradient CTA + ghost button.
2. **Showcase preview**: 3-column grid of ShowcaseGalleryItems. Link in `text-primary`.
3. **Three phases of development**: Horizontal star timeline. Three star dots connected by a line, floating directly on the galaxy (no bounding box). Each star has a hover ring animation. Phase-colored dots (phase-1/2/3). Name + description below each star.
4. **Four foundations**: 4-column grid of blocks (`bg-surface-container-low rounded-xl`). Material Symbol icon + label. Tools and Platforms, Discovery and Problem Shaping, Building, Scaling and Sustaining.
5. **Featured challenge**: Single ChallengeCard with white inset glow.
6. **CTA footer**: Astro-glass panel, gradient CTA button.

### Challenges Page

- Filter pills with tonal active state (no borders)
- 3-column card grid
- Empty state: `bg-surface-container rounded-xl` with reset button

### Challenge Detail Page

- Two-column layout on desktop: narrative left (wider), references right
- Header card with white inset glow, no colored accent bar
- Deliverable bullets are neutral (`bg-on-surface/50`), not phase-colored
- Recessed input fields, gradient submit button
- Reference panels keep multi-colored category accents

### Profile Page

- Two-column HUD dashboard on desktop: personal overview left, timeline + devlogs right
- ProfileCard: gradient header `from-primary-container to-surface-container-lowest`, avatar circle `bg-primary/20`, stats grid with whitespace gaps (no dividers)
- Share card: astro-glass, gradient CTA
- GoalEvolution: vertical timeline with `bg-outline-variant/30` line, amber dot for current goal, `bg-surface-container-highest` for past dots, strikethrough in `decoration-outline-variant`

### Community Page

- Horizontal star chart timeline for session calendar (inside `bg-surface-container-low rounded-xl`)
- Each session is a star: live sessions have a larger secondary-colored core with a pulsing border ring (`animate-pulse`), upcoming are primary-colored with hover rings
- Date shown large (`font-headline text-base font-bold`), time in `font-label uppercase`
- Click to expand agenda panel (`bg-surface-container-lowest`) with bullet list + Join/RSVP button
- Coming-soon card: astro-glass

### Portfolio Page (standalone, no portal chrome)

- Own galaxy background
- Frosted header bar
- Gradient banner `from-primary-container to-surface-container-lowest`
- Stats bar: `bg-surface-container`, whitespace-separated (no dividers)
- Work entries: `bg-surface-container-low rounded-xl` wrapping ArtifactRenderer/VideoViewer + DevlogEntry

### Onboarding Page

- Galaxy background via OnboardingLayout
- `font-headline` logo
- OnboardingFlow: step indicators on `bg-primary-container`, card body on `bg-surface-container`, recessed inputs, gradient CTA

### 404 Page

- Giant `text-surface-container-highest` 404 number
- `font-headline` for "Lost in Space"
- `font-body` for description
- Gradient return button

---

## Spacing and Radius

Spacing uses a 4px baseline: xs(4), sm(8), md(12), lg(16), xl(24), 2xl(32), 3xl(48).

Border radius:
- `sm`: 0.25rem — minimum roundedness, used on small elements
- `md`: 0.5rem — buttons, inputs
- `lg`: 0.75rem — inner containers, progress bars
- `xl`: 1.5rem — cards, panels, modals (primary container radius)
- `full`: 9999px — pills, badges, avatars

---

## Animation

- `animate-pulse`: Used on current star dots and live session markers (CSS native)
- `animate-live-pulse`: Custom keyframe for live room indicators — pulsing `box-shadow` ring in secondary color, 2s ease infinite
- Star hover rings: `transition-transform duration-500 group-hover:scale-150`
- Expand/collapse chevrons: `transition-transform duration-200 rotate-180`
- Button press: `active:scale-95`
- Tonal transitions: `transition-colors duration-200`
- Page entrance: `animate-in fade-in duration-500` (from tailwindcss-animate)

---

## Contrast and Accessibility

| Pair | Ratio | Pass |
|---|---|---|
| `on-surface` (#e3e2e8) on `surface` (#121317) | 13.8:1 | AAA |
| `on-surface-variant` (#c4c6cc) on `surface` (#121317) | 10.5:1 | AAA |
| `on-primary-container` (#78839c) on `surface` (#121317) | 5.2:1 | AA (normal text) |
| `tertiary` (#ffba38) on `surface` (#121317) | 9.8:1 | AAA |
| `primary` (#bbc6e2) on `surface` (#121317) | 11.3:1 | AAA |

`on-primary-container` should not be used for body text below 14px — it's reserved for metadata labels and timestamps.

Interactive elements use semantic HTML (`button`, `a`, `input`) with proper `role`, `tabIndex`, `aria-expanded`, and keyboard handlers (`Enter`/`Space`).

---

## File Map

| File | Purpose |
|---|---|
| `src/design-system/tokens.css` | CSS custom properties (colors, spacing, radius, fonts) |
| `src/design-system/tokens.ts` | TypeScript constants, type definitions, phaseConfig, statusConfig, devlogSectionMeta, GALAXY_BG_URL |
| `tailwind.config.ts` | Tailwind theme extensions consuming CSS vars |
| `src/index.css` | Base styles, astro-glass utilities, Material Symbols base |
| `index.html` | Google Fonts links, `class="dark"` on `<html>` |
| `src/layouts/PortalLayout.tsx` | Sidebar + header + galaxy bg + mobile tab bar |
| `src/layouts/OnboardingLayout.tsx` | Dark immersive layout with galaxy bg |
| `src/lib/utils.ts` | `cn()` — clsx + tailwind-merge |
