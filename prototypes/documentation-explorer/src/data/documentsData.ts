export type ItemCategory = 'memory' | 'skill' | 'tool' | 'concept';
export type MemoryType = 'user' | 'feedback' | 'project' | 'reference';

export interface DocumentData {
  id: string;
  title: string;
  filename: string;
  content: string;
  category: ItemCategory;
  memoryType?: MemoryType;
  position?: { x: number; y: number };
  floatDuration?: number;
  floatDelay?: number;
}

export const documentsData: DocumentData[] = [
  // === Memories ===
  {
    id: 'memory-user-role',
    title: "Nathan's Role & Goals",
    filename: 'memory/user_role.md',
    category: 'memory',
    memoryType: 'user',
    content: `# Memory: Nathan's Role & Goals
**Type:** User \u00a0|\u00a0 **Source:** \`memory/user_role.md\`

---

Nathan is building a public portfolio (portfolio.cookinupideas.com) to showcase development maturity to prospective employers. He cares about:

- Demonstrating mature use of AI agent tooling (AGENTS.md, CLAUDE.md, skills)
- Structured engineering: monorepo architecture, shared design systems, IaC, CI/CD
- Each prototype having a clear "why it matters" narrative for a hiring reviewer
- Documentation that stays in sync with reality (hates stale docs)
- The ai-evals-in-context project is a companion app consolidated into the monorepo

---

*This memory helps the agent tailor responses to Nathan's specific context — framing suggestions in terms of portfolio impact and hiring reviewer impressions.*`,
    position: { x: 15, y: 20 },
    floatDuration: 65,
    floatDelay: 0
  },
  {
    id: 'memory-feedback-docs',
    title: 'Docs Must Stay In Sync',
    filename: 'memory/feedback_doc_sync.md',
    category: 'memory',
    memoryType: 'feedback',
    content: `# Memory: Documentation Must Stay In Sync
**Type:** Feedback \u00a0|\u00a0 **Source:** \`memory/feedback_doc_sync.md\`

---

When adding a new prototype or making structural changes, update ALL documentation in the same pass — don't leave it for "later." The new-prototype skill has the complete integration checklist.

**Why:** Manual checklists for new prototypes get out of date. The portfolio's README was outdated (only listed FFX, wrong ports) because documentation updates weren't enforced during prototype creation.

**How to apply:** Any time a new prototype is scaffolded or a structural change is made (new port, new route, new terraform resource), update these files in the same commit: root AGENTS.md, CLAUDE.md, README.md, and the prototype's own AGENTS.md.

---

*Feedback memories capture corrections and confirmations so the agent doesn't repeat past mistakes.*`,
    position: { x: 60, y: 15 },
    floatDuration: 75,
    floatDelay: 8
  },
  {
    id: 'memory-project-evals',
    title: 'AI Evals Consolidation',
    filename: 'memory/project_ai_evals_consolidation.md',
    category: 'memory',
    memoryType: 'project',
    content: `# Memory: AI Evals Consolidation
**Type:** Project \u00a0|\u00a0 **Source:** \`memory/project_ai_evals_consolidation.md\`

---

The ai-evals-in-context project (Flask, ECS Fargate) lives in the proto-portal monorepo at \`apps/ai-evals-in-context/\`. The app source is retained, but its **hosted demo was retired on 2026-06-28** to stop AWS costs (ECS Fargate task + RDS Postgres + API Gateway all torn down). The shared ECS cluster, ALB, and VPC stay up because the Research Workspace service runs on them.

On the portfolio it now appears as a "coming soon" concept: a reimagined **eval-trace workspace** that automatically processes evaluation traces — clustering failures and turning eval runs into prioritized product-improvement recommendations.

- Source toolchain: Python (black, flake8, pytest), Docker Compose for local dev
- The old SDLC-walkthrough demo is no longer served at \`/prototypes/ai-evals/\`

**Why:** Nathan is rethinking the prototype's strategy and didn't want to keep paying to host a site that only explains the role of evals.

**How to apply:** When working on the ai-evals source, use \`python3\` not \`python\`. Don't re-enable the old ECS/RDS hosting — the next version is a from-scratch trace-processing workspace.

---

*Project memories track ongoing work context — decisions, constraints, and initiatives that aren't captured in code or git history.*`,
    position: { x: 35, y: 50 },
    floatDuration: 80,
    floatDelay: 12
  },
  // === Skills ===
  {
    id: 'skill-breadboarding',
    title: '/breadboarding',
    filename: '.claude/skills/breadboarding/SKILL.md',
    category: 'skill',
    content: `# Skill: Breadboarding
**Trigger:** \`/breadboarding\` \u00a0|\u00a0 **Source:** \`.claude/skills/breadboarding/SKILL.md\`

---

Technical shaping methodology inspired by Ryan Singer's *Shape Up*. Mirrors hardware design: rough concept \u2192 component selection \u2192 bill of materials \u2192 wiring.

## Core Concepts

| Element | Prefix | Examples |
|---------|--------|----------|
| UI Affordance | U | U1 "Submit" button, U2 email field |
| Code Affordance | N | N1 submitForm(), N2 validateEmail() |
| Place | PLACE: | PLACE: Login page (new) |
| Trigger | TRIGGER: | TRIGGER: Form submission |
| Wire | \u2192 | U1 \u2192 N1 \u2192 N2 |

## Workflow

1. **Gather requirements** \u2014 iterative discussion
2. **Identify shapes** \u2014 discrete features/flows
3. **Analyze fit** \u2014 reuse vs. new
4. **List affordances** \u2014 UI (U) and Code (N) bill of materials
5. **Wire the breadboard** \u2014 connect affordances with data flow arrows
6. **Produce implementation plan** \u2014 file manifest, function signatures, acceptance criteria

The final output is a Claude Code-ready implementation plan with file manifests, data models, function signatures, component specs, wiring as code, and acceptance criteria.

---

*This skill is used before building any non-trivial feature, ensuring the approach is shaped before code is written.*`,
    position: { x: 25, y: 55 },
    floatDuration: 70,
    floatDelay: 5
  },
  {
    id: 'skill-new-prototype',
    title: '/new-prototype',
    filename: '.claude/skills/new-prototype/SKILL.md',
    category: 'skill',
    content: `# Skill: New Prototype
**Trigger:** \`/new-prototype\` \u00a0|\u00a0 **Source:** \`.claude/skills/new-prototype/SKILL.md\`

---

Launch checklist and integration workflow for adding a new prototype to the portfolio monorepo. Ensures every integration point is handled and documentation stays current.

## Launch Phases

1. **Dream** \u2014 Understand the vision: what does it demonstrate? What interactions? What data?
2. **Scaffold** \u2014 Create all required files and update integration points
3. **Integrate Design System** \u2014 Connect shared tokens and Tailwind config
4. **Set Up Testing** \u2014 Jest + Playwright boilerplate
5. **Configure Deployment** \u2014 Vite config, build script, CloudFront function
6. **Write AGENTS.md** \u2014 Prototype-specific agent guidance
7. **Verify** \u2014 Dev server, build, proxy routing, all checklist items

## Integration Checklist (Critical)

Files that MUST be updated when adding a prototype:
- Root \`package.json\` \u2014 workspace + scripts
- \`scripts/build.sh\` \u2014 build + copy step
- \`terraform/main.tf\` \u2014 CloudFront function list
- \`src/components/Portfolio.tsx\` \u2014 landing page card
- \`.github/workflows/deploy.yml\` \u2014 CI test step
- Root \`AGENTS.md\`, \`CLAUDE.md\`, \`README.md\` \u2014 port tables, architecture

---

*This skill enforces the "docs must stay in sync" feedback memory \u2014 missing any integration point means documentation drifts from reality.*`,
    position: { x: 65, y: 40 },
    floatDuration: 85,
    floatDelay: 15
  },
  {
    id: 'skill-add-mcp',
    title: '/add-mcp-server',
    filename: '.claude/skills/add-mcp-server/SKILL.md',
    category: 'skill',
    content: `# Skill: Add MCP Server
**Trigger:** \`/add-mcp-server\` \u00a0|\u00a0 **Source:** \`.claude/skills/add-mcp-server/SKILL.md\`

---

Guides through creating a new MCP (Model Context Protocol) server for the \`proto-mcp\` CLI. Each server is a standalone Yarn workspace package that exports a \`createServer()\` factory.

## Steps

1. **Create server package** at \`shared/mcp-servers/{name}/\` with \`package.json\`, \`tsconfig.json\`, and \`src/server.ts\`
2. **Add to root workspaces** in \`package.json\`
3. **Add CLI dependency** \u2014 \`"@proto-portal/mcp-server-{name}": "workspace:*"\` in \`shared/mcp-cli/package.json\`
4. **Register in CLI** \u2014 add entry to \`shared/mcp-cli/src/registry.ts\`
5. **Register with Claude Code** \u2014 add to \`.mcp.json\` at repo root (optional but recommended)
6. **Build and test** \u2014 \`yarn build:mcp\`, then \`proto-mcp list\` and \`proto-mcp info {name}\`

## Server Template

\`\`\`typescript
// shared/mcp-servers/{name}/src/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

export function createServer(): Server {
  const server = new Server(
    { name: "proto-portal-{name}", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );
  registerTools(server);
  registerResources(server);
  registerPrompts(server);
  return server;
}
\`\`\`

## Registry Entry

\`\`\`typescript
// shared/mcp-cli/src/registry.ts
{
  name: "{name}",
  description: "Short description of what this server provides",
  packageName: "@proto-portal/mcp-server-{name}",
  createServer: async () => {
    const mod = await import("@proto-portal/mcp-server-{name}");
    return mod.createServer;
  },
},
\`\`\`

## Claude Code Registration

\`\`\`json
// .mcp.json
{
  "mcpServers": {
    "{name}": {
      "command": "node",
      "args": ["shared/mcp-cli/dist/cli.js", "start", "{name}"]
    }
  }
}
\`\`\`

## What to Expose

- **Tools** \u2192 computed/parameterized data (queries with arguments, e.g. \`get_tokens(category)\`)
- **Resources** \u2192 static/semi-static data (read by URI, e.g. \`proto-portal://design-tokens/colors\`)
- **Prompts** \u2192 reusable prompt templates with optional arguments (e.g. \`design_system_guide\`)
- All stdout is reserved for MCP protocol \u2014 use \`console.error()\` for diagnostics
- Import from existing workspace packages \u2014 never duplicate data

## After Adding a Server

Also update \`prototypes/documentation-explorer/src/data/documentsData.ts\` \u2014 add a \`tool\` category entry describing the new server's tools, resources, and prompts so the Agent Memory & Skills Explorer stays current.

---

*This skill extends the monorepo's AI tooling layer, making project-specific context available to Claude through the MCP protocol.*`,
    position: { x: 45, y: 30 },
    floatDuration: 90,
    floatDelay: 20
  },
  // === Tools (MCP) ===
  {
    id: 'tool-mcp-cli',
    title: 'proto-mcp CLI',
    filename: 'shared/mcp-cli/README.md',
    category: 'tool',
    content: `# proto-mcp \u2014 Local MCP Server CLI
**Source:** \`shared/mcp-cli/\` \u00a0|\u00a0 **Registry:** \`src/registry.ts\`

---

A CLI for discovering and running MCP (Model Context Protocol) servers packaged within the monorepo. MCP servers give AI agents live, queryable access to project-specific data \u2014 not through static files, but through typed tools, structured resources, and reusable prompts.

## Philosophy

### Local-first, no remote infrastructure
MCP servers run on your machine, connected via stdio. You can iterate on tools, resources, and prompts against real project data \u2014 no deployment step, no remote endpoint, no API keys. When you change a token value in \`shared/design-tokens/\`, rebuild, and the MCP server serves the updated value immediately. The feedback loop is as fast as local web development.

### Versioned and shareable
The CLI is a Yarn workspace package with semantic versioning. When the team bumps to \`v1.1.0\`, everyone gets the same MCP servers with the same behavior. No "works on my machine" \u2014 the servers are pinned to the monorepo state, built from the same source, and tested in CI. This matters because MCP servers shape how AI tools understand your codebase \u2014 version-locking prevents drift.

### Shared context across the team
One CLI gives every developer access to the same MCP servers. The design-tokens server means any team member working on any prototype gets consistent design guidance \u2014 the same tokens, the same Tailwind classes, the same responsive patterns. As you add more servers, the CLI becomes a single source of truth that AI tools can query.

### Extensible by design
Adding a new MCP server is four mechanical steps \u2014 no framework magic, no plugin system. Create a package, register it, build. The static registry pattern means you can see every available server by reading one file (\`src/registry.ts\`), and each server is a standalone package you can test independently.

## Architecture

\`\`\`
shared/mcp-cli/             CLI dispatcher
  src/cli.ts                 Entrypoint
  src/registry.ts            Static server registry (lazy imports)
  src/commands/              list, start, info handlers

shared/mcp-servers/
  design-tokens/             First MCP server
\`\`\`

Each server exports a \`createServer()\` factory. The CLI imports it lazily, instantiates the server, and connects it to a \`StdioServerTransport\`. All CLI output goes to stderr \u2014 stdout is reserved for the MCP protocol.

## Usage

\`\`\`bash
proto-mcp list              # List available servers
proto-mcp info design-tokens # Show tools, resources, prompts
proto-mcp start design-tokens # Start server (stdio)
\`\`\`

---

*The CLI is registered in \`.mcp.json\` at the repo root. Claude Code starts servers automatically when it needs project-specific context.*`,
    position: { x: 80, y: 55 },
    floatDuration: 74,
    floatDelay: 7
  },
  {
    id: 'tool-design-tokens-server',
    title: 'Design Tokens Server',
    filename: 'shared/mcp-servers/design-tokens/',
    category: 'tool',
    content: `# MCP Server: Design Tokens
**Package:** \`@proto-portal/mcp-server-design-tokens\` \u00a0|\u00a0 **Source:** \`shared/mcp-servers/design-tokens/\`

---

The first MCP server in the portfolio \u2014 it gives Claude live, queryable access to the shared design system. Instead of reading CSS files or guessing at token names, the agent calls typed tools that return structured data.

## Tools (computed, parameterized queries)

| Tool | What it returns |
|------|----------------|
| \`get_tokens\` | Design token values \u2014 colors (HSL), typography, spacing, gradients, shadows, transitions, responsive breakpoints, chart colors, skill categories |
| \`get_theme\` | Complete themed token set with preset overrides applied (default, ffxSkillMap, highContrast, vibrant) |
| \`get_css_variables\` | CSS custom properties as a \`:root\` block \u2014 ready to paste into a stylesheet |
| \`get_tailwind_classes\` | Available Tailwind utility classes from the shared base config |

## Resources (static/semi-static data)

9 token category resources served at \`proto-portal://design-tokens/*\`:
- \`colors\` \u2014 semantic HSL color system (light + dark)
- \`typography\` \u2014 font families, sizes, weights
- \`spacing\` \u2014 scale from xs (4px) to 4xl (96px) + semantic tokens
- \`gradients\` \u2014 5 named CSS gradients
- \`shadows\` \u2014 6 box-shadow levels
- \`transitions\` \u2014 5 timing curves
- \`responsive\` \u2014 breakpoints and mobile-first patterns
- \`chart-colors\` \u2014 data visualization palettes
- \`skill-categories\` \u2014 FFX game + tech org category colors

## Prompts (reusable prompt templates)

| Prompt | Purpose |
|--------|---------|
| \`design_system_guide\` | Comprehensive guide covering all token categories, usage patterns, presets, Tailwind integration, CSS variables, and mobile-first rules |
| \`create_component_styles\` | Generate a styled React component using design tokens \u2014 takes component name, variant, and preset as arguments |

## Why This Matters

The design-tokens server demonstrates the MCP philosophy in practice: instead of hoping the AI reads the right CSS file, you give it structured access to the canonical data. The tokens are always current (rebuilt from source), consistent across prototypes, and queryable by category.

---

*This is the model for future MCP servers in the portfolio \u2014 API docs, component libraries, deployment configs \u2014 each one a standalone package that extends what Claude can see and do.*`,
    position: { x: 15, y: 70 },
    floatDuration: 82,
    floatDelay: 14
  },
  // === Concepts ===
  {
    id: 'concept-memory-types',
    title: 'Memory Types',
    filename: 'System: Auto Memory',
    category: 'concept',
    content: `# How Agent Memory Works

Claude Code maintains a persistent, file-based memory system that builds up over time so future conversations have a complete picture of the user, their preferences, and project context.

## Memory Types

### User Memories
Information about the user's role, goals, responsibilities, and knowledge. Helps tailor behavior to the user's perspective.

> *Example: "Nathan is a senior engineer building a portfolio \u2014 frame suggestions in terms of hiring impact."*

### Feedback Memories
Guidance about how to approach work \u2014 corrections AND confirmations. The most important type for maintaining coherent behavior across sessions.

> *Example: "Don't mock the database in integration tests \u2014 we got burned when mocks diverged from production."*

### Project Memories
Ongoing work context \u2014 goals, initiatives, deadlines, decisions. These decay fast, so they include a "Why" to help judge relevance.

> *Example: "Merge freeze begins March 5 for mobile release cut."*

### Reference Memories
Pointers to external systems \u2014 where to find information outside the codebase.

> *Example: "Pipeline bugs tracked in Linear project INGEST."*

## Storage

Each memory is a markdown file with YAML frontmatter (\`name\`, \`description\`, \`type\`), indexed in \`MEMORY.md\`. The index is always loaded into context; individual files are read on demand.

## What NOT to Save

Code patterns, git history, debugging recipes, or anything derivable from reading the current project state. Memory is for the *non-obvious* \u2014 context that can't be rediscovered by reading code.`,
    position: { x: 50, y: 65 },
    floatDuration: 72,
    floatDelay: 3
  },
  {
    id: 'concept-skills',
    title: 'Skills System',
    filename: 'System: Skills',
    category: 'concept',
    content: `# How Agent Skills Work

Skills are reusable prompt packages that give Claude Code specialized capabilities. They live in \`.claude/skills/\` and are invoked with slash commands.

## Anatomy of a Skill

Each skill is a directory containing a \`SKILL.md\` file with YAML frontmatter:

\`\`\`yaml
---
name: skill-name
description: "When to use this skill. Trigger phrases..."
---
\`\`\`

The body contains the full prompt \u2014 instructions, examples, templates, and references.

## How They're Used

1. User types \`/skill-name\` in Claude Code
2. The skill's \`SKILL.md\` is loaded into context
3. Claude follows the skill's instructions to complete the task
4. Some skills reference sub-files (e.g., breadboarding has \`references/examples.md\`)

## Skills in This Project

| Skill | Purpose |
|-------|---------|
| \`/breadboarding\` | Shape features before building \u2014 places, affordances, wiring |
| \`/new-prototype\` | Launch checklist for adding a prototype to the monorepo |
| \`/add-mcp-server\` | Guide for creating new MCP servers |

## Why Skills Matter

Skills encode institutional knowledge into reusable workflows. Instead of explaining "how we add a new prototype" every session, the knowledge lives in a skill that any agent can follow consistently.`,
    position: { x: 10, y: 40 },
    floatDuration: 78,
    floatDelay: 10
  },
  {
    id: 'concept-agents-md',
    title: 'AGENTS.md & CLAUDE.md',
    filename: 'System: Agent Configuration',
    category: 'concept',
    content: `# AGENTS.md & CLAUDE.md

These are the two primary configuration files that shape how AI agents interact with this codebase.

## CLAUDE.md \u2014 Project Instructions

Loaded automatically when Claude Code opens a project. Contains:

- **Development notes** \u2014 ports, commands, which package manager to use
- **Design guidelines** \u2014 responsive patterns, shared tokens usage
- **Git commit conventions** \u2014 message format, architecture documentation
- **Testing commands** \u2014 per-prototype test runners
- **Build & deploy** \u2014 scripts and CI/CD pipeline

Think of it as the "README for the AI" \u2014 everything an agent needs to be productive immediately.

## AGENTS.md \u2014 Architecture & Context

A deeper document covering:

- **System architecture** \u2014 how prototypes, shared packages, and infrastructure connect
- **Port reference** \u2014 which service runs where
- **Directory structure** \u2014 what lives where in the monorepo
- **Design decisions** \u2014 why things are the way they are

## How They Work Together

| Layer | Audience | Scope | Updates |
|-------|----------|-------|---------|
| CLAUDE.md | Claude Code | Operational instructions | Every structural change |
| AGENTS.md | Any AI agent | Architecture & context | When architecture changes |
| Skills | Claude Code | Specialized workflows | When workflows evolve |
| MCP Tools | Claude Code | Live, queryable project data | When data sources change |
| Memory | Claude Code | Cross-session context | Automatically over time |

Together they form a layered agent configuration: CLAUDE.md for "how to work here," AGENTS.md for "how this is built," skills for "how to do specific tasks," MCP tools for "live access to project data," and memory for "what we've learned."`,
    position: { x: 75, y: 25 },
    floatDuration: 68,
    floatDelay: 18
  },
  {
    id: 'concept-island-algorithms',
    title: 'Island Algorithms',
    filename: 'Prototype: island-algorithms-visualizer',
    category: 'concept',
    content: `# Island Algorithms Visualizer

A Tron-inspired WebGL prototype for the connected-components algorithm family — the "Number of Islands" problem and its cousins. Built to be **both** an algorithm visualizer and a scrubbable LeetCode cheat sheet.

## What it covers

- **DFS** — stack-based traversal, backtracking, depth-first discovery order
- **BFS** — queue-based wave expansion, shortest-path distances on unweighted grids
- **Dijkstra's** — min-heap relaxation on weighted terrain, path reconstruction
- **DP via Union-Find** — dynamic connectivity, max area of an island
- **DP via 2D table** — largest-square-of-1s (LeetCode 221)

## What you can do

- **Play / pause / scrub** through every algorithm step
- **Toggle cells** in 2D to author your own islands
- **Switch between 2D** (tilted grid, post-bloom Tron aesthetic) **and true 3D** (6-connected volumetric grid with orbit controls)
- **Read a live codex** alongside the visualizer: current data structure state, Big-O, "when to use," pseudocode with the current line highlighted, and interview gotchas
- **On mobile**, the visualizer is hidden and the same codex content becomes a 4-tab cheat sheet with Python templates

## Design

Each prototype in this monorepo owns its visual tokens. This one lives entirely inside \`prototypes/island-algorithms-visualizer/src/design-system/theme.css\` — neon cyan + magenta on deep navy, no dependency on the shared design system package.`,
    position: { x: 35, y: 40 },
    floatDuration: 76,
    floatDelay: 9
  }
];

// Map of keywords to relevant file paths in the codebase
export const codebaseLinks: Record<string, string> = {
  'memory': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/.claude',
  'skill': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/.claude/skills',
  'breadboard': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/.claude/skills/breadboarding/SKILL.md',
  'prototype': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/.claude/skills/new-prototype/SKILL.md',
  'mcp': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/.claude/skills/add-mcp-server/SKILL.md',
  'agents': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/AGENTS.md',
  'claude': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/CLAUDE.md',
  'config': 'https://github.com/nsuberi/proto-portal-showcase-hub/blob/main/.claude/settings.local.json',
  'design': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/shared/design-tokens',
  'tokens': 'https://github.com/nsuberi/proto-portal-showcase-hub/tree/main/shared/design-tokens',
  'default': 'https://github.com/nsuberi/proto-portal-showcase-hub'
};
