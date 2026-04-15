# Research Workspace — Product Requirements Document

## Vision

A **knowledge garden** where users grow their understanding through conversation with an AI research companion. Built on the **Banyan Tree** metaphor: roots represent who you are, branches are what you're exploring, leaves are the research artifacts produced, and flowers are the personal insights that bloom when your background connects to what you're learning.

The UI follows a **Claude.ai-inspired layout** (centered chat, icon sidebar, contextual artifact panel) with a **Chikorita-inspired color palette** (sage greens, leaf accents, earth-brown borders, ruby flowers). The system acts as a "Gardener" — a research companion that helps users articulate intentions, produces research, and recognizes when learning has been internalized.

## Users

- Researchers exploring ML/AI papers and generating structured reviews
- Lifelong learners building personal knowledge graphs that connect domains
- Portfolio visitors evaluating the builder's dev maturity and AI integration skills

## Architecture

```
CloudFront
├── /prototypes/research-workspace/vault/api/vault/published*  →  ALB → ECS (no auth, public)
├── /prototypes/research-workspace/vault*  →  ALB → Cognito → ECS (Express.js)
│   ├── REST: file CRUD, tree, conversations, runs, activity, config, auth
│   ├── WS: chat (stream-json Claude), run PTY streams
│   └── /healthz
├── /prototypes/research-workspace/*       →  S3 (React SPA)
│   ├── /                    Gallery (public)
│   ├── /content/:id         Content detail (public)
│   ├── /workspace           Authenticated workspace
│   └── /security            Security architecture page
└── /api/v1/research-workspace/*           →  API Gateway → Lambda (DynamoDB)
```

**Stack:** React 18 + Vite + D3.js (SPA) | Express.js + node-pty + ws (backend) | ECS Fargate + EFS + Cognito (infra)

## Banyan Tree Data Model

The core data model stored as `.tree.json` in each user's vault:

```typescript
interface BanyanTree {
  version: 1;
  roots: Root[];       // Who you are — background, skills, internalized knowledge
  branches: Branch[];  // What you're exploring — active learning intentions
  leaves: Leaf[];      // Research artifacts — reviews, code, diagrams
  flowers: Flower[];   // Personal insights — connections only you could make
  connections: Connection[];  // Graph edges between nodes
  lastModified: string;
}
```

