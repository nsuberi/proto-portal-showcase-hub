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

## Mobile-First Responsive Design Guidelines

This system provides mandatory responsive design patterns and tokens to ensure all applications work properly on mobile devices.

### 🎯 Core Principles

#### 1. **Mobile-First Development**
- Design for mobile screens first (320px minimum width)
- Progressive enhancement for larger screens
- Never exceed `100vw` width on any element

#### 2. **Container Constraints**
- All content must respect maximum viewport width
- Use responsive padding and margins
- Implement proper overflow handling

#### 3. **Button Group Responsiveness**
- Stack buttons vertically on mobile
- Use full-width buttons on small screens
- Apply appropriate spacing for touch targets

### 📐 Responsive Design Tokens

#### Breakpoints
```typescript
// Use these breakpoints consistently across all applications
sm: "640px"   // Small tablets and large phones
md: "768px"   // Tablets
lg: "1024px"  // Small desktops
xl: "1280px"  // Large desktops
2xl: "1536px" // Extra large screens
```

#### Container Patterns
```css
/* Mobile-first container pattern */
.responsive-container {
  width: 100%;
  max-width: 100vw;
  padding: 1rem;           /* mobile: 16px */
  margin: 0 auto;
}

@media (min-width: 768px) {
  .responsive-container {
    max-width: 768px;
    padding: 1.5rem;       /* tablet: 24px */
  }
}

@media (min-width: 1280px) {
  .responsive-container {
    max-width: 1280px;
    padding: 2rem;         /* desktop: 32px */
  }
}
```

### 🔲 Button Group Patterns

#### ✅ Correct: Responsive Button Group
```jsx
<div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 w-full max-w-none sm:max-w-fit">
  <Button
    variant="outline"
    size="default"
    className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground transition-smooth"
  >
    <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
    <span className="text-sm sm:text-base">Email</span>
  </Button>
  <Button
    variant="outline"
    size="default"
    className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground transition-smooth"
  >
    <Linkedin className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
    <span className="text-sm sm:text-base">LinkedIn</span>
  </Button>
</div>
```

#### ❌ Incorrect: Fixed Layout
```jsx
<!-- Don't do this - causes mobile overflow -->
<div className="flex justify-center gap-6">
  <Button variant="outline" size="lg">
    <Mail className="mr-2 h-5 w-5" />
    Email
  </Button>
  <Button variant="outline" size="lg">
    <Linkedin className="mr-2 h-5 w-5" />
    LinkedIn
  </Button>
</div>
```

### 📱 Mandatory Mobile Classes

#### Container Classes
```css
/* Always use these for main containers */
.mobile-container {
  @apply w-full max-w-none px-4 sm:max-w-4xl sm:px-6 lg:px-8;
}

/* For sections */
.mobile-section {
  @apply py-12 px-4 sm:py-16 sm:px-6 lg:py-20 lg:px-8;
}
```

#### Button Group Classes
```css
/* Button groups that stack on mobile */
.mobile-button-group {
  @apply flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 w-full sm:w-auto;
}

/* Individual buttons in mobile groups */
.mobile-button {
  @apply w-full sm:w-auto min-w-0 text-sm sm:text-base;
}
```

#### Text and Icon Responsive Classes
```css
/* Responsive text sizing */
.mobile-text {
  @apply text-sm sm:text-base lg:text-lg;
}

/* Responsive icon sizing */
.mobile-icon {
  @apply h-4 w-4 sm:h-5 sm:w-5;
}
```

### 🎨 Utility Classes for Responsive Design

Add these to the shared design system CSS utilities:

