/**
 * MCP tool for analyzing design system component coverage against
 * persona jobs-to-be-done. Reorganizes the component registry by
 * interaction type, maps against JTBD stages, surfaces gaps, and
 * generates conversation-starting questions.
 *
 * One tool:
 *   audit_component_coverage – Analyze whether components cover the
 *                              interactions your personas need
 */

import { COMPONENT_REGISTRY, type ComponentEntry } from "./tools.js";

// ── Interaction taxonomy ────────────────────────────────────────────────
// What kind of user interaction does a component facilitate?

interface InteractionType {
  id: string;
  label: string;
  description: string;
}

const INTERACTION_TYPES: InteractionType[] = [
  { id: "orient", label: "Orient", description: "Help users understand where they are, what's available, and what matters" },
  { id: "navigate", label: "Navigate", description: "Move between areas, browse catalog, find content" },
  { id: "decide", label: "Decide", description: "Choose between options, select paths, commit to a direction" },
  { id: "act", label: "Act", description: "Primary actions — start, submit, continue, create, confirm" },
  { id: "learn", label: "Learn", description: "Consume content, follow instructions, read explanations" },
  { id: "practice", label: "Practice", description: "Hands-on exercises, challenges, build something" },
  { id: "reflect", label: "Reflect", description: "Review progress, see results, get feedback, self-assess" },
  { id: "connect", label: "Connect", description: "Social proof, community, peer interaction, mentorship" },
  { id: "celebrate", label: "Celebrate", description: "Completion milestones, achievements, rewards, recognition" },
  { id: "configure", label: "Configure", description: "Settings, preferences, personalization, tool setup" },
];

// ── JTBD stage framework ────────────────────────────────────────────────
// What stages does a user move through when hiring your product?

interface JtbdStage {
  id: string;
  label: string;
  description: string;
  /** Which interaction types are critical at this stage */
  requiredInteractions: string[];
}

const JTBD_STAGES: JtbdStage[] = [
  {
    id: "discover",
    label: "Discover",
    description: "Find out the platform exists and what it offers",
    requiredInteractions: ["orient", "navigate", "connect"],
  },
  {
    id: "evaluate",
    label: "Evaluate",
    description: "Decide if it's worth starting — credibility, fit, value",
    requiredInteractions: ["orient", "connect", "navigate"],
  },
  {
    id: "onboard",
    label: "Onboard",
    description: "Get set up, oriented, and ready to learn",
    requiredInteractions: ["orient", "decide", "configure", "act"],
  },
  {
    id: "first_win",
    label: "First Win",
    description: "Complete something meaningful and feel capable",
    requiredInteractions: ["learn", "practice", "act", "celebrate"],
  },
  {
    id: "build_habit",
    label: "Build Habit",
    description: "Return regularly, track streaks, maintain momentum",
    requiredInteractions: ["navigate", "act", "reflect", "celebrate"],
  },
  {
    id: "deepen",
    label: "Deepen",
    description: "Tackle harder material, build real-world skills, get AI help",
    requiredInteractions: ["learn", "practice", "reflect", "decide"],
  },
  {
    id: "demonstrate",
    label: "Demonstrate",
    description: "Show what you've learned — projects, certificates, portfolio",
    requiredInteractions: ["reflect", "celebrate", "connect", "act"],
  },
  {
    id: "advocate",
    label: "Advocate",
    description: "Share with others, contribute to community, mentor peers",
    requiredInteractions: ["connect", "act", "orient"],
  },
];

// ── Component → Interaction Type classification ─────────────────────────
// Maps each component to the interaction types it facilitates.
// This is the analytical layer — it reclassifies components by what they DO.

