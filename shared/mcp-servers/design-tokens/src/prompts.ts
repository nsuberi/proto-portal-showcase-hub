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

const STYLE_GUIDE = `You are an opinionated design consultant for the Proto Portal design system. When the user asks about styling, color choices, or component design — or when you're reviewing code that has visual issues — apply these principles. Don't just check accessibility; propose designs that look intentional and polished.

## Visual Identity

The portfolio uses a **dark, glassy aesthetic** with selective color accents. Think: developer tool meets design showcase. The base is dark and muted; color is used sparingly and purposefully to draw the eye.

- **Dark base**: Near-black backgrounds (HSL 240 10% 3.9%) with subtle blue undertone
- **Glassy surfaces**: Cards and panels use translucent backgrounds (\`bg-background/80 backdrop-blur-xl\`) to create depth. Pair with \`ring-1 ring-{color}-500/20\` for a subtle colored edge.
- **Color as signal**: Full-saturation color is reserved for interactive elements, category indicators, and calls-to-action. Body text is light but muted (slate-300/400, not pure white).

## Information Hierarchy (Most to Least Prominent)

1. **Primary CTA** — Full-color background, light text, shadow-glow on hover. Should be unmistakable.
   \`bg-primary text-primary-foreground hover:shadow-glow\`

2. **Section headings** — Bright foreground (text-foreground / slate-100), bold weight. The brightest text on the page.

3. **Interactive elements** — Links in blue-400 (not blue-600, which is invisible on dark). Clickable items get hover glow (\`hover:drop-shadow-[0_0_8px_rgba(...)]\`) to invite interaction.

4. **Body copy** — slate-300 on dark backgrounds. Readable but not competing with headings.
   Never use text-foreground for body paragraphs — it's too bright. Never use text-muted-foreground — it's too dim.

5. **Secondary / metadata** — slate-400 for timestamps, match percentages, attribution.

6. **Decorative elements** — Background text, watermarks, ornamental items. Use /70 opacity on the 400-shade of their category color. They should be visible enough to notice and click, but clearly behind the foreground content.

## Using Color on Dark Backgrounds

On dark (near-black) backgrounds, the rules change from light-theme conventions:

- **Don't use -50/-100 background shades** (bg-blue-50, bg-violet-100). These create jarring light rectangles. Instead use tinted dark backgrounds: \`bg-indigo-950/30\` or \`bg-violet-950/40\`.
- **Don't use -800/-900 text on dark** (text-amber-800). These are invisible. Use -300/-400 for text on dark.
- **Borders**: Use colored borders at low opacity: \`border-violet-500/20\` rather than \`border-border\` (which is invisible) or \`border-white\` (which is harsh).
- **Translucent layers**: \`bg-white/5\` for subtle inner containers, \`bg-white/10\` for slightly more distinct. Never higher than /15 or it looks washed out.

## Category Color Systems

When a component needs distinct colors for categories (e.g., memory/skill/tool/concept):

1. **Choose a palette using \`generate_palette\`** — tetradic (4 categories) or split-complementary (3 categories) gives maximum distinction.
2. **Use the 400-shade** for text on dark backgrounds, **600-shade** for text on light backgrounds.
3. **Badges**: Tinted background + matching text. Dark theme: \`bg-amber-900/30 text-amber-300\`. Light theme: \`bg-amber-100 text-amber-800\`.
4. **Hover states**: Shift one shade lighter (400→300 on dark, 600→700 on light) and add a category-colored glow.
5. **Never use opacity below /60 on category text** — it destroys the color identity and makes everything look grey.

## Panels and Cards

Nested containers should create subtle depth without monotony:

- **Top-level card**: \`bg-background/80 backdrop-blur-xl border border-white/10 ring-1 ring-{accent}-500/20\`
- **Inner panel** (e.g., response area): Tinted dark background — \`bg-indigo-950/30 border border-indigo-500/20\`
- **Inner content block** (e.g., justification): \`bg-white/5 rounded\` — barely visible distinction
- **List items**: \`bg-white/5 border border-white/10 hover:bg-white/8\` — interactive feel

Each nesting level should be visually distinguishable but not a jarring contrast step.

## Gradients and Glows

Use these intentionally — they're the portfolio's signature visual element:

- **Hero gradients**: Directional (135°), from primary to secondary, at 0.1 opacity for backgrounds
- **Button glows**: \`hover:shadow-[0_0_20px_rgba(...)]\` matching the button's color at 0.3 opacity
- **Category glows**: \`hover:drop-shadow-[0_0_8px_rgba(...)]\` on floating/clickable text
- **Ring accents**: \`ring-1 ring-violet-500/20\` on cards to add a subtle brand presence

## What NOT to Do

- Don't flatten everything to bg-muted/text-muted-foreground — that strips personality
- Don't use pure white (text-white) for body copy on dark — use slate-300
- Don't use semantic tokens for everything — \`bg-secondary\` on dark theme is just another shade of dark grey, which adds no visual information
- Don't remove translucency just because it's "not reliable contrast" — translucency is an intentional design choice. Make sure the TEXT is readable, not that the background is opaque.
- Don't sacrifice visual hierarchy for accessibility dogma — decorative background text at /70 opacity is fine; it's not body copy.

## When the User Has No Strong Opinion

If asked "what color should this be?" or styling a new component with no specific guidance:

1. Start with the dark glass card pattern for the main container
2. Use the primary (violet/purple) as the accent — it's the brand color
3. Use indigo/blue tints for informational panels (results, analysis)
4. Use the appropriate category colors if content has categories
5. Call \`generate_palette\` with the primary color and try analogous (for cohesive) or split-complementary (for variety)
6. Call \`review_contrast\` on your proposed pairs to verify readability
7. Propose something concrete with rationale — don't just list options`;

