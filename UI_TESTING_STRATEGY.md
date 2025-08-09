# UI Testing Strategy

## Overview

This document outlines the testing strategy for the Proto Portal Showcase Hub UI components, with a focus on the design system and visual regression prevention.

## Testing Framework

### Primary Tools
- **Vitest**: Fast, modern testing framework for unit and integration tests (planned)
- **React Testing Library**: Component testing with focus on user behavior (planned)
- **jsdom**: DOM environment simulation for browser-like testing (planned)

### Test Types

#### 1. Unit Tests
**Scope**: Individual component behavior and props
**Location**: App-local components (no shared UI package). Suggested locations: `src/components/*.test.tsx` in each app.

**What we test:**
- Component renders correctly with different props
- Event handlers work as expected
- Accessibility attributes are present
- CSS classes are applied correctly
- Custom styling (gradients, shadows, transitions) is applied

**Example**: `button.test.tsx` validates:
- Default gradient styling (`bg-gradient-primary`)
- Hover effects (`hover:shadow-glow`)
- Smooth transitions (`transition-smooth`)
- All variant combinations (default, outline, secondary, etc.)
- Size variations (sm, default, lg, icon)
- Disabled states
- Click handlers

#### 2. Visual Regression Tests
**Purpose**: Ensure design system changes don't break visual appearance

**Key Areas to Monitor:**
- Button gradients and hover effects
- Tag styling and colors
- Component spacing and layout
- Color scheme consistency
- Shadow and glow effects

#### 3. Integration Tests
**Scope**: Component interactions within pages
**Location**: `src/components/*.test.tsx` or `prototypes/*/src/**/*.test.tsx` (suggested)

**What we test:**
- Portfolio page button interactions
- Navigation between prototypes
- Form submissions and user flows
- Design system component integration

## Design System Testing Focus

### Critical Visual Elements
1. **Color System**
   - Primary color (`--primary: 263 70% 60%`)
   - Gradient applications (`--gradient-primary`)
   - Theme consistency across light/dark modes

2. **Interactive Elements**
   - Button hover states and transitions
   - Tag color combinations (`bg-primary/10 text-primary`)
   - Focus states and accessibility

3. **Layout Components**
   - Card shadows (`shadow-elegant`)
   - Background gradients (`bg-gradient-subtle`)
   - Responsive breakpoints

### Test Commands

No tests are currently configured in this repository. Suggested setup:

```bash
# Root scripts (example)
"test": "vitest",
"test:watch": "vitest --watch"
```

## Testing Best Practices

### 1. Component Testing
- Test user interactions, not implementation details
- Verify accessibility attributes (`role`, `aria-*`)
- Test all variant combinations
- Validate custom CSS class applications

### 2. Visual Testing
- Test gradient backgrounds render correctly
- Verify hover effects apply proper shadows
- Ensure transitions work smoothly
- Check color contrast ratios

### 3. Regression Prevention
- Test after CSS variable changes
- Validate button styling after design system updates
- Verify prototype-specific customizations don't break

## Running Tests

### Development Workflow
1. Write component tests alongside component development
2. Run tests in watch mode during development: `npm run test:watch`
3. Validate all tests pass before committing changes
4. Use visual inspection for design validation

### CI/CD Integration
```bash
# Add to package.json scripts
"test:ci": "vitest run --coverage"
```

## Test Coverage Goals

### Design System Components
- **Buttons**: 100% of variants, sizes, states
- **Cards**: Layout, hover effects, responsive behavior
- **Tags**: Color combinations, text contrast
- **Forms**: Validation states, accessibility

### Visual Elements
- **Gradients**: Proper CSS variable application
- **Shadows**: Hover and focus effects
- **Transitions**: Smooth animations
- **Typography**: Color and spacing consistency

## Troubleshooting Common Issues

### CSS Variables Not Applied
- Ensure CSS variables are properly defined in `:root`
- Verify Tailwind utility classes are generated correctly
- Check that component tests import necessary CSS

### Gradient Testing
- Use `getComputedStyle()` to verify CSS variable values
- Test both light and dark theme applications
- Validate fallback colors for unsupported browsers

### Hover Effect Testing
- Use `fireEvent.mouseEnter()` and `fireEvent.mouseLeave()`
- Verify CSS classes are toggled correctly
- Test focus states for keyboard navigation

## Future Enhancements

1. **Visual Regression Testing**: Add Chromatic or Percy for screenshot comparison
2. **Accessibility Testing**: Integrate axe-core for automated a11y testing
3. **Performance Testing**: Monitor component render times
4. **Cross-browser Testing**: Validate gradient support across browsers

## Maintenance

- Review test coverage monthly
- Update tests when design system changes
- Validate visual elements after major CSS updates
- Keep testing dependencies up to date