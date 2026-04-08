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
      {
        title: "The gap between what people say and what they need",
        category: "design",
        content:
          "In interviews, people describe solutions they've already imagined — not the underlying problem. Your job is to listen past the feature request to the friction that prompted it. Ask 'why' more than 'what'.",
      },
      {
        title: "Structuring a pitch around a problem, not a solution",
        category: "building",
        content:
          "A strong pitch starts with a problem someone recognizes. If your audience doesn't feel the problem, no amount of solution detail will land. Lead with the pain, then bridge to what you'd build.",
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
    references: [
      {
        title: "The README is part of the product",
        category: "building",
        content:
          "If the application launcher can't render your app from your README alone, the app isn't shippable. A README that requires tribal knowledge to follow is a deployment risk.",
      },
      {
        title: "Architecture decisions are bets — document why you made them",
        category: "architecture",
        content:
          "Future you needs to know what you were thinking. Record the alternatives you considered and why you chose one over another. The decision matters more than the diagram.",
      },
      {
        title: "When your product definition changes mid-build",
        category: "design",
        content:
          "Your product definition should evolve as you build. If it's the same document at the end as it was at the start, you didn't learn anything. Updating it isn't failure — it's the point.",
      },
    ],
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
    references: [
      {
        title: "Credentials in environment variables are not hidden",
        category: "architecture",
        content:
          "Env vars show up in logs, process listings, crash dumps, and container inspection output. Treat them as 'not in source code' — not as 'secret'. Know where your secrets actually live at rest and in transit.",
      },
      {
        title: "LLM-as-Judge is only as good as your rubric",
        category: "building",
        content:
          "The quality of automated evaluation depends entirely on how precisely you define what 'good' means. A vague rubric produces vague scores. Invest the time in criteria before you invest the time in infrastructure.",
      },
      {
        title: "Writing for someone who wasn't in the room",
        category: "design",
        content:
          "A test summary report needs to be legible to people who didn't run the tests. State the goal, the method, and the conclusion up front — then let the supporting data follow for those who want to dig in.",
      },
    ],
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
    references: [
      {
        title: "Not all log data is signal",
        category: "data",
        content:
          "The first step in log analysis is figuring out what to ignore. Most log volume is healthy heartbeat noise. Develop filters for the normal so the abnormal stands out.",
      },
      {
        title: "Feedback loops need a recipient, not just a dashboard",
        category: "architecture",
        content:
          "A dashboard nobody checks is worse than no dashboard — it creates the illusion of observability. Design your feedback loops around who will act on the information, not just where it's displayed.",
      },
      {
        title: "Tailoring insights to your audience",
        category: "design",
        content:
          "What a data scientist needs from log analysis is different from what a product manager needs. The same underlying data should produce different artifacts for different audiences — same truth, different lenses.",
      },
    ],
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
    references: [
      {
        title: "The 30-second version of your story",
        category: "design",
        content:
          "If you can't explain what you built and why it matters in 30 seconds, the 4-minute video won't land either. Start by nailing the elevator pitch — the rest is elaboration.",
      },
      {
        title: "Dev logs are for your future self, not your current audience",
        category: "building",
        content:
          "Write what you wish you had known when you started. Capture the dead ends and the reasoning behind pivots — not just the wins. The most useful dev log entry is the one that saves someone two hours.",
      },
      {
        title: "Feedback is data — collect it like data",
        category: "data",
        content:
          "Structured feedback tells you something; 'looks good' tells you nothing. Prepare specific questions before your presentation. What you ask shapes what you learn.",
      },
    ],
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
    references: [
      {
        title: "Identity is not authentication",
        category: "architecture",
        content:
          "Authentication proves who you are. Authorization determines what you can do. Identity ties them together. Conflating these three concepts leads to access control bugs that are hard to find and harder to fix.",
      },
      {
        title: "Session tokens are bearer credentials",
        category: "architecture",
        content:
          "Anyone who holds a session token IS the user, from the server's perspective. This is why token storage, expiry, and rotation matter — a leaked token is a compromised account until it expires.",
      },
    ],
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
    references: [
      {
        title: "Eval metrics must match user value",
        category: "data",
        content:
          "A model can score 95% on your benchmark and still be useless if the benchmark doesn't reflect what users actually care about. Start with what 'good' looks like to a human, then work backward to a metric.",
      },
      {
        title: "Deterministic tests for non-deterministic systems",
        category: "building",
        content:
          "LLM outputs vary between runs. Your test framework needs to handle this gracefully — test for properties and ranges, not exact strings. A flaky eval suite teaches you nothing.",
      },
    ],
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
    references: [
      {
        title: "Tokens are decisions, not values",
        category: "design",
        content:
          "A token named 'primary' carries semantic meaning; a hex code does not. The value can change — the decision persists. When you define a token, you're encoding a design intention that outlives any single color choice.",
      },
      {
        title: "Constraint enables creativity",
        category: "design",
        content:
          "A design system with 4 spacing values is more useful than one with 40. Constraints force you to make deliberate choices instead of nudging pixels until something 'looks right'. The system does the remembering so you can do the designing.",
      },
    ],
  },
];

export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
