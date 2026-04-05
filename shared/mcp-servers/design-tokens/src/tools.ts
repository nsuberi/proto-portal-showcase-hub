import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  baseDesignTokens,
  createDesignTokens,
  createCSSVariables,
  presetOverrides,
  baseTailwindConfig,
  type DesignTokens,
  type DesignTokenOverrides,
} from "@proto-portal/design-tokens";
import {
  checkContrast,
  contrastRatio,
  generateHarmony,
  hslToHex,
  type HarmonyType,
  type ContrastResult,
} from "./utils/color-theory.js";

// ── Component registry for @proto-portal/ui-components ──────────────────

const COMPONENT_CATEGORIES = [
  "core",
  "learning",
  "curriculum",
  "exercise",
  "flow",
] as const;

interface ComponentEntry {
  name: string;
  importName: string;
  category: typeof COMPONENT_CATEGORIES[number];
  description: string;
  curriculumAreas: string[];
  props: string[];
  variants?: string[];
  codeDojo?: string;
}

const COMPONENT_REGISTRY: ComponentEntry[] = [
  // ── Core UI (extracted from prototypes) ──
  {
    name: "Button",
    importName: "Button",
    category: "core",
    description: "Primary action button with 7 variants and 4 sizes. Includes yellow 'progress' variant for Codecademy-style CTAs.",
    curriculumAreas: [],
    props: ["variant", "size", "disabled", "className"],
    variants: ["default", "destructive", "outline", "secondary", "ghost", "link", "progress"],
  },
  {
    name: "Card",
    importName: "Card",
    category: "core",
    description: "Content container with header, title, description, content, and footer sub-components. Subtle borders, not heavy shadows.",
    curriculumAreas: [],
    props: ["className"],
  },
  {
    name: "Badge",
    importName: "Badge",
    category: "core",
    description: "Inline label with 7 variants including monospace 'category' for Codecademy-style type labels.",
    curriculumAreas: [],
    props: ["variant", "className"],
    variants: ["default", "secondary", "destructive", "outline", "success", "warning", "category"],
  },
  {
    name: "Input",
    importName: "Input",
    category: "core",
    description: "Text input with focus ring and disabled states.",
    curriculumAreas: [],
    props: ["type", "placeholder", "disabled", "className"],
  },
  {
    name: "Label",
    importName: "Label",
    category: "core",
    description: "Form label built on Radix UI primitive.",
    curriculumAreas: [],
    props: ["className"],
  },
  {
    name: "Progress",
    importName: "Progress",
    category: "core",
    description: "Linear progress bar built on Radix UI.",
    curriculumAreas: [],
    props: ["value", "className"],
  },
  {
    name: "Select",
    importName: "Select",
    category: "core",
    description: "Dropdown select with trigger, content, items, and scroll buttons. Radix UI.",
    curriculumAreas: [],
    props: ["value", "onValueChange"],
  },
  {
    name: "Table",
    importName: "Table",
    category: "core",
    description: "Data table with header, body, footer, row, head, cell, caption sub-components.",
    curriculumAreas: [],
    props: ["className"],
  },
  {
    name: "Dialog",
    importName: "Dialog",
    category: "core",
    description: "Modal dialog with overlay, content, header, footer, title, description. Radix UI.",
    curriculumAreas: [],
    props: ["open", "onOpenChange"],
  },
  {
    name: "Popover",
    importName: "Popover",
    category: "core",
    description: "Floating popover panel. Radix UI.",
    curriculumAreas: [],
    props: ["align", "sideOffset"],
  },

  // ── Codecademy-inspired learning components ──
  {
    name: "ProgressRing",
    importName: "ProgressRing",
    category: "learning",
    description: "Circular percentage indicator with yellow ring on dark background. Shows completion % with optional label.",
    curriculumAreas: ["Auto-didactic"],
    props: ["value", "size", "strokeWidth", "label"],
    codeDojo: "Module completion %, goal progress, quiz scores",
  },
  {
    name: "ProgressSegments",
    importName: "ProgressSegments",
    category: "learning",
    description: "Multi-segment nav progress bar. Each segment shows pending/active/complete state with color coding.",
    curriculumAreas: ["Building"],
    props: ["segments"],
    codeDojo: "5-step workflow (Learn → Challenge → Plan → Submit → Review) in goal page nav",
  },
  {
    name: "XPBar",
    importName: "XPBar",
    category: "learning",
    description: "Linear progress bar with skill name, XP value, and optional gain display (before → after).",
    curriculumAreas: ["Auto-didactic"],
    props: ["skillName", "skillIcon", "currentXP", "maxXP", "gainedXP"],
    codeDojo: "Gem/mastery tracking per topic, post-submission XP gains",
  },
  {
    name: "StepChecklist",
    importName: "StepChecklist",
    category: "learning",
    description: "Numbered instruction steps with checkboxes. Click to toggle completion.",
    curriculumAreas: ["Building", "Community of Practice"],
    props: ["items", "onToggle"],
    codeDojo: "Goal page challenge instructions, project task lists",
  },
  {
    name: "CategoryBadge",
    importName: "CategoryBadge",
    category: "learning",
    description: "Monospace label badge for content types ('Course', 'Subskill', 'Challenge').",
    curriculumAreas: ["Discovery and Design"],
    props: ["variant"],
    variants: ["default", "highlight", "subtle"],
    codeDojo: "Module type labels, goal type indicators",
  },
  {
    name: "CollapsibleHint",
    importName: "CollapsibleHint",
    category: "learning",
    description: "'Stuck? Get a Hint' expandable section with chevron icon.",
    curriculumAreas: ["Building", "AI Design Principles"],
    props: ["label", "defaultOpen", "children"],
    codeDojo: "Planning harness hints, challenge guidance",
  },
  {
    name: "QuizOption",
    importName: "QuizOption",
    category: "learning",
    description: "Full-width bordered answer card with default/selected/correct/incorrect states.",
    curriculumAreas: ["Auto-didactic"],
    props: ["state", "children"],
    variants: ["default", "selected", "correct", "incorrect"],
    codeDojo: "Anatomy discussion topic selection, diagnostic exercises",
  },

  // ── Curriculum-mapped components ──
  {
    name: "OnboardingRadioGroup",
    importName: "OnboardingRadioGroup",
    category: "curriculum",
    description: "Radio card selection for onboarding quizzes with step indicator. Title + description per option.",
    curriculumAreas: ["Community of Practice", "Auto-didactic"],
    props: ["question", "subtitle", "options", "value", "onValueChange", "step"],
    codeDojo: "Student onboarding, self-assessment level selection, growth goal picker",
  },
  {
    name: "ResumeLearningCard",
    importName: "ResumeLearningCard",
    category: "curriculum",
    description: "'Keep learning' card with progress bar, category label, and resume/practice actions.",
    curriculumAreas: ["Auto-didactic", "Community of Practice"],
    props: ["categoryLabel", "title", "subtitle", "progress", "actions", "practiceCount"],
    codeDojo: "Student dashboard — current module with resume button",
  },
  {
    name: "SyllabusItem",
    importName: "SyllabusItem",
    category: "curriculum",
    description: "Type-icon + type label + title row for module syllabus views. Types: lesson, project, quiz, informational, challenge.",
    curriculumAreas: ["Building", "Discovery and Design"],
    props: ["type", "title", "icon", "duration", "completed"],
    codeDojo: "Module detail page — list of goals with types",
  },
  {
    name: "EventCard",
    importName: "EventCard",
    category: "curriculum",
    description: "Community event card with date/time, description, tags, and attendee count.",
    curriculumAreas: ["Community of Practice", "Navigating your Organization"],
    props: ["title", "date", "time", "duration", "description", "attendees", "tags", "onRegister"],
    codeDojo: "Community sessions calendar, scheduling page",
  },
  {
    name: "SettingsToggle",
    importName: "SettingsToggle",
    category: "curriculum",
    description: "Label + description + toggle switch for tool/preference configuration.",
    curriculumAreas: ["Architecture", "Building"],
    props: ["label", "description", "badge", "checked", "onChange", "disabled"],
    codeDojo: "Admin settings, notification preferences, feature toggles",
  },
  {
    name: "TemplateCardGroup",
    importName: "TemplateCardGroup",
    category: "curriculum",
    description: "Selection grid for choosing a language, technology, or template.",
    curriculumAreas: ["Building", "Architecture"],
    props: ["title", "options", "value", "onSelect", "columns"],
    codeDojo: "Challenge template selection, technology picker for exercises",
  },

  // ── Flow-critical components ──
  {
    name: "CodeDiffView",
    importName: "CodeDiffView",
    category: "flow",
    description: "Side-by-side code comparison with 'Keep my code' / 'Replace with solution' actions.",
    curriculumAreas: ["Building", "AI Design Principles"],
    props: ["leftTitle", "rightTitle", "leftCode", "rightCode", "onKeepMine", "onReplace"],
    codeDojo: "Submission review — student code vs AI suggestion, instructor feedback diffs",
  },
  {
    name: "QuizSummary",
    importName: "QuizSummary",
    category: "flow",
    description: "Post-quiz summary with ProgressRing score, correct/incorrect counts, question list with answer review.",
    curriculumAreas: ["Auto-didactic", "Building"],
    props: ["title", "score", "correct", "incorrect", "answers", "onPractice", "onRetake", "onContinue"],
    codeDojo: "Post-submission anatomy review, diagnostic exercise results",
  },
  {
    name: "WeeklyTarget",
    importName: "WeeklyTarget",
    category: "flow",
    description: "Weekly learning habit tracker with day-of-week indicators and target/completed counts.",
    curriculumAreas: ["Auto-didactic", "Community of Practice"],
    props: ["target", "completed", "daysOfWeek", "completedDays", "onTargetChange", "editable"],
    codeDojo: "Student dashboard — weekly engagement tracking",
  },
  {
    name: "AIChatPanel",
    importName: "AIChatPanel",
    category: "flow",
    description: "Slide-out AI assistant with message history, input, and loading state.",
    curriculumAreas: ["AI Design Principles"],
    props: ["title", "messages", "onSendMessage", "onClose", "isLoading", "placeholder"],
    codeDojo: "Socratic dialogue (anatomy chat), planning harness AI conversation",
  },
  {
    name: "FeatureDiscoveryCard",
    importName: "FeatureDiscoveryCard",
    category: "flow",
    description: "Icon + title + description card for surfacing platform features.",
    curriculumAreas: ["Navigating your Organization", "Go-to-market"],
    props: ["icon", "title", "description", "action"],
    codeDojo: "Dashboard — discover available challenges, tools, community features",
  },
  {
    name: "TestimonialCard",
    importName: "TestimonialCard",
    category: "flow",
    description: "Quote card with large quotation mark, reviewer name, role, location.",
    curriculumAreas: ["Go-to-market", "Community of Practice"],
    props: ["quote", "name", "role", "location", "avatar"],
    codeDojo: "Peer feedback display, instructor endorsements",
  },
  {
    name: "LoadingState",
    importName: "LoadingState",
    category: "flow",
    description: "Animated loading indicator with message and time estimate.",
    curriculumAreas: ["AI Design Principles", "Building"],
    props: ["message", "estimate", "icon"],
    codeDojo: "AI feedback generation, code review processing",
  },

  // ── Exercise & assessment ──
  {
    name: "FillInBlank",
    importName: "FillInBlank",
    category: "exercise",
    description: "Code block with empty slots and answer chips to click/drag into place. Progress counter + check answer.",
    curriculumAreas: ["Building", "Auto-didactic"],
    props: ["prompt", "codeTemplate", "slots", "choices", "onFill", "onClear", "onCheck", "progress"],
    codeDojo: "Diagnostic exercises — code completion challenges",
  },
  {
    name: "InlineFeedbackQuiz",
    importName: "InlineFeedbackQuiz",
    category: "exercise",
    description: "Quiz with immediate inline feedback — correct option turns green with explanation after answering.",
    curriculumAreas: ["Auto-didactic", "AI Design Principles"],
    props: ["question", "options", "correctId", "explanation", "selectedId", "onSelect"],
    codeDojo: "Concept review quizzes, anatomy topic assessment",
  },
  {
    name: "SkillMatrix",
    importName: "SkillMatrix",
    category: "exercise",
    description: "Grid of skill sets vs individual skills with percentage badges, level indicator, and XP total.",
    curriculumAreas: ["Auto-didactic", "Community of Practice"],
    props: ["title", "level", "totalXP", "skillSets", "onSkillClick"],
    codeDojo: "Admin student progress view, instructor dashboard skill tracking",
  },
  {
    name: "ConceptReference",
    importName: "ConceptReference",
    category: "exercise",
    description: "Two-column concept reference table with name, explanation, tested status, and evaluate/generate project CTAs.",
    curriculumAreas: ["Building", "Data Modeling"],
    props: ["title", "concepts", "onEvaluate", "onGenerateProject"],
    codeDojo: "Module detail — concept overview before starting, cheatsheet reference",
  },
  {
    name: "StudyPlanBanner",
    importName: "StudyPlanBanner",
    category: "exercise",
    description: "CTA banner card: 'Make a study plan' with description and outline action button.",
    curriculumAreas: ["Auto-didactic", "Discovery and Design"],
    props: ["title", "description", "ctaLabel", "onAction"],
    codeDojo: "Dashboard prompt to set learning goals, module planning CTA",
  },
  {
    name: "ProjectGenerator",
    importName: "ProjectGenerator",
    category: "exercise",
    description: "Custom project generator: subskill context card + theme selection grid + generate CTA.",
    curriculumAreas: ["Discovery and Design", "Building"],
    props: ["subskillLabel", "subskillDescription", "themes", "selectedTheme", "onSelectTheme", "onGenerate", "isGenerating"],
    codeDojo: "Challenge creation — generate custom exercises from curriculum topics",
  },
  {
    name: "StarRating",
    importName: "StarRating",
    category: "exercise",
    description: "Interactive 1-5 star rating selector with hover preview. Readonly mode for display.",
    curriculumAreas: ["Auto-didactic", "Go-to-market"],
    props: ["value", "onChange", "max", "size", "readonly"],
    codeDojo: "Post-submission feedback, course/module ratings",
  },
  {
    name: "CertificateModal",
    importName: "CertificateModal",
    category: "exercise",
    description: "Certificate of completion modal with preview, edit name, save PDF, and add to profile actions.",
    curriculumAreas: ["Go-to-market", "Community of Practice"],
    props: ["open", "onClose", "recipientName", "courseName", "date", "onEditName", "onSavePDF", "onAddToProfile"],
    codeDojo: "Module completion — certificate generation and sharing",
  },
  {
    name: "AIReviewPanel",
    importName: "AIReviewPanel",
    category: "exercise",
    description: "Structured AI code review output with sections containing pass/warning/suggestion feedback items. Not a chat — formatted review.",
    curriculumAreas: ["Building", "AI Design Principles"],
    props: ["title", "subtitle", "attribution", "sections"],
    codeDojo: "Submission review — AI feedback display with structured sections",
  },
];

