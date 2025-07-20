# FFX Local Design System Module

This module implements the proper design token architecture for the FFX Skill Map prototype, eliminating DRY violations and providing a clean separation between shared foundation and local customization.

## 🏗️ Architecture Overview

```
FFX Prototype Design System Architecture:

┌─────────────────────────────────────────────────────┐
│ FFX Application Components                          │
│ ├── Dashboard.tsx (uses CHART_COLORS)              │
│ ├── SkillMap.tsx (uses SKILL_CATEGORY_COLORS)      │
│ └── Other components (use semantic tokens)         │
└─────────────────────────────────────────────────────┘
                           ↑
                    imports from
                           ↓
┌─────────────────────────────────────────────────────┐
│ Local Design System Module                          │
│ ├── index.ts (main exports)                        │
│ ├── css-generator.ts (CSS generation)              │
│ ├── theme.css (generated CSS)                      │
│ └── README.md (this file)                          │
└─────────────────────────────────────────────────────┘
                           ↑
                loads + overrides
                           ↓
┌─────────────────────────────────────────────────────┐
│ Shared Design System (@proto-portal/design-tokens) │
│ ├── Base tokens (colors, spacing, etc.)            │
│ ├── Preset overrides (presetOverrides.ffxSkillMap) │
│ └── Token generation utilities                      │
└─────────────────────────────────────────────────────┘
```

## 🎯 Key Features

### ✅ **No Duplication**
- **Single Source**: Design tokens defined once in shared system
- **Local Override**: FFX-specific values applied through override system
- **Generated CSS**: CSS custom properties generated from tokens, not duplicated

### ✅ **Type Safety**
- **TypeScript**: Full type safety for all design tokens
- **IntelliSense**: Auto-completion for color names and values
- **Compile-time Validation**: Catch errors before runtime

### ✅ **Clean Architecture**
- **Separation of Concerns**: Shared foundation vs. local customization
- **Single Entry Point**: All design tokens imported from one module
- **Consistent Interface**: Same API as shared design system

## 📦 Module Structure

### `index.ts` - Main Export Module
```typescript
import { createDesignTokens, presetOverrides } from "@proto-portal/design-tokens";

// Create FFX-specific tokens with overrides applied
export const ffxDesignTokens = createDesignTokens(presetOverrides.ffxSkillMap);

// Export convenience constants
export const CHART_COLORS = ffxDesignTokens.chartColors.primary;
export const SKILL_CATEGORY_COLORS = { /* ... */ };
```

### `css-generator.ts` - CSS Generation
```typescript
// Generates CSS custom properties from design tokens
export function generateFFXCSSProperties(): Record<string, string> {
  return {
    '--background': extractHSLValues(ffxColors.background),
    '--primary': extractHSLValues(ffxColors.primary),
    // ... all other tokens
  };
}
```

### `theme.css` - Generated CSS
```css
/* FFX Skill Map Light Theme - Generated from Design Tokens */
@layer base {
  :root {
    --background: 0 0% 98%;
    --primary: 263 70% 55%;
    /* ... all other CSS custom properties */
  }
}
```

## 🔄 Design Token Flow

### 1. **Definition** (Shared System)
```typescript
// shared/design-tokens/index.ts
export const presetOverrides = {
  ffxSkillMap: {
    colors: {
      background: "0 0% 98%",      // Light theme override
      primary: "263 70% 55%",      // Adjusted purple
    },
    chartColors: {
      primary: [
        "hsl(213, 94%, 58%)",      // Optimized for light theme
        // ...
      ],
    },
  }
};
```

### 2. **Processing** (Local Module)
```typescript
// src/design-system/index.ts
const ffxDesignTokens = createDesignTokens(presetOverrides.ffxSkillMap);
export const CHART_COLORS = ffxDesignTokens.chartColors.primary;
```

### 3. **Generation** (CSS Output)
```css
/* src/design-system/theme.css */
:root {
  --background: 0 0% 98%;
  --primary: 263 70% 55%;
}
```

### 4. **Consumption** (Components)
```typescript
// src/pages/Dashboard.tsx
import { CHART_COLORS } from '../design-system';
const COLORS = CHART_COLORS;
```

## 🎨 Usage Examples

### Chart Colors
```typescript
import { CHART_COLORS } from '../design-system';

// Old way (hardcoded duplication):
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

// New way (from design system):
const COLORS = CHART_COLORS;
```

### Skill Category Colors
```typescript
import { SKILL_CATEGORY_COLORS } from '../design-system';

// Old way (hardcoded duplication):
const categoryColors = {
  combat: '#ef4444',
  magic: '#3b82f6',
};

// New way (from design system):
const categoryColors = SKILL_CATEGORY_COLORS;
```

### CSS Custom Properties
```css
/* Old way (manual duplication): */
:root {
  --background: 0 0% 98%;
  --primary: 263 70% 55%;
}

/* New way (generated from tokens): */
@import "./design-system/theme.css";
```

## 🔧 Benefits Achieved

### **Before Refactoring:**
```
❌ Duplication Issues:
- 24 design tokens defined in both shared system AND FFX CSS
- Hardcoded colors in Dashboard.tsx and SkillMap.tsx  
- Manual CSS custom property definitions
- Inconsistent values between shared and local definitions
- Maintenance nightmare with multiple sources of truth
```

### **After Refactoring:**
```
✅ Clean Architecture:
- Single source of truth in shared design system
- Local module applies overrides and republishes tokens
- Generated CSS from design tokens (no manual duplication)
- Type-safe imports throughout application
- Consistent values across all usage points
```

## 📊 Comparison

| Aspect | Before (Duplicated) | After (Local Module) |
|--------|--------------------|--------------------|
| **Token Sources** | 2 (shared + FFX CSS) | 1 (shared with overrides) |
| **Maintenance** | Update in 2+ places | Update in 1 place |
| **Type Safety** | Partial | Complete |
| **Consistency** | Manual sync required | Automatic |
| **DRY Compliance** | ❌ Violations | ✅ Compliant |
| **Architecture** | ❌ Tangled | ✅ Clean separation |

## 🚀 Future Enhancements

### Build-Time Generation
```typescript
// Future: Generate CSS at build time
// scripts/generate-theme.ts
import { generateFFXThemeCSS } from '../src/design-system/css-generator';
writeFileSync('src/design-system/theme.css', generateFFXThemeCSS());
```

### Runtime Theme Switching
```typescript
// Future: Dynamic theme switching
const themes = {
  light: presetOverrides.ffxSkillMap,
  dark: presetOverrides.ffxDarkMode,
  highContrast: presetOverrides.ffxHighContrast,
};
```

### Visual Testing
```typescript
// Future: Automated visual regression testing
test('FFX theme renders correctly', () => {
  expect(ffxDesignTokens.colors.background).toBe('0 0% 98%');
  expect(CHART_COLORS).toHaveLength(5);
});
```

## 📚 Related Files

- **Shared Design System**: `shared/design-tokens/index.ts`
- **FFX Tailwind Config**: `tailwind.config.ts`
- **FFX Main CSS**: `src/index.css`
- **Dashboard Component**: `src/pages/Dashboard.tsx`
- **SkillMap Component**: `src/pages/SkillMap.tsx`

---

*This local design system module successfully eliminates DRY violations while maintaining clean architecture and providing the flexibility for FFX-specific customization through the design token override system.*