const COMPONENT_INTERACTION_MAP: Record<string, string[]> = {
  // Core
  Button: ["act"],
  Card: ["orient"],
  Badge: ["orient"],
  Input: ["act", "configure"],
  Label: ["orient"],
  Progress: ["reflect"],
  Select: ["decide", "configure"],
  Table: ["orient", "reflect"],
  Dialog: ["decide", "act"],
  Popover: ["orient"],

  // Learning
  ProgressRing: ["reflect"],
  ProgressSegments: ["orient", "navigate"],
  XPBar: ["reflect", "celebrate"],
  StepChecklist: ["learn", "act"],
  CategoryBadge: ["orient", "navigate"],
  CollapsibleHint: ["learn"],
  QuizOption: ["practice", "decide"],

  // Curriculum
  OnboardingRadioGroup: ["decide", "configure"],
  ResumeLearningCard: ["navigate", "act"],
  SyllabusItem: ["orient", "navigate"],
  EventCard: ["connect", "navigate"],
  SettingsToggle: ["configure"],
  TemplateCardGroup: ["decide"],

  // Flow
  CodeDiffView: ["reflect", "decide"],
  QuizSummary: ["reflect"],
  WeeklyTarget: ["reflect", "configure"],
  AIChatPanel: ["learn", "practice"],
  FeatureDiscoveryCard: ["orient", "navigate"],
  TestimonialCard: ["connect"],
  LoadingState: ["orient"],

  // Exercise
  FillInBlank: ["practice"],
  InlineFeedbackQuiz: ["practice", "reflect"],
  SkillMatrix: ["reflect"],
  ConceptReference: ["learn", "orient"],
  StudyPlanBanner: ["act", "decide"],
  ProjectGenerator: ["practice", "decide"],
  StarRating: ["reflect", "connect"],
  CertificateModal: ["celebrate"],
  AIReviewPanel: ["reflect", "learn"],
};

// ── Analysis engine ─────────────────────────────────────────────────────

interface CoverageCell {
  stage: string;
  interaction: string;
  components: string[];
  isCritical: boolean;
}

interface CoverageAnalysis {
  byInteraction: Record<string, ComponentEntry[]>;
  byStage: Record<string, { stage: JtbdStage; coverage: CoverageCell[] }>;
  gaps: CoverageCell[];
  strengths: CoverageCell[];
  stats: {
    totalComponents: number;
    interactionsCovered: number;
    interactionsTotal: number;
    criticalGaps: number;
    stageWithWeakestCoverage: string;
  };
}

function buildCoverageAnalysis(): CoverageAnalysis {
  // Group components by interaction type
  const byInteraction: Record<string, ComponentEntry[]> = {};
  for (const iType of INTERACTION_TYPES) {
    byInteraction[iType.id] = [];
  }

  for (const comp of COMPONENT_REGISTRY) {
    const interactions = COMPONENT_INTERACTION_MAP[comp.name] || [];
    for (const iType of interactions) {
      if (byInteraction[iType]) {
        byInteraction[iType].push(comp);
      }
    }
  }

  // Build stage-level coverage
  const byStage: Record<string, { stage: JtbdStage; coverage: CoverageCell[] }> = {};
  const allGaps: CoverageCell[] = [];
  const allStrengths: CoverageCell[] = [];

  for (const stage of JTBD_STAGES) {
    const coverage: CoverageCell[] = [];
    for (const iType of INTERACTION_TYPES) {
      const isCritical = stage.requiredInteractions.includes(iType.id);
      const components = byInteraction[iType.id].map((c) => c.name);
      const cell: CoverageCell = {
        stage: stage.id,
        interaction: iType.id,
        components,
        isCritical,
      };
      coverage.push(cell);
      if (isCritical && components.length === 0) {
        allGaps.push(cell);
      }
      if (isCritical && components.length >= 3) {
        allStrengths.push(cell);
      }
    }
    byStage[stage.id] = { stage, coverage };
  }

  // Find weakest stage
  let weakest = JTBD_STAGES[0].id;
  let weakestScore = Infinity;
  for (const stage of JTBD_STAGES) {
    const stageData = byStage[stage.id];
    const criticalCells = stageData.coverage.filter((c) => c.isCritical);
    const score = criticalCells.reduce((sum, c) => sum + c.components.length, 0);
    if (score < weakestScore) {
      weakestScore = score;
      weakest = stage.id;
    }
  }

  const coveredInteractions = Object.values(byInteraction).filter((comps) => comps.length > 0).length;

  return {
    byInteraction,
    byStage,
    gaps: allGaps,
    strengths: allStrengths,
    stats: {
      totalComponents: COMPONENT_REGISTRY.length,
      interactionsCovered: coveredInteractions,
      interactionsTotal: INTERACTION_TYPES.length,
      criticalGaps: allGaps.length,
      stageWithWeakestCoverage: weakest,
    },
  };
}

