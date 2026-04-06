import type { Phase, ChallengeStatus } from "@/design-system/tokens";

export interface Challenge {
  id: string;
  phase: Phase;
  title: string;
  description: string;
  fullDescription?: string;
  deliverables: string[];
  status: ChallengeStatus;
  tags: string[];
  references?: Array<{ title: string; content: string; category: string }>;
}

export const challenges: Challenge[] = [
  {
    id: "deploy-first-app",
    phase: 1,
    title: "Walk the terrain: Your first deployment",
    description:
      "Follow a guided walkthrough to deploy a simple Flask application with hot module reload. You'll learn how your dev environment works — proxy configuration, log access, and what happens when things break.",
    fullDescription:
      "This challenge walks you through deploying a Flask application behind a development proxy with hot module reload enabled. You'll configure Vite to proxy API requests, inspect logs to understand the request lifecycle, and intentionally break things to see how errors surface. By the end, you'll have a mental model of how your development environment works — not just how to use it, but how to debug it when something goes wrong.",
    deliverables: [
      "Running application deployed to dev",
      "Screenshot of successful log inspection",
    ],
    status: "reviewed",
    tags: ["Architecture", "Building"],
    references: [
      {
        title: "How proxies interact with hot module reload",
        category: "architecture",
        content:
          "When your dev server runs behind a corporate proxy, WebSocket connections for HMR need special handling. The proxy must forward the Upgrade header for the WebSocket handshake. If your changes aren't reflecting in the browser, this is the first place to look.",
      },
      {
        title: "Reading and understanding log output",
        category: "building",
        content:
          "Logs are your primary debugging instrument. Learn to read timestamps, identify request/response pairs, and spot error patterns. The ability to find the relevant log entry is often the difference between a 5-minute fix and a 2-hour investigation.",
      },
    ],
  },
  {
    id: "data-privacy-layer",
    phase: 2,
    title: "Design a data privacy layer",
    description:
      "Given a schema with mixed PII classifications, design and implement a cleansing pipeline that handles each classification appropriately. You choose the approach — justify your trade-offs in your devlog.",
    fullDescription:
      "Your organization has a data governance policy with multiple PII classification levels. In this challenge, you'll work with a schema that mixes PUBLIC, INTERNAL, CONFIDENTIAL, and RESTRICTED data. Design a cleansing pipeline that routes each field through the appropriate redaction or encryption handler based on its classification. Document your architectural decisions — why you chose this pipeline structure, what trade-offs you made, and how you'd handle a new classification level being added.",
    deliverables: [
      "Working pipeline artifact",
      "Devlog with architecture and design sections",
      "2-min video walkthrough",
    ],
    status: "in-progress",
    tags: ["Data Modeling"],
    references: [
      {
        title: "PII classification levels and cleansing requirements",
        category: "data",
        content:
          "Your organization's data governance policy defines classification levels. Don't invent your own — find the canonical source. Each level has specific handling requirements.",
      },
      {
        title: "When to use mock data vs. real data flows",
        category: "building",
        content:
          "Use mock data when you're exploring a UI concept and the shape of the data matters more than its accuracy. Switch to real data flows as soon as you're testing integration points.",
      },
    ],
  },
  {
    id: "discovery-problem",
    phase: 3,
    title: "Discovery: Find and shape your own problem",
    description:
      "Identify a real problem in your organization through stakeholder conversations. Create a prototype that drives the conversation about how to prioritize, resource, and solve it.",
    fullDescription:
      "This is where everything comes together. Go into your organization and find a problem worth solving. Talk to stakeholders, understand the constraints, and shape a solution. Build a prototype — not to ship, but to drive a conversation. Record a presentation walking through your discovery process, the problem you found, and why your proposed solution is worth investing in. Present to the community for feedback before taking it to leadership.",
    deliverables: [
      "1-pager product brief",
      "Working prototype",
      "Presentation recording",
      "Devlog",
    ],
    status: "not-started",
    tags: ["Discovery", "Go-to-Market"],
    references: [
      {
        title: "Killing your darlings — when to abandon a prototype",
        category: "design",
        content:
          "A prototype exists to learn, not to ship. If you've learned what you needed to learn, the prototype did its job — even if you throw it away.",
      },
    ],
  },
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
  },
];

export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
