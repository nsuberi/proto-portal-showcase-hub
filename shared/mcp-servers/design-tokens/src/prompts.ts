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

// ── Pass 1: Design spec extraction from images ──────────────────────────

function createExtractDesignSpecPrompt(): string {
  return `You are extracting a design system specification from screenshots. Do NOT generate code yet. Your job is to infer the **system behind the visuals** — the repeating patterns, scales, and vocabularies that a designer would have defined.

## Why This Step Matters

Feeding screenshots directly to a code generator produces "archaeological" output — hardcoded hex values instead of tokens, magic pixel numbers instead of spacing scales, flat markup instead of composable components. The cure is to extract the system first, then generate against it.

## What to Extract

Examine every screenshot carefully and infer these categories:

### 1. Color Palette + Semantic Roles
Don't just list hex values — identify the *roles*:
- **Primary action color**: What color are the main CTAs? (e.g., Codecademy uses yellow #FFD300 for all primary actions)
- **Background tiers**: What distinct background colors exist? (page bg, card bg, input bg, overlay bg)
- **Text hierarchy colors**: What colors distinguish headings vs body vs metadata vs disabled text?
- **Accent/category colors**: Are there distinct hues for content categories, status indicators, or data viz?
- **Feedback colors**: Success, error, warning, info — what palette?
- **Interactive states**: Hover, focus, active, disabled — how do colors shift?

Output as HSL values with semantic names.

### 2. Typography Scale
Infer the type system by measuring relative sizes across screenshots:
- **Font families**: How many typefaces? Serif, sans, mono? Where is each used?
- **Size scale**: What distinct text sizes appear? Try to infer the scale (e.g., 12/14/16/18/20/24/30/36 suggests a modular scale). Name them (xs through 6xl or similar).
- **Weight usage**: Which weights appear? Where is bold vs medium vs regular used?
- **Line height patterns**: Tight (headings), normal (body), relaxed (captions)?
- **Letter spacing**: Any notable tracking differences (e.g., uppercase labels with wide tracking)?

### 3. Spacing Scale
This is commonly missed but critical for not-janky output:
- **Base unit**: Does the UI use a 4px grid? 8px? Look at padding inside cards, gaps between elements, margins between sections.
- **Scale**: What distinct spacing values appear? (e.g., 4, 8, 12, 16, 24, 32, 48, 64, 80, 96)
- **Semantic spacing**: Differentiate between element-level spacing (gaps within a component), component-level spacing (padding inside a card), section-level spacing (margin between page sections).
- **Consistent gutters**: What's the standard gap in grid layouts, card groups, nav items?

### 4. Border Radius Vocabulary
Another commonly missed detail that makes output look "off":
- **How many distinct radius values** appear? (e.g., sharp=0, subtle=4px, medium=8px, large=12px, pill=9999px)
- **Where is each used?** Cards, buttons, inputs, badges, avatars, modals — each typically has a consistent radius.
- **Are there mixed patterns?** Some UIs use sharp corners on sections but rounded corners on interactive elements.

### 5. Elevation / Shadow Patterns
- **How many shadow levels?** (e.g., none, subtle, medium, large, overlay)
- **Shadow characteristics**: Color (black at what opacity? colored shadows?), blur, spread, offset direction
- **Usage patterns**: What gets elevated? Cards, modals, dropdowns, hover states?
- **Alternatives to shadow**: Does the UI use borders, background shifts, or translucency for depth instead?

### 6. Component Archetypes
Identify recurring UI patterns — not as code, but as structural descriptions:
- **Cards**: What varieties? (content card, action card, stat card, list item card) What's consistent across them?
- **Buttons**: What variants exist? (filled, outlined, ghost, link, icon-only) What sizes?
- **Navigation**: Top bar, sidebar, tabs, breadcrumbs — what patterns?
- **Forms**: Input styles, label placement, error states, grouping patterns
- **Progress indicators**: Bars, rings, badges, step indicators — what vocabulary?
- **Badges/Labels**: How are categories, statuses, and types visually distinguished?
- **Layout patterns**: How is content structured? (sidebar + main, stacked cards, grid, split view)

### 7. Interaction & State Patterns (Inferred)
Some states aren't visible in static screenshots, but you can infer patterns:
- **Hover indicators**: Do elements use color shift, underline, glow, scale, shadow change?
- **Active/selected states**: How is current selection shown? (background fill, border accent, bold weight)
- **Disabled treatment**: Opacity reduction? Color desaturation?

## Output Format

Produce a structured JSON spec:

\`\`\`json
{
  "colors": {
    "primary": { "value": "hsl(48, 100%, 50%)", "role": "Primary CTAs, progress fills" },
    "background": { "value": "hsl(40, 30%, 96%)", "role": "Page background" },
    "surface": { "value": "hsl(0, 0%, 100%)", "role": "Card/panel backgrounds" },
    "text": {
      "heading": { "value": "hsl(240, 10%, 10%)", "weight": "bold" },
      "body": { "value": "hsl(240, 5%, 30%)", "weight": "normal" },
      "muted": { "value": "hsl(240, 5%, 55%)", "weight": "normal" }
    },
    "accent": { ... },
    "feedback": { "success": "...", "error": "...", "warning": "...", "info": "..." }
  },
  "typography": {
    "families": { "sans": "...", "mono": "..." },
    "scale": {
      "xs": { "size": "12px", "lineHeight": "16px" },
      "sm": { "size": "14px", "lineHeight": "20px" },
      ...
    },
    "weights": { "normal": 400, "medium": 500, "semibold": 600, "bold": 700 }
  },
  "spacing": {
    "baseUnit": "4px",
    "scale": { "xs": "4px", "sm": "8px", "md": "12px", "lg": "16px", "xl": "24px", "2xl": "32px", "3xl": "48px", "4xl": "64px" },
    "semantic": {
      "element": "8px",
      "component": "16px",
      "section": "48px",
      "page": "64px"
    }
  },
  "borderRadius": {
    "none": "0px",
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  },
  "shadows": {
    "none": "none",
    "subtle": "0 1px 2px rgba(0,0,0,0.05)",
    "medium": "0 4px 12px rgba(0,0,0,0.1)",
    ...
  },
  "components": {
    "card": { "radius": "lg", "padding": "xl", "shadow": "subtle", "border": "1px solid hsl(0,0%,90%)" },
    "button": {
      "primary": { "bg": "primary", "text": "white", "radius": "md", "paddingX": "xl", "paddingY": "sm" },
      "secondary": { ... }
    },
    ...
  }
}
\`\`\`

## Important

- **Infer, don't guess.** If you can see 3 distinct text sizes, report 3 — don't fabricate a full 10-level scale.
- **Be specific about what you observe vs. what you're inferring.** Mark inferred values with a note.
- **Multiple screenshots = better signal.** Cross-reference the same component across screens to confirm values.
- **This spec is the foundation** for Pass 2 (flow analysis or component generation). Accuracy here prevents jank downstream.`;
}