// ── Output formatting ───────────────────────────────────────────────────

function formatCoverageReport(
  analysis: CoverageAnalysis,
  persona?: string,
  jtbd?: string,
  focusStage?: string,
): string {
  const lines: string[] = [];

  // Header
  lines.push("# Component Coverage Audit");
  lines.push("");
  if (persona) lines.push(`**Persona:** ${persona}`);
  if (jtbd) lines.push(`**Job to be Done:** ${jtbd}`);
  if (persona || jtbd) lines.push("");

  // Stats
  lines.push(`## Overview`);
  lines.push("");
  lines.push(`- **${analysis.stats.totalComponents}** components in the library`);
  lines.push(`- **${analysis.stats.interactionsCovered}/${analysis.stats.interactionsTotal}** interaction types covered`);
  lines.push(`- **${analysis.stats.criticalGaps}** critical gaps (JTBD stage needs an interaction type with zero components)`);
  lines.push(`- **Weakest stage:** ${analysis.stats.stageWithWeakestCoverage}`);
  lines.push("");

  // Component inventory by interaction type
  lines.push("## Components by Interaction Type");
  lines.push("");
  lines.push("How your components reorganize when viewed through the lens of *what they help users do*:");
  lines.push("");

  for (const iType of INTERACTION_TYPES) {
    const comps = analysis.byInteraction[iType.id];
    const marker = comps.length === 0 ? " [EMPTY]" : comps.length <= 2 ? " [THIN]" : "";
    lines.push(`### ${iType.label}${marker}`);
    lines.push(`*${iType.description}*`);
    lines.push("");
    if (comps.length === 0) {
      lines.push("No components currently serve this interaction type.");
    } else {
      for (const comp of comps) {
        lines.push(`- **${comp.name}** (${comp.category}) — ${comp.description.split(".")[0]}`);
      }
    }
    lines.push("");
  }

  // JTBD stage coverage matrix
  if (focusStage) {
    const stageData = analysis.byStage[focusStage];
    if (stageData) {
      lines.push(`## Deep Dive: "${stageData.stage.label}" Stage`);
      lines.push("");
      lines.push(`*${stageData.stage.description}*`);
      lines.push("");
      lines.push("| Interaction | Critical? | Components | Count |");
      lines.push("|-------------|-----------|------------|-------|");
      for (const cell of stageData.coverage) {
        const label = INTERACTION_TYPES.find((i) => i.id === cell.interaction)?.label || cell.interaction;
        const critical = cell.isCritical ? "YES" : "";
        const compList = cell.components.length > 0 ? cell.components.join(", ") : "---";
        const flag = cell.isCritical && cell.components.length === 0 ? " **GAP**" : "";
        lines.push(`| ${label} | ${critical} | ${compList} | ${cell.components.length}${flag} |`);
      }
      lines.push("");
    }
  } else {
    lines.push("## JTBD Stage Coverage Matrix");
    lines.push("");
    lines.push("Each row is a stage in the user's journey. Columns show how many components serve each critical interaction type at that stage.");
    lines.push("");

    // Header row
    const iTypeHeaders = INTERACTION_TYPES.map((i) => i.label.substring(0, 5));
    lines.push(`| Stage | ${iTypeHeaders.join(" | ")} |`);
    lines.push(`|-------|${iTypeHeaders.map(() => "-----").join("|")}|`);

    for (const stage of JTBD_STAGES) {
      const stageData = analysis.byStage[stage.id];
      const cells = INTERACTION_TYPES.map((iType) => {
        const cell = stageData.coverage.find((c) => c.interaction === iType.id)!;
        const count = cell.components.length;
        if (!cell.isCritical) return `${count}`;
        if (count === 0) return "**0**";
        return `**${count}**`;
      });
      lines.push(`| ${stage.label} | ${cells.join(" | ")} |`);
    }
    lines.push("");
    lines.push("*Bold = critical interaction for that stage. **0** = gap.*");
    lines.push("");
  }

  // Gaps
  if (analysis.gaps.length > 0) {
    lines.push("## Critical Gaps");
    lines.push("");
    lines.push("These are JTBD stages that need an interaction type you have zero components for:");
    lines.push("");
    for (const gap of analysis.gaps) {
      const stage = JTBD_STAGES.find((s) => s.id === gap.stage)!;
      const iType = INTERACTION_TYPES.find((i) => i.id === gap.interaction)!;
      lines.push(`- **${stage.label}** stage needs **${iType.label}** (${iType.description})`);
    }
    lines.push("");
  }

  // Strengths
  if (analysis.strengths.length > 0) {
    lines.push("## Strengths");
    lines.push("");
    lines.push("JTBD stages where you have 3+ components serving a critical interaction:");
    lines.push("");
    for (const strength of analysis.strengths) {
      const stage = JTBD_STAGES.find((s) => s.id === strength.stage)!;
      const iType = INTERACTION_TYPES.find((i) => i.id === strength.interaction)!;
      lines.push(
        `- **${stage.label} / ${iType.label}**: ${strength.components.join(", ")} (${strength.components.length} components)`,
      );
    }
    lines.push("");
  }

  // Conversation starters
  lines.push("## Questions to Explore");
  lines.push("");

  const questions = generateQuestions(analysis, persona, jtbd, focusStage);
  for (let i = 0; i < questions.length; i++) {
    lines.push(`${i + 1}. ${questions[i]}`);
  }
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push(
    "Call this tool again with a `focus_stage` to deep-dive into any specific stage. " +
      "Or provide a `persona` and `jtbd` to tailor the analysis to a specific user.",
  );

  return lines.join("\n");
}

