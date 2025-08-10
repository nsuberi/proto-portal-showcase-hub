# Design Tokens and Responsive System

Centralized design tokens and responsive utilities ensure consistency across the portfolio and all prototypes.

## Package overview
- Shared tokens live in the `@proto-portal/design-tokens` workspace.
- Exposes CSS custom properties, responsive utilities, and a base Tailwind config.

### Structure
```
shared/design-tokens/
├── tokens/                # colors, spacing, typography, shadows, gradients
├── css/                   # tokens.css, utilities.css
├── tailwind/              # base-config.ts
└── index.ts               # createDesignTokens, presetOverrides, exports
```

## Token categories
- Semantic colors: background, foreground, primary, secondary, muted, accent, destructive, success, warning, info (with dark mode)
- Gradients, shadows, transitions, spacing, typography
- Component-specific: chart palettes, skill categories

## Usage
- CSS: `@import "@proto-portal/design-tokens/css/tokens.css";` and `css/utilities.css`
- Tailwind: extend from `baseTailwindConfig`

```ts
// tailwind.config.ts
import { baseTailwindConfig } from "@proto-portal/design-tokens";
export default { ...baseTailwindConfig, content: ["./src/**/*.{ts,tsx}"] };
```

## Overrides for prototypes
Use `createDesignTokens` with `presetOverrides` to customize per prototype (e.g., FFX chart colors) while keeping shared semantics.

```ts
import { createDesignTokens, presetOverrides } from "@proto-portal/design-tokens";
const ffxTokens = createDesignTokens(presetOverrides.ffxSkillMap);
```

## Responsive approach (mobile-first)
- Responsive tokens define breakpoints and patterns (containers, button groups).
- Utilities enforce mobile-first layout and 100vw max-width safety.

Key utilities:
- `.container-mobile` — width and padding constraints
- `.btn-group-mobile` and `.btn-mobile` — stack on mobile, row on larger screens
- `.mobile-section` — standardized responsive section padding
- `.max-vw-100` — prevent horizontal overflow beyond 100vw

Checklist:
- Always design for mobile first; progressively enhance for larger screens.
- Ensure tappable targets meet size guidelines.
- Verify no element exceeds 100vw.

## Benefits
- DRY styling with consistent semantics
- Easy theming via overrides
- Type-safe tokens and predictable utilities

Prototype docs should explain how they import tokens and which overrides they use.

## Token storage and Tailwind integration (analysis)

### CSS custom properties (tokens)
Tokens are exposed as CSS variables and consumed by Tailwind utilities and app CSS.

Example structure and semantics:

```css
:root {
  /* Semantic colors */
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 263 70% 60%;
  --primary-foreground: 0 0% 98%;

  /* Extended tokens */
  --gradient-primary: linear-gradient(135deg, hsl(263, 70%, 60%), hsl(280, 100%, 70%));
  --shadow-glow: 0 0 40px hsl(263, 70%, 60% / 0.3);
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

### Tailwind mapping
The Tailwind base config maps CSS variables to utilities and extends with gradients, shadows, and more.

```ts
// tailwind.config.ts (derived from base config)
export default {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        elegant: 'var(--shadow-elegant)',
      },
    }
  }
}
```

### Utility classes generated from tokens

```css
.bg-gradient-primary { background: var(--gradient-primary); }
.shadow-glow { box-shadow: var(--shadow-glow) !important; }
.transition-smooth { transition: var(--transition-smooth); }
```

## Benefits and recommendations

- Consistent, semantic styling across apps; DRY by design
- Dark mode support via variable overrides
- Prototype identity via additive overrides, not wholesale replacement
- Consider generating token docs and adding token validation in CI
