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

const TOKEN_CATEGORIES = [
  "colors",
  "darkColors",
  "typography",
  "spacing",
  "gradients",
  "shadows",
  "transitions",
  "responsive",
  "chartColors",
  "skillCategories",
] as const;

const PRESET_NAMES = ["default", "ffxSkillMap", "highContrast", "vibrant"] as const;

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
          "Get a complete themed design token set. Applies preset overrides (deep merge) to the base tokens. Available presets: default (no overrides), ffxSkillMap (light theme, purple primary), highContrast, vibrant.",
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