| Node Type | Represents | Color | Graph Position |
|-----------|-----------|-------|----------------|
| **Root** | Identity, background, internalized knowledge | Brown (#6b5b4a) | Below ground line |
| **Branch** | Active learning intentions (growing/flowering/internalizing/rooted) | Amber (#8b7355) | Above ground line |
| **Leaf** | Research artifacts (markdown, code, diagrams, references) | Green (#7bb661) | On branches |
| **Flower** | Personal insights — connections between roots and branches | Ruby (#8b2252) | Top of tree, with glow |

**Lifecycle:** Roots feed Branches → Branches grow Leaves → Leaves spark Flowers → Branches internalize into new Roots → cycle deepens.

**Migration:** Users with existing `.intentions.json` files are auto-migrated to `.tree.json` on first load (server-side in `ensureUserVault()` + client-side fallback in `useTree` hook). Each legacy intention becomes a branch; documents become leaves.

## Features

### 1. Chikorita Color Palette (Shipped)

Light nature theme replacing the original dark glassmorphism:

- **Surfaces:** Sage greens (#f4f7ec base, layered paper hierarchy)
- **Primary:** Leaf green (#4a8a38) — buttons, active states, links
- **Secondary:** Ruby-red (#8b2252) — flowers, insights
- **Tertiary:** Warm amber-brown (#8b7355) — branches, structure
- **Text:** Forest dark (#1e2d1a) on light backgrounds
- **Borders:** Earth tones (#6b5b4a outline, #c4b8a4 variant)
- **Tree semantic tokens:** `--color-root`, `--color-branch`, `--color-leaf`, `--color-flower`

All 247 `text-white/` and `bg-white/` references migrated to semantic tokens. Milkdown editor, syntax highlighting (`syntax-forest.css`), tool call cards, and all modals updated for light backgrounds.

### 2. Claude.ai Layout — NavRail + Chat + Context Panel (Shipped)

```
+--56px--+------ centered, max-w-720px ------+-- 0 or 420px --+
|        |                                    |                 |
| [Chat] |  Chat messages (scrollable)        | Context panel   |
| [Hist] |                                    | (slides in      |
| [Vault]|                                    |  when relevant) |
| [Tree] |  ┌──────────────────────────────┐  |                 |
| [Cfg]  |  │ What would you like to       │  | • Branch list   |
|        |  │ explore?                      │  | • Activity feed |
|        |  └──────────────────────────────┘  | • File preview  |
+--------+------------------------------------+-----------------+
```

**NavRail (56px, non-expanding):** 5 views — Chat, History, Vault, Knowledge Map, Settings. Active indicator bar, optional badge/pulse.

**ContextPanel (420px, slides in from right):** Phase-aware — automatically shows relevant content based on conversation state. Close button to dismiss. On mobile, becomes a bottom sheet.

**Desktop:** NavRail + centered view + optional context panel.
**Mobile:** Edge-to-edge views + iOS-inspired frosted glass tab bar (5 tabs) + bottom sheet for context. Safe area handling (`viewport-fit=cover`, `env(safe-area-inset-bottom)`).

### 3. Chat-First Interaction (Shipped)

The chat is the primary interface. Welcome screen shows "What would you like to explore?" with 4 suggestion chips:
- Connect my experience to a new field
- Explore a research topic in depth
- Synthesize what I've learned
- What should I explore next?

**Recent conversations** shown below suggestions on the welcome screen (last 3, with timestamps).

Messages display with role avatars (user = brown circle, assistant = green circle with leaf icon, labeled "Gardener"). Tool use badges rendered inline as leaf-green pills. Markdown rendered via `react-markdown`.

**Mobile-optimized:** Single-column suggestion chips with larger touch targets (44px+), compact avatars, connection status hidden when connected, safe area padding on input.

### 4. Conversation Phase Detection (Shipped)

`useConversationPhase` hook analyzes messages and streaming state to detect 7 phases:

| Phase | User Signal | Context Panel Shows |
|-------|-------------|---------------------|
| **idle** | No messages | Nothing |
| **intending** | "I want to learn about..." | Branch list panel |
| **exploring** | General Q&A | Nothing (full-width chat) |
| **researching** | Tool calls streaming | Activity panel (live tool feed) |
| **reviewing** | Agent produced a file | File preview panel |
| **connecting** | "How does X connect to Y?" | Branch list panel |
| **reflecting** | "Show me my tree" | Branch list panel |

Pattern matching uses regex arrays for each phase. Context panel auto-shows on desktop, accessible via FAB on mobile.

### 5. Conversation History (Shipped)

Full conversation persistence and browsing:

**Server-side:**
- Chat WebSocket handler auto-saves every conversation to `.conversations/{id}.json`
- Each conversation stores: messages (user + assistant with timestamps), tool uses, tree node snapshot (branch/leaf/flower/root IDs), session ID
- Saves on every turn completion and on WebSocket disconnect
- `GET /api/vault/conversations` — list summaries (sorted by most recent)
- `GET /api/vault/conversations/:id` — full detail with enriched tree data (resolves IDs to labels/titles from current `.tree.json`)

**Frontend:**
- **ConversationHistory** component with list view and detail view
- List cards show: title, time ago, message count, tool use count, tree association badges (colored by type)
- Detail view shows: tree associations panel, expandable tool audit trail, full message replay with markdown
- Accessible from NavRail ("History" tab) and chat welcome screen ("Recent conversations")

### 6. Knowledge Graph Visualization (Shipped)

D3 force-directed graph in the Knowledge Map view:

- **Ground line:** Dashed brown line separating "who you are" (roots below) from "what you're exploring" (branches above)
- **Gravity:** Roots pull downward, branches pull upward, leaves higher, flowers highest
- **Node styling:** Color-coded circles with light fill + colored stroke. Flowers get an outer glow ring.
- **Interaction:** Drag nodes, zoom/pan, hover tooltips with node type + full label
- **Legend:** Node type legend at bottom-left with colored indicators
- **Stats bar:** Node counts by type at top-left
- **Demo data:** "Load demo knowledge tree" button on empty state creates a realistic sample tree (3 roots, 3 branches, 5 leaves, 2 flowers, connections)
- **Responsive:** ResizeObserver tracks container dimensions

### 7. Agentic Skill Architecture (Shipped — Design + Files)

8 skill definitions in `vault-seed/.claude/skills/`, installed to each user's vault on init:

| Skill | Purpose |
|-------|---------|
| **gardener** | Orchestrator — reads tree, detects phase, delegates to sub-skills |
| **branch-grower** | Creates/refines branches from learning intentions, connects to roots |
| **researcher** | Spawns 3 parallel sub-agents (foundations, connections, practical) |
| **synthesizer** | Cross-leaf pattern analysis, triggered at 5+ leaves on a branch |
| **flower-bloomer** | Captures personal insights with full lineage (root→branch→leaf→flower) |
| **root-deepener** | Onboarding (infers roots) + branch→root internalization |
| **gallery-publisher** | Crafts shareable gallery items from flowers with journey context |
| **tree-viewer** | Reflective summaries, growth patterns, gap analysis |
| **research** | Original research skill — analyzes papers, writes structured reviews |

3 hook scripts as **Stop hooks** (run at end of each Claude Code session):

| Hook | Purpose |
|------|---------|
| **leaf-tracker.js** | Scans vault for new files, registers as leaf nodes, flags synthesis at 5+ leaves |
| **synthesis-trigger.js** | Consumes synthesis-needed flags, queues synthesis runs |
| **root-updater.js** | Analyzes session transcript for mastery signals, logs to `.root-signals.jsonl` |

**Hook registration:** Skills and hooks auto-installed from `vault-seed/` on first vault init. Stop hooks run via `node` interpreter. The existing `log-activity.js` PreToolUse hook handles tool auditing and policy enforcement separately.

Skills and hooks are viewable in the Session Config panel — clicking opens the context panel (desktop) or bottom sheet (mobile) with the full file content.

### 8. Session Config Panel (Shipped)

Displays Claude Code configuration at `GET /api/vault/config`:
- **Skills:** Auto-discovered from `.claude/skills/*/SKILL.md`. Click to view content in artifact panel.
- **Hooks:** Read from `.claude/settings.json` (PreToolUse + Stop hooks). Click to view script content in artifact panel.
- **Tools:** Lists all Claude tools with allow/block badges from `.claude/tool-policy.json`
- **Tool Policy Editor:** Modal for configuring blocked tools and parameter-level rules with presets

### 9. Agent Activity (Shipped)

**Activity Panel (context panel):**
- Live tool call feed during streaming, with current + recent tool uses
- Each tool call is clickable — expands to show tool name, file path/pattern, full description
- Active streaming indicator with call count
- Previous turn grouping with message-level counts

**Activity Strip (existing):**
- Structured tool call visualization with ToolCallCard components
- 4-layer attention: ambient dot → progress stream → attention (blocked/error) → summary report
- Risk classification: safe (read-only) / modifiable / caution / destructive
- Run tab management with RunTabBar, RunSummaryView (elapsed time, tool breakdown bar, file stats)

### 10. Intentions System (Shipped — Legacy, Migrated to Tree)

Three intention types (research/synthesis/review) with recurring schedules. Stored as `.intentions.json`. Auto-migrated to Banyan Tree branches on first load. The form-based IntentionsPanel is retained for backward compatibility but the primary interface is now the chat.

### 11. Concurrent Interactive Runs (Shipped)

- `POST /api/vault/runs` spawns interactive Claude Code PTY sessions
- Research prompt auto-injected after startup detection
- Multiple runs execute simultaneously as separate PTY sessions
- Tool activity logged via hooks, polled via REST
- Run status: running → completed/failed/cancelled

### 12. Publishing System (Shipped)

Publish vault files to the public gallery:
- `POST /api/vault/publish` — publishes markdown as gallery item
- Auto-extracts title + summary, generates stable ID
- Tag system with content-derived suggestions
- `GET /api/vault/published` — public listing (no auth)

### 13. Token Security (Shipped)

- OAuth tokens on encrypted EFS (AES-256 at rest)
- `.claude/` → 0700, credentials → 0600
- One-click revoke via `DELETE /api/vault/auth`
- Per-user vault isolation via Cognito JWT + path validation

### 14. Mobile Experience (Shipped)

Claude-app-inspired mobile layout:
- **Top bar:** Minimal — back arrow, centered "Gardener" brand with leaf icon, streaming pulse dot
- **Edge-to-edge views:** Chat full-bleed, other views with light padding
- **Tab bar:** iOS frosted glass, safe area bottom padding, active tab with thicker stroke + semibold label
- **Notification dot:** On chat tab when context is available or agent is streaming
- **Context FAB:** Floating green button above tab bar, opens bottom sheet
- **Bottom sheet:** Spring animation, max 75vh, drag handle, frosted glass, body scroll lock
- **File browser:** Full-width list, tap opens editor as slide-in overlay with back button
- **Config/History:** Full-height scroll, no card wrapper

### 15. Scheduler (Shipped)

Automated recurring intention execution every 60s. Iterates all vaults, checks schedules, spawns PTY sessions. Logs to `.scheduler-log.jsonl`.

### 16. Vault Download/Export (Shipped)

`GET /api/vault/download` — streams vault contents as ZIP, excludes dotfiles.

## Data Model

**Banyan Tree** — `.tree.json` (primary knowledge model)
```typescript
{ version: 1, roots: Root[], branches: Branch[], leaves: Leaf[], flowers: Flower[], connections: Connection[], lastModified }
```

**Conversations** — `.conversations/{id}.json` (persisted chat history)
```typescript
{ id, title, sessionId?, createdAt, lastMessageAt, messages: [{role, content, toolUses?, timestamp}], toolUses: [{tool, input, timestamp}], treeNodes: {branchIds, leafIds, flowerIds, rootIds} }
```

**Intentions (legacy)** — `.intentions.json` (auto-migrated to tree on first load)
```typescript
{ id, type, title, description, schedule?, status, documents?, createdAt }
```

**Tool Activity** — `.tool-activity.jsonl` (JSONL, one event per line)
```typescript
{ timestamp, tool, input, decision, runId? }
```

**Root Signals** — `.root-signals.jsonl` (mastery tracking for internalization)
```typescript
{ timestamp, signals: string[], messageCount, excerpt }
```

## Security Architecture (Implemented)

### IAM Role — ECS Task

The task role has a single scoped policy: `elasticfilesystem:ClientMount` and `ClientWrite` scoped to this EFS + access point only. All other AWS API calls denied.

### Per-User File Isolation

```
EFS (AES-256 at rest, transit encryption)
└── Access Point: /users/nathan (UID 1000, GID 1000)
    └── /workspace
        └── /vaults/{cognito-sub}/
            ├── .tree.json              ← Banyan Tree state
            ├── .conversations/         ← Chat history
            ├── .intentions.json        ← Legacy (auto-migrated)
            ├── .tool-activity.jsonl    ← Tool audit log
            ├── .root-signals.jsonl     ← Mastery signal log
            ├── .claude/
            │   ├── skills/             ← 9 skill definitions
            │   ├── hooks/              ← 4 hook scripts
            │   ├── settings.json       ← Hook registration
            │   └── tool-policy.json    ← Tool allow/block rules
            ├── reviews/                ← Research leaves
            ├── syntheses/              ← Synthesis leaves
            ├── assets/                 ← Code leaves
            ├── leaves/                 ← Organized by branch
            └── flowers/                ← Captured insights
```

**Identity flow:** ALB Cognito JWT → server middleware → `sanitizePath()` against vault root → Claude Code spawned with per-user HOME.

### Hardening Summary

| Layer | Measure | Status |
|-------|---------|--------|
| Network | ALB Cognito auth on all `/vault*` requests | Shipped |
| Identity | Cognito JWT parsed per request, per-user vault dirs | Shipped |
| File system | Path traversal protection via `sanitizePath()` | Shipped |
| EFS IAM | IAM auth enabled, scoped to task role + access point | Shipped |
| Encryption | EFS AES-256 at rest + transit | Shipped |
| Credentials | `.claude/` 0700, credential files 0600 | Shipped |
| Env isolation | API key + AWS creds stripped from Claude processes | Shipped |
| Tool policy | Configurable allow/block per tool + parameter rules | Shipped |
| Audit trail | PreToolUse hook logs every tool invocation | Shipped |
| Token revocation | One-click revoke via API + UI | Shipped |
| Session audit | Stop hooks analyze session for tree updates | Shipped |

### Current Limitation: Single Shared ECS Task

All users share one Fargate task. User isolation is application-layer. Suitable for internal teams and portfolio demonstrations, not multi-tenant production.

## Future Work

- [ ] Conversation phase detection → automatic context panel triggers (connecting → molecule graph, reflecting → full graph)
- [ ] Branch-to-root internalization UX (visual animation of branch curving through ground line)
- [ ] Knowledge molecules — small 3-7 node clusters instead of full graph
- [ ] Flower gallery with journey lineage (root → branch → leaf → flower)
- [ ] Live skill execution from skills (gardener delegates to sub-skills in real-time)
- [ ] Root-deepener onboarding flow (guided questions → root inference)
- [ ] Jupyter notebook viewer (.ipynb cell rendering)
- [ ] CodeMirror/Monaco for proper syntax highlighting
- [ ] Wiki-link `[[]]` remark plugin with autocomplete
- [ ] Command palette (Ctrl+P)
- [ ] Per-user EFS access points (filesystem-level isolation)
- [ ] Per-user Fargate tasks (container-level isolation)
- [x] ~~Chikorita color palette~~ — shipped
- [x] ~~Claude.ai layout (NavRail + centered chat + context panel)~~ — shipped
- [x] ~~Banyan Tree data model + useTree hook~~ — shipped
- [x] ~~Chat welcome screen redesign~~ — shipped
- [x] ~~Conversation phase detection~~ — shipped
- [x] ~~D3 force-directed knowledge graph~~ — shipped
- [x] ~~Agentic skill architecture (8 skills + 3 hooks)~~ — shipped
- [x] ~~Mobile redesign (Claude-inspired)~~ — shipped
- [x] ~~Conversation history with tree associations + tool audit~~ — shipped
- [x] ~~Tree migration from .intentions.json~~ — shipped
- [x] ~~Session config artifact viewer (click skills/hooks to see content)~~ — shipped
- [x] ~~Stop hooks (leaf-tracker, synthesis-trigger, root-updater)~~ — shipped
- [x] ~~Scheduled cron execution~~ — shipped
- [x] ~~Gallery publishing~~ — shipped
- [x] ~~Vault download/export~~ — shipped