function getComponents(category?: string, curriculumArea?: string): ComponentEntry[] {
  let filtered = COMPONENT_REGISTRY;
  if (category) {
    filtered = filtered.filter(c => c.category === category);
  }
  if (curriculumArea) {
    const area = curriculumArea.toLowerCase();
    filtered = filtered.filter(c =>
      c.curriculumAreas.some(a => a.toLowerCase().includes(area))
    );
  }
  return filtered;
}

const TOKEN_CATEGORIES = [
  "colors",
  "darkColors",
  "typography",
  "spacing",
  "gradients",
  "shadows",
  "transitions",
  "responsive",
  "learningMode",
  "chartColors",
  "skillCategories",
  "progress",
  "codeEditor",
  "quiz",
  "celebration",
] as const;

const PRESET_NAMES = ["default", "ffxSkillMap", "codeDojo", "highContrast", "vibrant"] as const;

const TAILWIND_CATEGORIES = [
  "colors",
  "spacing",
  "shadows",
  "gradients",
  "transitions",
  "typography",
  "responsive",
] as const;

function getPresetTokens(preset?: string): DesignTokens {
  if (!preset || preset === "default") return createDesignTokens();
  const overrides = presetOverrides[preset as keyof typeof presetOverrides] as DesignTokenOverrides | undefined;
  if (!overrides) throw new Error(`Unknown preset: ${preset}. Available: ${PRESET_NAMES.join(", ")}`);
  return createDesignTokens(overrides);
}

