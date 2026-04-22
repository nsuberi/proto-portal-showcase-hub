# Shared Design Tokens (opt-in baseline)

An **optional** baseline theme system. Prototypes default to owning their own design tokens (see root `CLAUDE.md` → Design Rules). Opt in to this package when a prototype wants the portfolio's shared look — dark-mode-aware colors, shared radii/shadows, and the responsive utility classes below.

For structural layout (sidebars, scrolling shells, panels, sheets), use `@proto-portal/layout-primitives` instead. That package is always shared; this one is not.

## Usage (opt-in)

```css
/* Import in any prototype's CSS */
@import "@proto-portal/design-tokens/css/tokens.css";
@import "@proto-portal/design-tokens/css/utilities.css";
```

```ts
// Extend in Tailwind config
import { baseTailwindConfig } from "@proto-portal/design-tokens";

// Per-prototype overrides
import { createDesignTokens, presetOverrides } from "@proto-portal/design-tokens";
const tokens = createDesignTokens(presetOverrides.ffxSkillMap);
```

Available presets: `ffxSkillMap` (light theme), `highContrast` (accessibility), `vibrant` (colorful).

## Mobile-First Responsive Patterns

Design for mobile first (320px minimum), then enhance for larger screens.

```jsx
// Containers: full-width on mobile, constrained on desktop
<div className="w-full max-w-none px-4 mx-auto sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8">

// Button groups: stack vertically on mobile
<div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 w-full sm:w-auto">
  <Button className="w-full sm:w-auto">...</Button>
</div>

// Text/icons: responsive sizing
<span className="text-sm sm:text-base lg:text-lg">
<Icon className="h-4 w-4 sm:h-5 sm:w-5" />

// Section spacing
<section className="py-12 px-4 sm:py-16 sm:px-6 lg:py-20 lg:px-8">
```

### Utility Classes

Use these instead of writing responsive patterns from scratch:

| Class | Purpose |
|-------|---------|
| `px-mobile` | Responsive horizontal padding |
| `py-mobile` | Responsive vertical padding |
| `container-mobile` | Responsive container |
| `btn-group-mobile` | Button group stacking |
| `btn-mobile` | Responsive button sizing |
| `flex-mobile` | Responsive flex layout |

### New Component Checklist

- No element exceeds 100vw
- Button groups stack on mobile (`flex-col` -> `sm:flex-row`)
- Touch targets at least 44px
- Text uses responsive sizing (`text-sm sm:text-base`)

## Lint Rules

**Blocking (CI fails):**
- No hardcoded hex (`'#FF0000'`) or `rgb()/rgba()` in TS/TSX files
- Every prototype must define tokens — either a local `tokens.css` / `theme.css` with CSS custom properties, or import this shared `tokens.css`

**Warnings (non-blocking):**
- Non-semantic Tailwind classes (`bg-gray-500`) -- prefer `bg-muted`, `text-foreground`

**Escape hatches:**
- Per-line: `// design-token-lint-ignore`
- Per-file: add the comment anywhere in the file
- Sigma.js needs hex values -- use `hslToHex()` with token HSL values

## Dark Mode

- **Available as opt-in baseline**: prototypes that import this package's `tokens.css` inherit a dark-mode aware setup via the `.dark` class
- **Prototypes with their own tokens**: define a `.dark` class in your own tokens file that overrides your custom properties — or skip dark mode entirely if it doesn't fit your prototype
- Do not use CSS hacks to block `.dark` -- set the variables explicitly