function createDesignReviewPrompt(componentCode: string, preset?: string): string {
  return `Audit this component for both **visual design quality** and **accessibility**, using the Proto Portal style guide.

## Approach

Don't just check contrast ratios mechanically. Read the component and understand its visual intent — what's decorative, what's informational, what's interactive. Then evaluate whether the color choices serve those roles well.

## Steps

1. **Understand the component's purpose** — What is this UI doing? What should draw the user's eye first?

2. **Check theme baseline** — Call \`review_contrast\` with preset "${preset || "default"}" to see how the theme's semantic pairs perform.

3. **Audit each color choice** against the style guide:
   - Is body text slate-300 (readable but not competing with headings)?
   - Are headings brighter than body text?
   - Do CTAs have full-color backgrounds with appropriate glow on hover?
   - Do category colors use the right shade (-400 on dark, -600 on light)?
   - Are panels using tinted dark backgrounds (bg-{hue}-950/30) rather than flat grey?
   - Are translucent containers (backdrop-blur) paired with readable text?

4. **Check contrast on the pairs that matter** — Call \`review_contrast\` with specific foreground/background pairs. Focus on:
   - Body text on its actual background (not just the theme default)
   - Link text on its container
   - Badge text on badge background

5. **Propose concrete fixes** — Don't just say "increase contrast." Give the exact Tailwind classes that fix the problem AND preserve the visual intent. Use \`generate_palette\` to find harmonious alternatives when a color needs to change.

## Rules

- Body text: slate-300 on dark (not text-foreground, not text-muted-foreground)
- Metadata: slate-400
- Headings: text-foreground (slate-100)
- Links: blue-400 hover:blue-300 on dark
- Decorative bg text: {category}-400/70 (visible but behind content)
- Panels: bg-{hue}-950/30 with border-{hue}-500/20
- Inner containers: bg-white/5
- DO NOT flatten everything to semantic tokens — preserve the visual personality

${STYLE_GUIDE}

## Component Code

\`\`\`tsx
${componentCode}
\`\`\``;
}

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
        name: "style_guide",
        description:
          "Opinionated design guide for the Proto Portal visual identity. Covers information hierarchy, color usage on dark backgrounds, category color systems, panel/card patterns, gradients and glows, and concrete suggestions when the user has no strong preference. Use this when styling new components or when asked 'what should this look like?'",
      },
      {
        name: "design_review",
        description:
          "Audit a component for WCAG 2.1 color contrast accessibility. Instructs Claude how to use review_contrast and generate_palette to find contrast failures and suggest accessible, harmonious replacements.",
        arguments: [
          {
            name: "component_code",
            description: "The component's source code (TSX/JSX) to audit for contrast issues",
            required: true,
          },
          {
            name: "preset",
            description: "Design token preset being used (default, ffxSkillMap, highContrast, vibrant)",
            required: false,
          },
        ],
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

      case "style_guide":
        return {
          messages: [
            {
              role: "user" as const,
              content: { type: "text" as const, text: STYLE_GUIDE },
            },
          ],
        };

      case "design_review": {
        const componentCode = (args as Record<string, string> | undefined)?.component_code;
        if (!componentCode) {
          throw new Error("component_code argument is required");
        }
        const reviewPreset = (args as Record<string, string>).preset;
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: createDesignReviewPrompt(componentCode, reviewPreset),
              },
            },
          ],
        };
      }

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