const HARMONY_TYPES = [
  "complementary",
  "analogous",
  "triadic",
  "split-complementary",
  "tetradic",
  "monochromatic",
] as const;

function getSemanticPairs(tokens: DesignTokens): Array<{ foreground: string; background: string; context: string }> {
  const c = tokens.colors;
  const pairs = [
    { foreground: c.foreground, background: c.background, context: "foreground on background" },
    { foreground: c.cardForeground, background: c.card, context: "cardForeground on card" },
    { foreground: c.popoverForeground, background: c.popover, context: "popoverForeground on popover" },
    { foreground: c.primaryForeground, background: c.primary, context: "primaryForeground on primary" },
    { foreground: c.secondaryForeground, background: c.secondary, context: "secondaryForeground on secondary" },
    { foreground: c.mutedForeground, background: c.muted, context: "mutedForeground on muted" },
    { foreground: c.accentForeground, background: c.accent, context: "accentForeground on accent" },
    { foreground: c.destructiveForeground, background: c.destructive, context: "destructiveForeground on destructive" },
    { foreground: c.successForeground, background: c.success, context: "successForeground on success" },
    { foreground: c.warningForeground, background: c.warning, context: "warningForeground on warning" },
    { foreground: c.infoForeground, background: c.info, context: "infoForeground on info" },
    { foreground: c.mutedForeground, background: c.background, context: "mutedForeground on background" },
  ];
  if (c.sidebar) {
    pairs.push(
      { foreground: c.sidebar.foreground, background: c.sidebar.background, context: "sidebar foreground on sidebar background" },
      { foreground: c.sidebar.primaryForeground, background: c.sidebar.primary, context: "sidebar primaryForeground on sidebar primary" },
      { foreground: c.sidebar.accentForeground, background: c.sidebar.accent, context: "sidebar accentForeground on sidebar accent" },
    );
  }
  // Learning mode pairs
  const lm = tokens.learningMode;
  if (lm) {
    pairs.push(
      { foreground: lm.foreground, background: lm.background, context: "learning-mode foreground on background" },
      { foreground: lm.cardForeground, background: lm.card, context: "learning-mode cardForeground on card" },
      { foreground: lm.mutedForeground, background: lm.background, context: "learning-mode mutedForeground on background" },
      { foreground: lm.accentForeground, background: lm.accent, context: "learning-mode accentForeground on accent (yellow CTA)" },
      { foreground: lm.popoverForeground, background: lm.popover, context: "learning-mode popoverForeground on popover" },
    );
  }
  return pairs;
}

