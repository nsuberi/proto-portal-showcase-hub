# Proto Portal Design Tokens

A centralized design token system for the Proto Portal Showcase Hub that eliminates DRY violations and provides consistent styling across all applications and prototypes.

## 🎯 Problem Solved

Previously, the monorepo had **significant DRY violations**:
- Duplicate UI components in each prototype
- Hardcoded color values scattered throughout the codebase
- Inconsistent design token usage between main portfolio and prototypes
- Missing design tokens in FFX prototype (gradients, shadows, transitions)

This shared design token system provides **a single source of truth** for all design-related values.

## 🏗️ Architecture

```
shared/design-tokens/
├── tokens/                          # Token definitions
│   ├── colors.ts                    # Semantic color system
│   ├── spacing.ts                   # Spacing scale tokens
│   ├── typography.ts                # Typography hierarchy
│   ├── shadows.ts                   # Shadow effects
│   ├── gradients.ts                 # Gradient definitions
│   ├── transitions.ts               # Animation tokens
│   └── components/                  # Component-specific tokens
│       ├── chart-colors.ts          # Chart color palettes
│       └── skill-categories.ts      # FFX skill category colors
├── css/
│   ├── tokens.css                   # CSS custom properties
│   └── utilities.css                # Utility classes
├── tailwind/
│   └── base-config.ts               # Base Tailwind configuration
└── index.ts                         # Main export with override system
```

## 🎨 Design Token Categories

### Core Semantic Colors
- `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`
- Extended: `success`, `warning`, `info` for better semantic coverage
- Dark mode support included

### Extended Design Tokens
- **Gradients**: `primary`, `secondary`, `subtle`, `hero`, `accent`
- **Shadows**: `glow`, `elegant`, `subtle`, `medium`, `large`, `primary`
- **Transitions**: `smooth`, `fast`, `slow`, `bounce`, `elastic`
- **Spacing**: Systematic scale from `xs` to `4xl` plus semantic spacing

### Component-Specific Tokens
- **Chart Colors**: Semantic color palettes for data visualization
- **Skill Categories**: FFX-specific color mappings using semantic tokens
- **Typography**: Complete font system with scales and weights

## 🔧 Override Mechanism

The system provides a powerful override mechanism for customization:

```typescript
import { createDesignTokens, presetOverrides } from "@proto-portal/design-tokens";

// Use preset overrides
const ffxTokens = createDesignTokens(presetOverrides.ffxSkillMap);

// Custom overrides
const customTokens = createDesignTokens({
  colors: {
    primary: "220 100% 50%", // Custom primary color
  },
  chartColors: {
    primary: ["hsl(var(--info))", "hsl(var(--success))"], // Custom chart colors
  },
});
```

## 📦 Usage

### 1. Basic Import (Main Portfolio)
```typescript
// tailwind.config.ts
import { baseTailwindConfig } from "@proto-portal/design-tokens";

export default {
  ...baseTailwindConfig,
  content: ["./src/**/*.{ts,tsx}"],
} satisfies Config;
```

```css
/* index.css */
@import "@proto-portal/design-tokens/css/tokens.css";
@import "@proto-portal/design-tokens/css/utilities.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2. With Overrides (Prototypes)
```typescript
// FFX prototype tailwind.config.ts
import { baseTailwindConfig, createDesignTokens, presetOverrides } from "@proto-portal/design-tokens";

const ffxTokens = createDesignTokens(presetOverrides.ffxSkillMap);

export default {
  ...baseTailwindConfig,
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    ...baseTailwindConfig.theme,
    extend: {
      ...baseTailwindConfig.theme?.extend,
      colors: {
        ...baseTailwindConfig.theme?.extend?.colors,
        // Use overridden chart colors
        'chart-1': ffxTokens.chartColors.primary[0],
        'chart-2': ffxTokens.chartColors.primary[1],
      },
    },
  },
} satisfies Config;
```

## 🎯 Benefits

### 1. **DRY Compliance**
- Single source of truth for all design values
- No more duplicate UI components
- Centralized token management

### 2. **Consistency**
- Semantic color system ensures visual harmony
- Systematic spacing and typography scales
- Unified component styling

### 3. **Maintainability**
- Update tokens in one place, affects entire system
- Type-safe token definitions
- Clear override mechanism for customization

### 4. **Developer Experience**
- Semantic naming (`text-primary` vs `text-purple-500`)
- IntelliSense support for token values
- Clear documentation and examples

## 🚀 Migration Benefits

### Before (DRY Violations)
```typescript
// FFX prototype - hardcoded values
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const categoryColors = {
  combat: '#ef4444',    // red-500
  magic: '#3b82f6',     // blue-500
  support: '#22c55e',   // green-500
};

// Inline styles
<div style={{ color: "rgb(144, 19, 254)" }}>
```

### After (Design Token System)
```typescript
// FFX prototype - semantic tokens
const COLORS = [
  'hsl(var(--info))',
  'hsl(var(--success))', 
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--primary))'
];

const categoryColors = {
  combat: 'hsl(var(--destructive))',
  magic: 'hsl(var(--info))', 
  support: 'hsl(var(--success))',
};

// Semantic classes
<div className="text-primary">
```

## 🔄 CSS Custom Properties

All tokens are available as CSS custom properties:

```css
:root {
  /* Core colors */
  --primary: 263 70% 60%;
  --success: 142 76% 36%;
  --info: 213 94% 68%;
  
  /* Extended tokens */
  --gradient-primary: linear-gradient(135deg, hsl(263, 70%, 60%), hsl(280, 100%, 70%));
  --shadow-glow: 0 0 40px hsl(263, 70%, 60% / 0.3);
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Component-specific */
  --skill-combat-solid: var(--destructive);
  --skill-magic-solid: var(--info);
}
```

## 🎨 Utility Classes

The system provides convenient utility classes:

```css
/* Gradients */
.bg-gradient-primary
.bg-gradient-secondary
.bg-gradient-hero

/* Shadows */
.shadow-glow
.shadow-elegant
.shadow-primary

/* Transitions */
.transition-smooth
.transition-fast

/* Skill categories */
.skill-combat
.skill-magic
.skill-support
```

## 📈 Impact

### Eliminated DRY Violations:
- ✅ **Unified Color System**: No more hardcoded hex values
- ✅ **Shared Component Library**: Consistent UI components
- ✅ **Centralized Token Management**: Single source of truth
- ✅ **Semantic Naming**: Better developer experience
- ✅ **Override Mechanism**: Flexible customization

### Performance Benefits:
- **Smaller Bundle Sizes**: Shared CSS eliminates duplication
- **Consistent Caching**: Shared tokens cached across applications
- **Faster Development**: Reusable tokens and components

## 🔮 Future Enhancements

- **Runtime Theme Switching**: Dynamic color scheme changes
- **Token Validation**: Build-time checks for token usage
- **Design Token Studio**: Visual token management interface
- **Automated Testing**: Visual regression testing for design consistency

## 📚 Related Documentation

- [Main Portfolio Configuration](../../tailwind.config.ts)
- [FFX Prototype Configuration](../../prototypes/ffx-skill-map/tailwind.config.ts)

---

*This design token system successfully eliminates DRY violations while providing a robust foundation for consistent, maintainable design across the entire Proto Portal Showcase Hub.*