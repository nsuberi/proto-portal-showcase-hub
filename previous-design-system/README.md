# Previous Design System Tokens

This folder contains design tokens extracted from commit `679e4103eb836391ca70d53cb393fd041d08d2b0` of the proto-portal-showcase-hub. These tokens were analyzed from the Portfolio component and UI components as they existed at that specific commit.

## Files

- **colors.json** - Color palette including background, foreground, primary, secondary, and semantic colors
- **gradients.json** - Gradient definitions used in hero sections and buttons
- **shadows.json** - Shadow effects including glow and elegant shadows
- **typography.json** - Text styling for headings, body text, and specialized content
- **buttons.json** - Button variants, sizes, and custom styles
- **cards.json** - Card component styling and layout
- **transitions.json** - Animation and transition definitions
- **spacing.json** - Spacing tokens for sections, containers, and components
- **css-custom-properties.json** - CSS custom properties implementation patterns
- **hero-section.json** - Specific hero section layout and styling
- **import-paths.json** - Component import path patterns

## Key Design Patterns Identified

### Color Scheme
- Dark theme with purple primary color (hsl(263, 70%, 60%))
- High contrast with white text on dark backgrounds
- Muted colors for secondary content

### Typography
- Large, bold headings with gradient text effects
- Responsive text sizing (mobile-first approach)
- Clear hierarchy with muted foreground for descriptions

### Interactive Elements
- Smooth transitions (0.3s cubic-bezier)
- Glow effects on hover
- Gradient backgrounds for primary actions
- Outline variants for secondary actions

### Cards
- Prototype cards with hover effects
- Tag system for categorization
- Consistent padding and spacing
- Border and shadow treatments

### Layout
- Grid-based prototype showcase
- Responsive breakpoints (md, lg)
- Centered containers with max-width constraints
- Generous section spacing (py-20)

## Key Differences from Current Implementation

### CSS Custom Properties
- Commit version used `bg-gradient-primary` classes backed by CSS custom properties
- Current version uses inline Tailwind gradient utilities
- Commit approach provided better consistency and maintainability

### Card Styling  
- Commit: Card background same as main background (`hsl(240, 10%, 3.9%)`)
- Current: Card background darker (`hsl(240, 3.7%, 15.9%)`) for better separation

### Hero Section
- Commit version had additional gradient overlay layer (`bg-gradient-primary opacity-10`)
- Current version simplified to single background image with opacity

### Import Structure
- Commit: `@/components/ui/` individual component imports
- Current: `@proto-portal/design-system` centralized package imports

## Usage Notes

These tokens represent the design system as implemented in the specific commit 679e4103eb836391ca70d53cb393fd041d08d2b0. The tokens capture the original design patterns including CSS custom property usage, component styling, and architectural decisions that may have evolved in the current implementation.