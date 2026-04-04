# Shared Design Tokens

Shared UI theme system for all prototypes. Provides CSS custom properties, Tailwind configuration, and responsive utility classes.

## Usage

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
- Every prototype CSS must import `tokens.css` or a `theme.css` override

**Warnings (non-blocking):**
- Non-semantic Tailwind classes (`bg-gray-500`) -- prefer `bg-muted`, `text-foreground`

**Escape hatches:**
- Per-line: `// design-token-lint-ignore`
- Per-file: add the comment anywhere in the file
- Sigma.js needs hex values -- use `hslToHex()` with token HSL values

## Dark Mode

- **Default**: All prototypes inherit dark mode via `tokens.css` (`.dark` class)
- **Light-only prototypes** (e.g. ffx-skill-map): Override CSS variables in a `theme.css` that sets light values on `:root`
- Do not use CSS hacks to block `.dark` -- set the variables explicitly