function generateQuestions(
  analysis: CoverageAnalysis,
  persona?: string,
  jtbd?: string,
  focusStage?: string,
): string[] {
  const questions: string[] = [];

  // Gap-driven questions
  for (const gap of analysis.gaps) {
    const stage = JTBD_STAGES.find((s) => s.id === gap.stage)!;
    const iType = INTERACTION_TYPES.find((i) => i.id === gap.interaction)!;
    questions.push(
      `The **${stage.label}** stage needs **${iType.label}** interactions but you have no dedicated component. ` +
        `Is a core primitive (Button, Card) handling this, or is this a genuine blind spot?`,
    );
  }

  // Interaction-type questions
  const thinTypes = INTERACTION_TYPES.filter(
    (i) => analysis.byInteraction[i.id].length > 0 && analysis.byInteraction[i.id].length <= 2,
  );
  for (const iType of thinTypes) {
    const comps = analysis.byInteraction[iType.id].map((c) => c.name);
    questions.push(
      `You only have **${comps.join(" and ")}** for **${iType.label}** interactions. ` +
        `Are these sufficient, or do ${persona ? "users like your " + persona : "your users"} need more specialized ${iType.label.toLowerCase()} patterns?`,
    );
  }

  // Persona-specific questions
  if (persona && jtbd) {
    questions.push(
      `When your **${persona}** is trying to "${jtbd}", what's the first thing they see? ` +
        `Do your Orient components (${analysis.byInteraction["orient"].map((c) => c.name).join(", ")}) ` +
        `make the value proposition immediately clear?`,
    );
    questions.push(
      `What happens when that persona gets stuck? You have ${analysis.byInteraction["learn"].length} Learn components — ` +
        `do they cover the "I don't understand" moment as well as the "teach me step by step" moment?`,
    );
    questions.push(
      `How does this persona know they're making progress? Your Reflect components ` +
        `(${analysis.byInteraction["reflect"].map((c) => c.name).join(", ")}) show quantitative progress — ` +
        `but do you have anything for qualitative "aha, I get it now" moments?`,
    );
  }

  // Stage-specific deep questions
  if (focusStage) {
    const stage = JTBD_STAGES.find((s) => s.id === focusStage);
    if (stage) {
      questions.push(
        `Walk through the **${stage.label}** stage moment by moment. What's the user's emotional state? ` +
          `Do your components match that emotional arc, or are they purely functional?`,
      );
    }
  }

  // General strategic questions (always include a few)
  const weakestStage = JTBD_STAGES.find((s) => s.id === analysis.stats.stageWithWeakestCoverage)!;
  questions.push(
    `Your weakest stage is **${weakestStage.label}** ("${weakestStage.description}"). ` +
      `Is this intentionally out of scope, or should it be a priority?`,
  );

  questions.push(
    `You have ${analysis.byInteraction["celebrate"].length} Celebrate component(s) — ` +
      `does the emotional payoff match the effort your users put in? ` +
      `What would make completion feel more meaningful?`,
  );

  questions.push(
    `Look at the transition between stages: does a user completing "First Win" get naturally pulled into "Build Habit"? ` +
      `Which components bridge that transition?`,
  );

  return questions;
}

