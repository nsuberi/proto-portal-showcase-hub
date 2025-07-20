# Tailwind Plugin Configuration Fix

## Issue
The shared design system was causing a runtime error:
```
base-config.ts:133 Uncaught ReferenceError: require is not defined
```

## Root Cause
The `baseTailwindConfig` was trying to use `require("tailwindcss-animate")` in an ES module environment, which doesn't support CommonJS `require()` calls.

## Solution
Moved plugin imports from the shared base configuration to individual application configurations.

### Before (Problematic)
```typescript
// shared/design-tokens/tailwind/base-config.ts
export const baseTailwindConfig = {
  // ... theme config
  plugins: [require("tailwindcss-animate")], // ❌ Error: require not defined
};
```

### After (Fixed)
```typescript
// shared/design-tokens/tailwind/base-config.ts
export const baseTailwindConfig = {
  // ... theme config
  plugins: [], // ✅ Empty array, apps add their own plugins
};

// Main portfolio tailwind.config.ts
export default {
  ...baseTailwindConfig,
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [require("tailwindcss-animate")], // ✅ App-specific plugin
};

// FFX prototype tailwind.config.ts
export default {
  ...baseTailwindConfig,
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [require("tailwindcss-animate")], // ✅ App-specific plugin
};
```

## Files Modified
1. `shared/design-tokens/tailwind/base-config.ts` - Removed plugin from shared config
2. `tailwind.config.ts` - Added plugin to main portfolio config
3. `prototypes/ffx-skill-map/tailwind.config.ts` - Added plugin to FFX config

## Benefits
- ✅ **No Runtime Errors**: Eliminates `require is not defined` error
- ✅ **ES Module Compatibility**: Shared config works in ES module environment
- ✅ **Flexibility**: Each app can choose its own plugins
- ✅ **Maintainability**: Clear separation between shared theme and app-specific plugins

## Architecture Pattern
```
Shared Base Config (shared/design-tokens)
├── Theme extensions (colors, spacing, etc.)
├── Animations & keyframes
└── plugins: [] (empty)

Application Configs
├── Import shared base config
├── Add app-specific content paths
└── Add app-specific plugins
```

This pattern ensures that the shared design system provides theme tokens and extensions while allowing each application to manage its own plugin dependencies.