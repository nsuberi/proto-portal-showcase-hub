import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const DESIGN_SYSTEM_GUIDE = `You are working with the Proto Portal design system. Use these tokens consistently across all prototypes.

## Token Categories

- **Colors**: HSL-based semantic color system. All values are space-separated HSL triplets without the hsl() wrapper (e.g., "263 70% 60%"). This enables Tailwind's opacity modifier: \`hsl(var(--primary) / 0.5)\`.
  - Base: background, foreground, card, popover, primary, secondary, muted, accent, destructive
  - Extended: success, warning, info (each with foreground variant)
  - Sidebar: dedicated component colors
  - Dark mode: separate override set via \`.dark\` class

- **Typography**: System font stack (sans) + Menlo/Monaco (mono). 10 size levels (xs–6xl) with matched line heights. 4 weights: normal (400), medium (500), semibold (600), bold (700).

- **Spacing**: Scale from xs (4px/0.25rem) to 4xl (96px/6rem). Semantic tokens: section (80px), container (32px), component (24px), element (12px).

- **Gradients**: 5 named gradients — primary, secondary, subtle, hero, accent. CSS: \`var(--gradient-primary)\`. Tailwind: \`bg-gradient-primary\`.

- **Shadows**: 6 levels — glow, elegant, subtle, medium, large, primary. CSS: \`var(--shadow-glow)\`. Tailwind: \`shadow-glow\`.

- **Transitions**: 5 timing curves — smooth, fast, slow, bounce, elastic. CSS: \`var(--transition-smooth)\`. Tailwind: \`ease-smooth\`.

- **Responsive**: Breakpoints at sm (640), md (768), lg (1024), xl (1280), 2xl (1536). Design mobile-first.

- **Chart Colors**: 4 palettes for data viz — primary (5 semantic), categorical (8 distinct), sequential (6-step), diverging (7 with midpoint).

- **Skill Categories**: Color sets for FFX game categories (combat, magic, support, special, advanced) and tech org categories (engineering, platform, product, etc.).

## Usage Patterns

### TypeScript Import
\`\`\`typescript
import { createDesignTokens, presetOverrides, baseTailwindConfig } from "@proto-portal/design-tokens";

// Base tokens (no overrides)
const tokens = createDesignTokens();

// With a preset
const ffxTokens = createDesignTokens(presetOverrides.ffxSkillMap);

// Custom overrides
const custom = createDesignTokens({ colors: { primary: "200 80% 50%" } });
\`\`\`

### CSS Integration
\`\`\`css
@import "@proto-portal/design-tokens/css/tokens.css";
@import "@proto-portal/design-tokens/css/utilities.css";
\`\`\`

### Tailwind Setup
\`\`\`typescript
// tailwind.config.ts
import { baseTailwindConfig } from "@proto-portal/design-tokens";
export default {
  ...baseTailwindConfig,
  content: ["./src/**/*.{ts,tsx}"],
};
\`\`\`

## Available Presets
- **default**: Base dark theme — dark background, light text, purple primary
- **ffxSkillMap**: Light theme — white background, dark text, lighter purple primary, adjusted chart colors
- **highContrast**: Accessibility-focused — high contrast color pairs
- **vibrant**: Colorful — bright gradient definitions

## Mobile-First Utilities (from utilities.css)
\`gap-mobile\`, \`p-mobile\`, \`py-mobile\`, \`px-mobile\`, \`btn-group-mobile\`, \`btn-mobile\`, \`flex-mobile\`, \`flex-mobile-center\`, \`container-mobile\`, \`mobile-text\`, \`mobile-icon\`, \`mobile-section\`, \`mobile-container\`

## Rules
1. Always use semantic color names (primary, destructive, success) — never hardcode hex/hsl values
2. Use the spacing scale tokens — never arbitrary pixel values
3. Import baseTailwindConfig and extend it — never define colors from scratch
4. Design mobile-first: base styles for 320px+, then sm:/md:/lg: breakpoints
5. Ensure no element exceeds 100vw
6. Use presetOverrides for prototype-specific themes — never modify base tokens`;

function createComponentStylesPrompt(componentName: string, variant?: string, preset?: string): string {
  return `Create a styled React component called "${componentName}" using the Proto Portal design system.

${variant ? `**Variant**: ${variant}` : ""}
${preset ? `**Preset**: Use the "${preset}" theme preset` : "**Preset**: Use the default theme"}

## Requirements

1. Use Tailwind CSS classes from the shared base config (colors like \`bg-primary\`, \`text-muted-foreground\`, spacing like \`p-component\`, \`gap-element\`)
2. Reference CSS variables where Tailwind classes don't cover the need: \`hsl(var(--primary))\`, \`var(--gradient-hero)\`
3. Make the component responsive: mobile-first with sm:/md:/lg: breakpoints
4. Use the mobile utility classes where appropriate (btn-group-mobile, container-mobile, etc.)
5. Ensure touch targets are at least 44px on mobile
6. No element should exceed 100vw

## Available Color Classes
bg-primary, bg-secondary, bg-muted, bg-accent, bg-destructive, bg-card, bg-popover,
bg-success, bg-warning, bg-info,
text-foreground, text-primary-foreground, text-muted-foreground, text-accent-foreground,
text-success, text-warning, text-info,
border-border, border-input, ring-ring

## Available Effect Classes
bg-gradient-primary, bg-gradient-secondary, bg-gradient-subtle, bg-gradient-hero, bg-gradient-accent,
shadow-glow, shadow-elegant, shadow-subtle, shadow-medium, shadow-large, shadow-primary,
ease-smooth, ease-fast, ease-slow, ease-bounce, ease-elastic

## Available Spacing
p-xs, p-sm, p-md, p-lg, p-xl, p-2xl, p-3xl, p-4xl,
p-section, p-container, p-component, p-element
(same prefixes for m-, gap-, etc.)

Generate the component with proper TypeScript types, className composition using clsx/cn, and responsive design patterns.`;
}

export function registerPrompts(server: Server): void {
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: "design_system_guide",
        description:
          "Comprehensive guide for using the Proto Portal design system. Covers all token categories, usage patterns, presets, Tailwind integration, CSS variables, and mobile-first responsive rules.",
      },
      {
        name: "create_component_styles",
        description:
          "Generate a styled React component using design tokens. Provides context on available Tailwind classes, CSS variables, spacing, and responsive patterns.",
        arguments: [
          {
            name: "component_name",
            description: "Name of the component to style (e.g., 'FeatureCard', 'HeroSection')",
            required: true,
          },
          {
            name: "variant",
            description: "Style variant (e.g., 'primary', 'muted', 'gradient', 'outlined')",
            required: false,
          },
          {
            name: "preset",
            description: "Design token preset to use (default, ffxSkillMap, highContrast, vibrant)",
            required: false,
          },
        ],
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "design_system_guide":
        return {
          messages: [
            {
              role: "user" as const,
              content: { type: "text" as const, text: DESIGN_SYSTEM_GUIDE },
            },
          ],
        };

      case "create_component_styles": {
        const componentName = (args as Record<string, string> | undefined)?.component_name;
        if (!componentName) {
          throw new Error("component_name argument is required");
        }
        const variant = (args as Record<string, string>).variant;
        const preset = (args as Record<string, string>).preset;
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: createComponentStylesPrompt(componentName, variant, preset),
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });
}
