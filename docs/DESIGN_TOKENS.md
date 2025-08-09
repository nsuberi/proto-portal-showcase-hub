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