// ── Pass 2: Apply design spec to token system ─────────────────────────────

function createApplyDesignSpecPrompt(
  specJson: string,
  presetName: string,
): string {
  return `You are converting an extracted design spec JSON into a \`DesignTokenOverrides\` object for the Proto Portal design token system.

## Your Input

**Target preset name**: \`${presetName}\`

**Design spec JSON** (output of \`extract_design_spec\`):

\`\`\`json
${specJson}
\`\`\`

## Your Goal

Produce a complete \`DesignTokenOverrides\` TypeScript object that can be added to \`presetOverrides\` in \`shared/design-tokens/index.ts\`. The object will be deep-merged over the base tokens, so you only need to include values that differ from the base.

## Critical Format Rules

1. **HSL values are space-separated triplets WITHOUT the \`hsl()\` wrapper**:
   - Spec says \`"hsl(48, 100%, 50%)"\` → token value is \`"48 100% 50%"\`
   - Spec says \`"#FFD300"\` → convert to HSL → \`"48 100% 50%"\`
   - This format enables Tailwind's opacity modifier: \`hsl(var(--primary) / 0.5)\`

2. **Gradients and shadows keep their full CSS syntax**:
   - \`"linear-gradient(135deg, hsl(263, 55%, 50%), hsl(280, 80%, 60%))"\`
   - \`"0 4px 12px hsl(220, 20%, 12% / 0.08)"\`

3. **Spacing uses rem units** (divide px by 16):
   - \`"4px"\` → \`"0.25rem"\`, \`"8px"\` → \`"0.5rem"\`, \`"16px"\` → \`"1rem"\`

4. **The \`radius\` property is a string in rem**: \`"0.5rem"\`

## Token Interface Mapping

Map the spec's semantic categories to these exact TypeScript interfaces:

### colors (ColorTokens) — Browse/light mode surfaces

| Spec concept | Token property | Notes |
|---|---|---|
| Background page/cream | \`background\` | Main page background |
| Card/surface white | \`card\` | Card backgrounds |
| Card text | \`cardForeground\` | Text on cards |
| Popover/modal bg | \`popover\` | Dropdown/modal backgrounds |
| Popover text | \`popoverForeground\` | Text on popovers |
| Heading text | \`foreground\` | Primary text color |
| Primary action (often a brand color) | \`primary\` | Buttons, links, focus rings |
| Text on primary bg | \`primaryForeground\` | Button text |
| Secondary action | \`secondary\` | Secondary button backgrounds |
| Text on secondary | \`secondaryForeground\` | |
| Muted backgrounds | \`muted\` | Subtle backgrounds for de-emphasized areas |
| Muted text | \`mutedForeground\` | Metadata, placeholder text |
| Accent/CTA color | \`accent\` | Often a contrasting highlight (e.g., yellow) |
| Text on accent | \`accentForeground\` | |
| Error/destructive | \`destructive\` | Error states |
| Text on destructive | \`destructiveForeground\` | |
| Border color | \`border\` | Card/section borders |
| Input border/bg | \`input\` | Form input backgrounds |
| Focus ring color | \`ring\` | Focus indicator color |
| Border radius base | \`radius\` | e.g., "0.5rem" |
| Success color | \`success\` | |
| Success text | \`successForeground\` | |
| Warning color | \`warning\` | |
| Warning text | \`warningForeground\` | |
| Info color | \`info\` | |
| Info text | \`infoForeground\` | |
| Sidebar bg | \`sidebar.background\` | Navigation sidebar |
| Sidebar text | \`sidebar.foreground\` | |
| Sidebar active item | \`sidebar.primary\` | |
| Sidebar active text | \`sidebar.primaryForeground\` | |
| Sidebar hover bg | \`sidebar.accent\` | |
| Sidebar hover text | \`sidebar.accentForeground\` | |
| Sidebar border | \`sidebar.border\` | |
| Sidebar focus ring | \`sidebar.ring\` | |

### learningMode (LearningModeTokens) — Dark focus environment

If the spec defines a separate dark/learning/editor mode (e.g., Codecademy's dark code environment), map it here:

\`\`\`typescript
interface LearningModeTokens {
  background: string;    // Deep dark page bg (e.g., "230 40% 10%")
  foreground: string;    // Light text (e.g., "0 0% 92%")
  card: string;          // Dark card surfaces
  cardForeground: string;
  border: string;        // Subtle dark borders
  muted: string;         // De-emphasized dark surface
  mutedForeground: string; // Muted text
  accent: string;        // CTA color in dark mode (often yellow)
  accentForeground: string; // Text on accent
  popover: string;       // Tooltip/popover dark bg
  popoverForeground: string;
  input: string;         // Dark input backgrounds
  ring: string;          // Focus ring in dark mode
}
\`\`\`

### progress (ProgressTokens)

\`\`\`typescript
interface ProgressTokens {
  barFill: string;         // Progress bar fill color (often primary/accent)
  barTrack: string;        // Progress bar empty track
  circleStroke: string;    // Circular progress ring fill
  circleTrack: string;     // Circular progress ring track
  xpGain: string;          // XP gain indicator (often green)
  xpText: string;          // XP label text color
  segmentComplete: string; // Completed segment in multi-step (often green)
  segmentActive: string;   // Current/active segment (often accent)
  segmentPending: string;  // Pending/future segment (dark muted)
}
\`\`\`

### codeEditor (CodeEditorTokens)

\`\`\`typescript
interface CodeEditorTokens {
  background: string;      // Editor canvas bg
  foreground: string;      // Default code text color
  lineNumber: string;      // Line number gutter text
  activeLine: string;      // Active line highlight bg
  selection: string;       // Text selection highlight
  cursor: string;          // Cursor color
  gutterBackground: string; // Left gutter bg
  gutterBorder: string;    // Gutter right-border
}
\`\`\`

### quiz (QuizTokens)

\`\`\`typescript
interface QuizTokens {
  optionBackground: string;         // Answer card bg
  optionBorder: string;             // Default answer card border
  optionHoverBorder: string;        // Hovered answer card border
  optionSelectedBorder: string;     // Selected (before submit) border
  optionSelectedBackground: string; // Selected (before submit) bg
  optionCorrectBorder: string;      // Correct answer border
  optionCorrectBackground: string;  // Correct answer bg
  optionIncorrectBorder: string;    // Incorrect answer border
  optionIncorrectBackground: string; // Incorrect answer bg
}
\`\`\`

### celebration (CelebrationTokens)

\`\`\`typescript
interface CelebrationTokens {
  background: string;      // Celebration screen bg
  foreground: string;      // Celebration text
  trophy: string;          // Trophy/achievement icon color
  confettiPrimary: string; // Main confetti color
  confettiSecondary: string; // Secondary confetti
  confettiTertiary: string;  // Tertiary confetti
  ctaBackground: string;   // "What's Next?" button bg
  ctaForeground: string;   // CTA button text
  checkmark: string;       // Completion checkmark color
}
\`\`\`

### gradients (GradientTokens)

\`\`\`typescript
interface GradientTokens {
  primary: string;    // Main brand gradient (CSS linear-gradient)
  secondary: string;  // Secondary brand gradient
  subtle: string;     // Subtle background gradient
  hero: string;       // Hero section gradient
  accent: string;     // Accent/highlight gradient
}
\`\`\`

### shadows (ShadowTokens)

\`\`\`typescript
interface ShadowTokens {
  glow: string;     // Glowing brand shadow for emphasis
  elegant: string;  // Subtle elegant shadow
  subtle: string;   // Very light shadow
  medium: string;   // Standard card shadow
  large: string;    // Modal/overlay shadow
  primary: string;  // Primary-colored shadow
}
\`\`\`

## How to Handle Design Decisions

- **Two-mode systems** (light browse + dark learning): Map the light mode to \`colors\`, the dark mode to \`learningMode\`. The \`.learning-mode\` CSS class swaps variables automatically.
- **If the spec has a single mode**: Just map to \`colors\`. Skip \`learningMode\` or set it to match the spec's dark mode if one exists.
- **Accent vs Primary**: In our system, \`primary\` is the main interactive color (buttons, links, focus). \`accent\` is a secondary highlight. If the spec has a yellow CTA and a purple secondary, map yellow→\`accent\` and purple→\`primary\` (or the reverse depending on which is the dominant brand color used for buttons/links).
- **Missing values**: Only include properties you can confidently map. The deep merge fills in base tokens for anything not overridden.
- **Contrast verification**: After producing the override, recommend running \`review_contrast\` with the new preset to validate WCAG compliance.

## Output Format

Produce three things:

### 1. The DesignTokenOverrides object

\`\`\`typescript
/**
 * ${presetName} — [one-line description from spec]
 * [Brief description of the design system's character]
 */
${presetName}: {
  colors: {
    // Browse mode
    background: "...",
    foreground: "...",
    // ... all mapped values
  },
  gradients: {
    primary: "linear-gradient(...)",
    // ...
  },
  shadows: { ... },
  learningMode: {
    // Dark focus mode (if applicable)
    background: "...",
    // ...
  },
  progress: { ... },
  codeEditor: { ... },
  quiz: { ... },
  celebration: { ... },
} as DesignTokenOverrides,
\`\`\`

### 2. Mapping rationale

A brief table showing key decisions:
| Spec value | Token property | Rationale |
|---|---|---|

### 3. Recommended follow-up

- Which \`review_contrast\` pairs to check
- Any component registry updates needed (new variants, adjusted descriptions)
- Any values that were ambiguous and should be verified against the source screenshots

## Important

- **Every HSL value must be space-separated without \`hsl()\` wrapper.** This is the #1 error to avoid.
- **Don't over-map.** If the spec mentions 10 shadow levels but our system has 6, map only the closest 6.
- **Include a JSDoc comment** above the preset explaining its origin and design philosophy.
- **Verify your own output** — spot-check that foreground/background pairs seem like they'd pass WCAG AA (4.5:1 minimum for normal text).`;
}

