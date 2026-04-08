import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  baseColorTokens,
  darkColorTokens,
  typographyTokens,
  spacingTokens,
  gradientTokens,
  shadowTokens,
  transitionTokens,
  responsiveTokens,
  chartColorTokens,
  skillCategoryTokens,
  learningModeTokens,
  progressTokens,
  codeEditorTokens,
  quizTokens,
  celebrationTokens,
} from "@proto-portal/design-tokens";

interface ResourceEntry {
  uri: string;
  name: string;
  description: string;
  data: unknown;
}

const resources: ResourceEntry[] = [
  {
    uri: "proto-portal://design-tokens/colors",
    name: "Color Tokens",
    description: "Semantic color system in HSL format. Includes base colors (background, foreground, primary, secondary, muted, accent, destructive), extended colors (success, warning, info), and sidebar-specific colors. Light mode by default.",
    data: { light: baseColorTokens, dark: darkColorTokens },
  },
  {
    uri: "proto-portal://design-tokens/typography",
    name: "Typography Tokens",
    description: "Font families (system sans + mono stack), font sizes (xs through 6xl with line heights), and font weights (normal, medium, semibold, bold).",
    data: typographyTokens,
  },
  {
    uri: "proto-portal://design-tokens/spacing",
    name: "Spacing Tokens",
    description: "Spacing scale from xs (4px) to 4xl (96px) plus semantic tokens: section (80px), container (32px), component (24px), element (12px). All in rem.",
    data: spacingTokens,
  },
  {
    uri: "proto-portal://design-tokens/gradients",
    name: "Gradient Tokens",
    description: "5 named CSS gradients: primary, secondary, subtle, hero, accent. Use via CSS var(--gradient-*) or Tailwind bg-gradient-* classes.",
    data: gradientTokens,
  },
  {
    uri: "proto-portal://design-tokens/shadows",
    name: "Shadow Tokens",
    description: "6 box-shadow levels: glow, elegant, subtle, medium, large, primary. Use via CSS var(--shadow-*) or Tailwind shadow-* classes.",
    data: shadowTokens,
  },
  {
    uri: "proto-portal://design-tokens/transitions",
    name: "Transition Tokens",
    description: "5 transition timing curves: smooth, fast, slow, bounce, elastic. Use via CSS var(--transition-*) or Tailwind ease-* classes.",
    data: transitionTokens,
  },
  {
    uri: "proto-portal://design-tokens/responsive",
    name: "Responsive Tokens",
    description: "Breakpoints (sm:640, md:768, lg:1024, xl:1280, 2xl:1536), container constraints, and mobile-first patterns for spacing, buttons, and content width.",
    data: responsiveTokens,
  },
  {
    uri: "proto-portal://design-tokens/chart-colors",
    name: "Chart Color Tokens",
    description: "Data visualization palettes: primary (5 semantic), categorical (8 distinct), sequential (6-step gradient), diverging (7 with midpoint).",
    data: chartColorTokens,
  },
  {
    uri: "proto-portal://design-tokens/skill-categories",
    name: "Skill Category Tokens",
    description: "Category-specific color sets for FFX (combat, magic, support, special, advanced, default) and tech org (engineering, platform, product, communication, process, leadership).",
    data: skillCategoryTokens,
  },
  {
    uri: "proto-portal://design-tokens/learning-mode",
    name: "Learning Mode Tokens",
    description: "Two-mode surface tokens for browse (cream) vs focused learning (navy). Apply .learning-mode class to swap all surface colors. Codecademy-inspired pattern.",
    data: learningModeTokens,
  },
  {
    uri: "proto-portal://design-tokens/progress",
    name: "Progress & XP Tokens",
    description: "Yellow progress bar fill, dark track, circle stroke, XP gain green, segment colors (complete/active/pending). Codecademy-inspired.",
    data: progressTokens,
  },
  {
    uri: "proto-portal://design-tokens/code-editor",
    name: "Code Editor Tokens",
    description: "Code editor surface colors: background, foreground, line numbers, active line, selection, cursor, gutter.",
    data: codeEditorTokens,
  },
  {
    uri: "proto-portal://design-tokens/quiz",
    name: "Quiz Tokens",
    description: "Quiz option card colors: border (blue/teal), hover, selected (purple), correct (green), incorrect (red).",
    data: quizTokens,
  },
  {
    uri: "proto-portal://design-tokens/celebration",
    name: "Celebration Tokens",
    description: "Completion screen colors: background, trophy (yellow), confetti colors, CTA button, checkmark.",
    data: celebrationTokens,
  },
];

export function registerResources(server: Server): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: resources.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: "application/json",
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const resource = resources.find((r) => r.uri === uri);

    if (!resource) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: "application/json",
          text: JSON.stringify(resource.data, null, 2),
        },
      ],
    };
  });
}
