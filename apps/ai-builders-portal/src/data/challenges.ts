import type { Phase, ChallengeStatus } from "@/design-system/tokens";

export type Practice = "Discovery" | "Building" | "Security" | "Storytelling";

export interface Challenge {
  id: string;
  phase: Phase;
  title: string;
  description: string;
  fullDescription?: string;
  deliverables: string[];
  status: ChallengeStatus;
  tags: string[];
  practices: Practice[];
  submission?: number;
  references?: Array<{ title: string; content: string; category: string }>;
}

export const challenges: Challenge[] = [
  /* ── Submission 1 ── */
  {
    id: "brownfield-analysis",
    phase: 1,
    title: "Brownfield analysis",
    submission: 1,
    description:
      "Analyze a brownfield codebase across three angles: data architecture, proxy/deployment networking, and testing coverage against inferred product intent.",
    fullDescription:
      "Use Claude skills to explore an existing codebase you didn't write. Analyze the data architecture of the application itself, the proxy and deployment architecture of how the app is accessed from a browser, and the testing coverage — assessed against what the product is supposed to do, not just what's been tested. Identify gaps between intent and behavior.",
    deliverables: [
      "Data architecture analysis",
      "Deployment/networking analysis",
      "Test coverage gap analysis",
    ],
    status: "reviewed",
    tags: ["Architecture", "Analysis"],
    practices: ["Discovery"],
    references: [
      {
        title: "How proxies interact with hot module reload",
        category: "architecture",
        content:
          "When your dev server runs behind a proxy, WebSocket connections for HMR need special handling. The proxy must forward the Upgrade header for the WebSocket handshake. If your changes aren't reflecting in the browser, this is the first place to look.",
      },
      {
        title: "Reading and understanding log output",
        category: "building",
        content:
          "Logs are your primary debugging instrument. Learn to read timestamps, identify request/response pairs, and spot error patterns. The ability to find the relevant log entry is often the difference between a 5-minute fix and a 2-hour investigation.",
      },
    ],
  },
  /* ── Submission 2 ── */
  {
    id: "sample-application",
    phase: 2,
    title: "Sample application build",
    submission: 2,
    description:
      "Build your own sample application using the same structural patterns as the brownfield project, guided by a product one-pager. Discovery and building are intentionally mixed.",
    fullDescription:
      "Apply what you learned from the brownfield analysis to a new build. Use a product one-pager to guide your decisions. You're not just building — you're practicing the cycle of discovering what the code needs to do and building it. Track your data model, use the design system, write tests that follow the evolving problem definition, and produce a README that the application launcher can use to render your app.",
    deliverables: [
      "Working application",
      "README that launches the app",
      "Devlog with architecture and design sections",
    ],
    status: "in-progress",
    tags: ["Building", "Data Modeling"],
    practices: ["Discovery", "Building"],
    references: [
      {
        title: "PII classification levels and cleansing requirements",
        category: "data",
        content:
          "A data governance policy defines classification levels. Don't invent your own — find the canonical source. Each level has specific handling requirements.",
      },
      {
        title: "When to use mock data vs. real data flows",
        category: "building",
        content:
          "Use mock data when you're exploring a UI concept and the shape of the data matters more than its accuracy. Switch to real data flows as soon as you're testing integration points.",
      },
    ],
  },
  /* ── Submission 3 ── */
  {
    id: "discovery-pitch",
    phase: 2,
    title: "Discovery and prototype pitch",
    submission: 3,
    description:
      "Interview colleagues in your work or life. Process findings independently and with peers. Pitch a prototype idea based on what you learned.",
    fullDescription:
      "This submission is about learning to discover real problems through conversation. Interview people, listen for what they actually need (not just what they say they want), and process what you heard — both on your own and with peers. Then pitch a prototype idea that connects your findings to something buildable. The pitch should reflect genuine learning, not assumptions.",
    deliverables: [
      "Interview notes",
      "Prototype pitch",
      "1-pager connecting findings to solution",
    ],
    status: "not-started",
    tags: ["Discovery", "Communication"],
    practices: ["Discovery"],
    references: [
      {
        title: "Killing your darlings — when to abandon a prototype",
        category: "design",
        content:
          "A prototype exists to learn, not to ship. If you've learned what you needed to learn, the prototype did its job — even if you throw it away.",
      },
    ],
  },
  /* ── Submission 4 ── */
  {
    id: "prototype-build",
    phase: 3,
    title: "Prototype and updated product definition",
    submission: 4,
    description:
      "Build the prototype you pitched. Update your product definition to reflect what you learned during the build — it should not be the same document you started with.",
    fullDescription:
      "The completed prototype and an updated product definition that reflects what you learned during the build. The product definition evolves — it is not the same document you started with. Your architecture decisions should be defensible, your data model tracked deliberately, and your README complete enough for the application launcher to render the app.",
    deliverables: [
      "Working prototype",
      "Updated product definition",
      "Devlog",
      "README that launches the app",
    ],
    status: "not-started",
    tags: ["Building", "Design"],
    practices: ["Building", "Discovery"],
  },
  /* ── Submission 5 ── */
  {
    id: "security-review",
    phase: 2,
    title: "Security review and test summary report",
    submission: 5,
    description:
      "Demonstrate that your application doesn't expose credentials or sensitive data. Build LLM-as-Judge experiments and format them into a test summary report others can act on.",
    fullDescription:
      "Review your application for credential exposure and sensitive data leaks. Then design and run LLM-as-Judge experiments — automated evaluations of your AI-generated outputs. Format the results into a test summary report that someone outside the program could read and understand. The report bridges the gap between technical evaluation and practical review.",
    deliverables: [
      "Security review evidence",
      "LLM-as-Judge experiment results",
      "Test summary report",
    ],
    status: "not-started",
    tags: ["Security", "AI"],
    practices: ["Security", "Building"],
  },
  /* ── Submission 6 ── */
  {
    id: "continuous-improvement",
    phase: 3,
    title: "Continuous improvement plan",
    submission: 6,
    description:
      "Access production log data, develop methods for analyzing it, and create a plan for feeding insights back to different colleagues — data science, engineering, product.",
    fullDescription:
      "With access to production log data, develop sample methods for analyzing that data — what patterns to look for, what signals matter, what noise to filter out. Then create a plan for how you feed those insights back to different colleagues in data science, engineering, and product. The plan should be specific enough that someone could follow it.",
    deliverables: [
      "Log analysis methods",
      "Feedback loop design",
      "Continuous improvement plan",
    ],
    status: "not-started",
    tags: ["Observability", "Planning"],
    practices: ["Security"],
  },
  /* ── Submission 7 ── */
  {
    id: "communications-package",
    phase: 3,
    title: "Communications package",
    submission: 7,
    description:
      "Create a dev log, a video under 4 minutes introducing your product, and collect feedback from presenting your idea to peers and leaders.",
    fullDescription:
      "This is your storytelling submission. Create a dev log that documents your journey. Record a video under 4 minutes that introduces your product — what it does, why it matters, and who it's for. Present your work to peers and leaders and collect their feedback. Your storytelling should make the work legible to people outside the program.",
    deliverables: [
      "Dev log",
      "Product video (under 4 minutes)",
      "Collected feedback from presentations",
    ],
    status: "not-started",
    tags: ["Communication", "Presentation"],
    practices: ["Storytelling"],
  },
  /* ── Additional Challenges ── */
  {
    id: "auth-flow",
    phase: 1,
    title: "Map the authentication landscape",
    description:
      "Trace the full authentication flow from login form to session cookie. Diagram the flow and identify where human identity, application identity, and agent identity intersect.",
    deliverables: [
      "Authentication flow diagram",
      "Written explanation of identity types",
    ],
    status: "not-started",
    tags: ["Architecture"],
    practices: ["Discovery", "Security"],
  },
  {
    id: "ai-eval-tool",
    phase: 2,
    title: "Build an AI evaluation harness",
    description:
      "Design and implement a testing framework for AI-generated outputs. Define quality dimensions, create test cases, and build an automated scoring pipeline.",
    deliverables: [
      "Working evaluation harness",
      "Test case library",
      "Devlog",
      "2-min demo video",
    ],
    status: "not-started",
    tags: ["Building", "AI"],
    practices: ["Building", "Security"],
  },
  {
    id: "design-system-custom",
    phase: 2,
    title: "Customize a design system",
    description:
      "Take a base component library and create a themed variant with custom design tokens. Document your color, typography, and spacing decisions in a devlog.",
    deliverables: [
      "Themed component library",
      "Design token configuration",
      "Devlog with design decisions",
    ],
    status: "submitted",
    tags: ["Building", "Design"],
    practices: ["Building"],
  },
];

export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