// ── Tool definition ─────────────────────────────────────────────────────

export const coverageToolDefinitions = [
  {
    name: "audit_component_coverage",
    description:
      "Analyze whether your design system components cover the range of interactions " +
      "your personas need across their jobs-to-be-done. Reorganizes the component registry " +
      "by interaction type (orient, navigate, decide, act, learn, practice, reflect, connect, " +
      "celebrate, configure), maps against JTBD stages (discover through advocate), identifies " +
      "gaps, and generates conversation-starting questions. Use this to drive a design review " +
      "discussion about component coverage.",
    inputSchema: {
      type: "object" as const,
      properties: {
        persona: {
          type: "string",
          description:
            'Target persona to tailor the analysis for (e.g., "aspiring AI builder who wants to learn by doing"). ' +
            "Generates persona-specific questions when provided.",
        },
        jtbd: {
          type: "string",
          description:
            'The job-to-be-done to focus on (e.g., "find a structured path from zero to shipping an AI-powered app"). ' +
            "Sharpens gap analysis and questions around this specific outcome.",
        },
        focus_stage: {
          type: "string",
          enum: ["discover", "evaluate", "onboard", "first_win", "build_habit", "deepen", "demonstrate", "advocate"],
          description:
            "Deep-dive into a specific JTBD stage. Shows a detailed interaction-by-interaction breakdown " +
            "for that stage instead of the full matrix.",
        },
      },
    },
  },
];

// ── Tool handler ────────────────────────────────────────────────────────

type ToolContent = { type: "text"; text: string };
type ToolResult = { content: ToolContent[]; isError?: boolean };

export function handleCoverageToolCall(
  name: string,
  args: unknown,
): ToolResult | null {
  if (name !== "audit_component_coverage") return null;

  const { persona, jtbd, focus_stage } = (args || {}) as {
    persona?: string;
    jtbd?: string;
    focus_stage?: string;
  };

  if (focus_stage && !JTBD_STAGES.find((s) => s.id === focus_stage)) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Unknown stage: ${focus_stage}. Available: ${JTBD_STAGES.map((s) => s.id).join(", ")}`,
        },
      ],
      isError: true,
    };
  }

  const analysis = buildCoverageAnalysis();
  const report = formatCoverageReport(analysis, persona, jtbd, focus_stage);

  return {
    content: [{ type: "text" as const, text: report }],
  };
}
