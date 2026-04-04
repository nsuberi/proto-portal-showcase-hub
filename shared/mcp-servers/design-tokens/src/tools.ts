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

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  });
}