function getTailwindClasses(category?: string): Record<string, unknown> {
  const extend = baseTailwindConfig.theme?.extend ?? {};
  if (!category) return extend as Record<string, unknown>;

  const mapping: Record<string, unknown> = {
    colors: extend.colors,
    spacing: extend.spacing,
    shadows: extend.boxShadow,
    gradients: extend.backgroundImage,
    transitions: extend.transitionTimingFunction,
    typography: {
      note: "Typography uses system font stack. Use text-xs through text-6xl for sizing, font-normal/medium/semibold/bold for weight.",
    },
    responsive: {
      breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" },
      usage: "Prefix any utility with sm:, md:, lg:, xl:, or 2xl: for responsive behavior.",
      utilities: [
        "gap-mobile", "p-mobile", "py-mobile", "px-mobile",
        "btn-group-mobile", "btn-mobile", "flex-mobile", "flex-mobile-center",
        "container-mobile", "mobile-text", "mobile-icon", "mobile-section", "mobile-container",
      ],
    },
  };

  if (!(category in mapping)) {
    throw new Error(`Unknown category: ${category}. Available: ${TAILWIND_CATEGORIES.join(", ")}`);
  }
  return { [category]: mapping[category] };
}

export function registerTools(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_tokens",
        description:
          "Get design token values. Returns all token categories or a specific one. Tokens include colors (HSL), typography, spacing, gradients, shadows, transitions, responsive breakpoints, chart colors, and skill category colors.",
        inputSchema: {
          type: "object" as const,
          properties: {
            category: {
              type: "string",
              enum: [...TOKEN_CATEGORIES],
              description: "Token category to retrieve. Omit for all categories.",
            },
          },
        },
      },
      {
        name: "get_theme",
        description:
          "Get a complete themed design token set. Applies preset overrides (deep merge) to the base tokens. Available presets: default (no overrides), ffxSkillMap (light theme, purple primary), codeDojo (warm cream + dark learning mode), highContrast, vibrant.",
        inputSchema: {
          type: "object" as const,
          properties: {
            preset: {
              type: "string",
              enum: [...PRESET_NAMES],
              description: "Theme preset name. Defaults to 'default' (base tokens, no overrides).",
            },
          },
        },
      },
      {
        name: "get_css_variables",
        description:
          "Get CSS custom properties for a theme. Returns a :root block with --variable declarations for colors, gradients, shadows, spacing, and transitions. Ready to paste into a CSS file.",
        inputSchema: {
          type: "object" as const,
          properties: {
            preset: {
              type: "string",
              enum: [...PRESET_NAMES],
              description: "Theme preset. Defaults to 'default'.",
            },
          },
        },
      },
      {
        name: "get_tailwind_classes",
        description:
          "Get available Tailwind CSS utility classes from the shared base config. Shows color utilities (bg-primary, text-muted-foreground, etc.), spacing, shadows, gradients, transitions, and responsive mobile utilities.",
        inputSchema: {
          type: "object" as const,
          properties: {
            category: {
              type: "string",
              enum: [...TAILWIND_CATEGORIES],
              description: "Category of Tailwind classes. Omit for all categories.",
            },
          },
        },
      },
      {
        name: "review_contrast",
        description:
          "Check WCAG 2.1 color contrast ratios. When called with no pairs, reviews all semantic foreground/background pairs in the theme. Reports pass/fail for AA normal (4.5:1), AA large (3:1), AAA normal (7:1), AAA large (4.5:1). Suggests adjusted colors for failures.",
        inputSchema: {
          type: "object" as const,
          properties: {
            preset: {
              type: "string",
              enum: [...PRESET_NAMES],
              description: "Theme preset to review. Defaults to 'default'.",
            },
            pairs: {
              type: "array",
              description:
                'Specific color pairs to check. Each item has foreground (HSL string like "263 70% 60%"), background (HSL string), and optional context label. If omitted, all semantic theme pairs are checked.',
              items: {
                type: "object",
                properties: {
                  foreground: { type: "string", description: 'HSL string like "263 70% 60%"' },
                  background: { type: "string", description: 'HSL string like "0 0% 98%"' },
                  context: { type: "string", description: "Optional label for this pair" },
                },
                required: ["foreground", "background"],
              },
            },
          },
        },
      },
      {
        name: "get_components",
        description:
          "Get available React UI components from @proto-portal/ui-components. Returns component name, description, props, variants, curriculum area mappings (from additional-structure.md), and Code Dojo usage suggestions. Filter by category (core, learning, curriculum, exercise, flow) or curriculum area.",
        inputSchema: {
          type: "object" as const,
          properties: {
            category: {
              type: "string",
              enum: [...COMPONENT_CATEGORIES],
              description: "Component category. core=extracted UI primitives, learning=Codecademy-inspired, curriculum=mapped to growth areas, exercise=assessment patterns, flow=interaction patterns.",
            },
            curriculum_area: {
              type: "string",
              description: 'Filter by curriculum area from additional-structure.md. E.g. "Building", "Auto-didactic", "AI Design Principles", "Community of Practice", "Discovery and Design", "Architecture", "Go-to-market", "Navigating your Organization", "Data Modeling".',
            },
          },
        },
      },
      {
        name: "generate_palette",
        description:
          "Generate a color harmony palette from a base color, inspired by the color wheel. Supports complementary, analogous, triadic, split-complementary, tetradic, and monochromatic harmonies. Returns HSL + hex values and a pairwise contrast matrix.",
        inputSchema: {
          type: "object" as const,
          properties: {
            base_color: {
              type: "string",
              description: 'Base color as an HSL string (e.g., "263 70% 60%").',
            },
            harmony: {
              type: "string",
              enum: [...HARMONY_TYPES],
              description: "Color harmony rule to apply.",
            },
            steps: {
              type: "number",
              description: "Number of colors for monochromatic palettes (default 5). Ignored for other harmony types.",
            },
          },
          required: ["base_color", "harmony"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get_tokens": {
        const category = (args as { category?: string }).category;
        if (category) {
          if (!TOKEN_CATEGORIES.includes(category as typeof TOKEN_CATEGORIES[number])) {
            return {
              content: [{ type: "text", text: `Unknown category: ${category}. Available: ${TOKEN_CATEGORIES.join(", ")}` }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text", text: JSON.stringify({ [category]: baseDesignTokens[category as keyof DesignTokens] }, null, 2) }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(baseDesignTokens, null, 2) }],
        };
      }

      case "get_theme": {
        const preset = (args as { preset?: string }).preset;
        try {
          const tokens = getPresetTokens(preset);
          return {
            content: [{ type: "text", text: JSON.stringify(tokens, null, 2) }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: (e as Error).message }], isError: true };
        }
      }

      case "get_css_variables": {
        const preset = (args as { preset?: string }).preset;
        try {
          const tokens = getPresetTokens(preset);
          const css = createCSSVariables(tokens);
          return {
            content: [{ type: "text", text: `:root {\n  ${css}\n}` }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: (e as Error).message }], isError: true };
        }
      }

      case "get_tailwind_classes": {
        const category = (args as { category?: string }).category;
        try {
          const classes = getTailwindClasses(category);
          return {
            content: [{ type: "text", text: JSON.stringify(classes, null, 2) }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: (e as Error).message }], isError: true };
        }
      }

      case "review_contrast": {
        const { preset, pairs } = args as {
          preset?: string;
          pairs?: Array<{ foreground: string; background: string; context?: string }>;
        };
        try {
          const tokens = getPresetTokens(preset);
          const pairsToCheck = pairs && pairs.length > 0 ? pairs : getSemanticPairs(tokens);
          const results: ContrastResult[] = pairsToCheck.map((p) =>
            checkContrast(p.foreground, p.background, p.context),
          );
          const summary = {
            preset: preset || "default",
            totalPairs: results.length,
            passingAA: results.filter((r) => r.passes.AA_normal).length,
            passingAAA: results.filter((r) => r.passes.AAA_normal).length,
            failures: results.filter((r) => !r.passes.AA_normal).length,
            results,
          };
          return {
            content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: (e as Error).message }], isError: true };
        }
      }

      case "get_components": {
        const { category, curriculum_area } = args as {
          category?: string;
          curriculum_area?: string;
        };
        const components = getComponents(category, curriculum_area);
        const summary = {
          package: "@proto-portal/ui-components",
          importExample: 'import { Button, Card, ProgressRing } from "@proto-portal/ui-components"',
          totalComponents: COMPONENT_REGISTRY.length,
          filteredCount: components.length,
          filters: {
            category: category || "all",
            curriculumArea: curriculum_area || "all",
          },
          components: components.map(c => ({
            name: c.name,
            import: c.importName,
            category: c.category,
            description: c.description,
            curriculumAreas: c.curriculumAreas,
            props: c.props,
            ...(c.variants ? { variants: c.variants } : {}),
            ...(c.codeDojo ? { codeDojo: c.codeDojo } : {}),
          })),
        };
        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      }

      case "generate_palette": {
        const { base_color, harmony, steps } = args as {
          base_color: string;
          harmony: HarmonyType;
          steps?: number;
        };
        try {
          const hslColors = generateHarmony(base_color, harmony, { steps });
          const colors = hslColors.map((hsl) => ({ hsl, hex: hslToHex(hsl) }));

          // Build pairwise contrast matrix
          const matrix: { pair: [number, number]; ratio: number; ratioFormatted: string }[] = [];
          for (let i = 0; i < hslColors.length; i++) {
            for (let j = i + 1; j < hslColors.length; j++) {
              const ratio = Math.round(contrastRatio(hslColors[i], hslColors[j]) * 100) / 100;
              matrix.push({ pair: [i, j], ratio, ratioFormatted: `${ratio}:1` });
            }
          }

          const result = {
            harmony,
            baseColor: { hsl: hslColors[0], hex: hslToHex(hslColors[0]) },
            colors,
            contrastMatrix: matrix,
          };
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        } catch (e) {
          return { content: [{ type: "text", text: (e as Error).message }], isError: true };
        }
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  });
}