// ── Pass 3: Flow analysis (two-pass approach) ────────────────────────────

function createFlowAnalysisPrompt(persona: string, jtbd: string): string {
  return `You are analyzing screenshots of a web flow for a specific persona and their job-to-be-done.

## Persona
${persona}

## Job-to-Be-Done
${jtbd}

---

## Prerequisite: Design Spec Extraction

If you haven't already run the \`extract_design_spec\` prompt on these screenshots (or a representative set), do that first. Flow analysis without an extracted spec produces vague pixel-description ("the button is blue") instead of grounded system analysis ("the primary CTA uses the action color at full weight, consistent with the spec"). If you already have a spec, reference it throughout.

---

## 1. Information Hierarchy Analysis

For each screenshot, evaluate:

**Visual weight distribution** — What draws the eye within the first 2 seconds? Factors: size, color saturation/contrast, position (top-left anchor, center focal point), whitespace isolation. Is the highest-weight element the one that *should* be highest-weight for this persona's JTBD?

**Reading flow** — Follow the natural F-pattern or Z-pattern scan. Does the content priority match the scan path? Are important elements placed where the eye naturally lands?

**CTA prominence** — Rate each call-to-action:
- **Primary** (unmissable): Full primary-action-color background, large size, isolated by whitespace, above fold
- **Secondary** (findable): Outlined or muted color, visible but not competing
- **Tertiary** (discoverable): Text links, footer actions, visible only on deliberate scan

**Content density** — Over-packed (cognitive overload) or under-packed (wasted opportunity)? Reference the spacing spec — are section gaps consistent? Are components breathing or cramped?

## 2. CTA-to-JTBD Mapping

For each CTA identified:
- **What action does it promise?** (e.g., "Start learning" vs. "Sign up")
- **How does that action serve the persona's JTBD?** Draw a direct line.
- **Is the label specific enough?** "Get Started" is weaker than "Start Your First AI Project."
- **Is it positioned at the right moment?** A CTA needs enough preceding context for the persona to understand *why* they should act.
- **Does the visual treatment match importance?** The most JTBD-aligned CTA should use the highest-weight visual treatment from the spec.

## 3. Flow Coherence

Across the full sequence:

**Narrative arc** — Hook (why this matters to the persona) → Orient (what's available, what's the structure) → Activate (do the specific thing).

**Visual consistency** — Are the same components rendered consistently across screens? Same border radius, same spacing scale, same color roles? Inconsistency signals an unfinished system.

**Progressive disclosure** — Is complexity introduced gradually? First screen = simple and compelling. Details and configuration come later.

**Dead ends** — Where might the persona abandon? Choice paralysis, missing back affordance, or content that doesn't match CTA promise.

**Momentum** — Progress indicators, preview of what's next, small wins (checkmarks, unlocks).

## 4. Reference Patterns (Codecademy)

Compare against these proven patterns. Deviations should be intentional.

**Landing page:** Urgency banner → Hero with rotating value props + primary yellow CTA → Value statement → Social proof → Content discovery cards

**Dashboard:** "Resume learning" card (#1 prominence, yellow progress bar) → Weekly target (habit reinforcement) → Recommended courses (discovery secondary to continuation)

**CTA patterns:** Yellow = primary action (always). Specific verbs ("Start learning", "Resume", "Practice") not generic ("Click here"). Full-width on mobile, sized by importance on desktop.

**Design system specifics:** Yellow #FFD300 for all primary CTAs + progress fills. ~8px card radius, ~4px button radius, pill badges. 8px base grid. Cards use 1px border (not shadow), 24px padding. Progress bars: yellow fill on grey-200 track.

## 5. Narrative Output Format

\`\`\`markdown
## Flow Overview
What flow, who for, what JTBD.

## Design Spec Reference
(Key values from extract_design_spec, or inline extraction if not done separately)

## Step-by-Step Analysis

### Step 1: {step_label}
- **First impression**: What draws the eye (reference spec values)
- **Information hierarchy**: Ranked list with spec references
- **CTAs**: Label, prominence, JTBD alignment, visual treatment vs spec
- **Spec adherence**: Spacing, radius, color consistency observations
- **Strengths**: What works for this persona
- **Gaps**: What's missing or misaligned

## Visual Consistency Audit
Spec adherence across screens. Components that deviate from archetypes.

## Flow Coherence
Narrative arc, transitions, progressive disclosure, dead ends, momentum.

## CTA Effectiveness Summary

| CTA Label | Step | Visual Treatment | Prominence | JTBD Alignment | Verdict |
|-----------|------|-----------------|------------|-----------------|---------|

## Recommendations
1. **What** — Specific, grounded in spec
2. **Why** — Tied to persona JTBD
3. **Spec value** — Which token/pattern to apply
4. **Reference** — Proven pattern that demonstrates the principle
5. **Impact** — High/Medium/Low
\`\`\`

After completing your analysis, call \`write_flow_narrative\` to persist the narrative to disk.`;
}

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
      {
        name: "extract_design_spec",
        description:
          "Two-pass design extraction from screenshots. Pass 1: infer the design system (color palette + semantic roles, typography scale, spacing scale, border radius vocabulary, elevation/shadow patterns, component archetypes) as structured JSON. Use this BEFORE generating components or analyzing flows — it prevents 'archaeological' output with hardcoded values. Feed representative screenshots, get a token spec back.",
      },
      {
        name: "apply_design_spec",
        description:
          "Convert an extracted design spec JSON (from extract_design_spec) into a DesignTokenOverrides object for the Proto Portal token system. Maps spec colors, typography, spacing, shadows, and component patterns to the exact token interfaces (ColorTokens, LearningModeTokens, ProgressTokens, CodeEditorTokens, QuizTokens, CelebrationTokens, etc.). Outputs ready-to-paste TypeScript for shared/design-tokens/index.ts presetOverrides.",
        arguments: [
          {
            name: "spec_json",
            description: "The full design spec JSON string (output of extract_design_spec or a manually created spec file)",
            required: true,
          },
          {
            name: "preset_name",
            description: "Target preset name (e.g., 'codeDojo', 'myNewTheme'). Will be used as the key in presetOverrides.",
            required: true,
          },
        ],
      },
      {
        name: "flow_analysis",
        description:
          "Framework for analyzing web flow screenshots. Evaluates information hierarchy, CTA mapping to persona JTBD, and flow coherence. Best used AFTER extract_design_spec so analysis is grounded in the extracted system, not vague pixel descriptions. Use with capture_flow screenshots.",
        arguments: [
          {
            name: "persona",
            description: "Target persona description (e.g., 'Aspiring AI builder who wants to learn by doing')",
            required: true,
          },
          {
            name: "jtbd",
            description: "Job-to-be-done (e.g., 'Find a structured path from zero to shipping an AI-powered app')",
            required: true,
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

      case "extract_design_spec":
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: createExtractDesignSpecPrompt(),
              },
            },
          ],
        };

      case "apply_design_spec": {
        const specJson = (args as Record<string, string> | undefined)?.spec_json;
        if (!specJson) {
          throw new Error("spec_json argument is required");
        }
        const presetName = (args as Record<string, string>).preset_name;
        if (!presetName) {
          throw new Error("preset_name argument is required");
        }
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: createApplyDesignSpecPrompt(specJson, presetName),
              },
            },
          ],
        };
      }

      case "flow_analysis": {
        const persona = (args as Record<string, string> | undefined)?.persona;
        if (!persona) {
          throw new Error("persona argument is required");
        }
        const jtbd = (args as Record<string, string>).jtbd;
        if (!jtbd) {
          throw new Error("jtbd argument is required");
        }
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: createFlowAnalysisPrompt(persona, jtbd),
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