```css
@layer utilities {
  /* Viewport width constraints */
  .max-vw-100 {
    max-width: 100vw;
  }
  
  .max-vw-90 {
    max-width: 90vw;
  }
  
  /* Mobile-first spacing */
  .gap-mobile {
    @apply gap-3 sm:gap-6;
  }
  
  .p-mobile {
    @apply p-4 sm:p-6 lg:p-8;
  }
  
  .py-mobile {
    @apply py-12 sm:py-16 lg:py-20;
  }
  
  .px-mobile {
    @apply px-4 sm:px-6 lg:px-8;
  }
  
  /* Button group layouts */
  .btn-group-mobile {
    @apply flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 w-full sm:w-auto;
  }
  
  .btn-mobile {
    @apply w-full sm:w-auto min-w-0;
  }
  
  /* Responsive flex patterns */
  .flex-mobile {
    @apply flex flex-col sm:flex-row;
  }
  
  .flex-mobile-center {
    @apply flex flex-col sm:flex-row justify-center items-center;
  }
  
  /* Text overflow prevention */
  .text-mobile-safe {
    @apply break-words overflow-hidden text-ellipsis;
  }
  
  /* Container constraints */
  .container-mobile {
    @apply w-full max-w-none px-4 mx-auto sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8;
  }
}
```

### 📋 Mobile Testing Checklist

#### ✅ Required Checks for All Components

1. **Width Constraints**
   - [ ] No element exceeds `100vw`
   - [ ] All containers use `max-w-full` or similar
   - [ ] No horizontal scrolling on mobile

2. **Button Groups**
   - [ ] Stack vertically on mobile (`flex-col`)
   - [ ] Use appropriate mobile spacing (`gap-3`)
   - [ ] Full-width buttons on mobile (`w-full`)

3. **Touch Targets**
   - [ ] Minimum 44px touch target size
   - [ ] Adequate spacing between interactive elements
   - [ ] No overlapping clickable areas

4. **Text and Icons**
   - [ ] Responsive text sizing (`text-sm sm:text-base`)
   - [ ] Responsive icon sizing (`h-4 w-4 sm:h-5 sm:w-5`)
   - [ ] No text overflow or truncation

5. **Section Spacing**
   - [ ] Responsive padding (`py-12 sm:py-16 lg:py-20`)
   - [ ] Mobile-appropriate margins
   - [ ] No excessive white space on mobile

### 🛠️ Implementation Examples

#### Contact Section (Let's Connect)
```jsx
<section className="py-mobile px-mobile">
  <div className="container-mobile text-center">
    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8">
      Let's Connect
    </h2>
    <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto">
      Interested in exploring how AI can enhance human connection? Let's
      discuss ideas and collaborate!
    </p>

    <div className="btn-group-mobile max-w-none sm:max-w-fit mx-auto">
      <Button
        variant="outline"
        size="default"
        className="btn-mobile hover:bg-primary hover:text-primary-foreground transition-smooth"
      >
        <Mail className="mr-2 mobile-icon" />
        <span className="mobile-text">Email</span>
      </Button>
      <Button
        variant="outline" 
        size="default"
        className="btn-mobile hover:bg-primary hover:text-primary-foreground transition-smooth"
      >
        <Linkedin className="mr-2 mobile-icon" />
        <span className="mobile-text">LinkedIn</span>
      </Button>
      <Button
        variant="outline"
        size="default" 
        className="btn-mobile hover:bg-primary hover:text-primary-foreground transition-smooth"
      >
        <Github className="mr-2 mobile-icon" />
        <span className="mobile-text">GitHub</span>
      </Button>
    </div>
  </div>
</section>
```

#### Hero Section
```jsx
<section className="py-mobile px-mobile min-h-screen flex items-center">
  <div className="container-mobile text-center">
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
      <span className="bg-gradient-primary bg-clip-text text-transparent">
        Welcome
      </span>
    </h1>
    <p className="mobile-text text-muted-foreground mb-8 max-w-2xl mx-auto">
      Building innovative solutions with modern technology
    </p>
  </div>
</section>
```

### 🚨 Common Mobile Issues to Avoid

1. **Fixed Width Elements**
   ```css
   /* Don't do this */
   .bad-container {
     width: 800px; /* Fixed width causes overflow */
   }
   
   /* Do this instead */
   .good-container {
     width: 100%;
     max-width: 800px; /* Responsive constraint */
   }
   ```

2. **Non-Responsive Flex Groups**
   ```jsx
   {/* Don't do this */}
   <div className="flex gap-6">
   
   {/* Do this instead */}
   <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
   ```

3. **Large Fixed Buttons**
   ```jsx
   {/* Don't do this */}
   <Button size="lg" className="min-w-[200px]">
   
   {/* Do this instead */}
   <Button size="default" className="w-full sm:w-auto">
   ```

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
