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
│   ├── REST: file CRUD, tree, conversations, runs, activity, config, quota, projects, sources, me
│   ├── WS: chat (Agent SDK stream), run log streams
│   └── /healthz
├── /prototypes/research-workspace/*       →  S3 (React SPA)
│   ├── /                    Gallery (public)
│   ├── /content/:id         Content detail (public)
│   ├── /workspace           Authenticated workspace
│   └── /security            Security architecture page
└── /api/v1/research-workspace/*           →  API Gateway → Lambda (DynamoDB)
```

**Stack:** React 18 + Vite + D3.js (SPA) | Express.js + ws + Claude Agent SDK (backend) | ECS Fargate + EFS + Cognito + DynamoDB (infra). Agent auth: single operator `ANTHROPIC_API_KEY` (commercial API); per-user budgets enforced via DynamoDB quota.

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

### 11. Concurrent Agent Runs (Shipped)

- `POST /api/vault/runs` launches a Claude Agent SDK run (quota-gated)
- Default model Haiku 4.5; synthesis/review opt up to Sonnet 4.6
- Multiple runs execute concurrently; the run WS streams a read-only log
- Each run is bounded by `maxBudgetUsd` (= min $1, remaining daily budget) and `maxTurns`
- Tool activity logged via hooks, polled via REST
- Run status: running → completed/failed/cancelled

### 12. Publishing System (Shipped)

Publish vault files to the public gallery:
- `POST /api/vault/publish` — publishes markdown as gallery item
- Auto-extracts title + summary, generates stable ID
- Tag system with content-derived suggestions
- `GET /api/vault/published` — public listing (no auth)

### 13. Cost & Access Controls (Shipped)

- Single operator `ANTHROPIC_API_KEY` (commercial API), injected from Secrets Manager — never in the image or task def plaintext
- Per-user quota (DynamoDB): 5 runs/day, $5/day, 1 concurrent run; per-run cap = min($1, remaining)
- Org-wide daily cap (soft) + Anthropic Console workspace spend limit (hard floor)
- Allowlist (Cognito `sub`) for invite-only access — non-transferable; empty = open
- Per-user vault isolation via Cognito JWT + path validation + EFS access points
- `GET /api/vault/quota` drives the UI budget banner

### 13b. Scale-to-Zero Infrastructure (Shipped)

Idle infrastructure cost → ~$0. The ECS service idles at `desired_count=0`; a scaler Lambda owns scaling at runtime.

- **Wake-on-request:** SPA `BackendGate` shows a "Starting…" splash, calls the unauthenticated `/vault/_control/wake` (ALB → Lambda, no Cognito), polls `/vault/_control/status` until the task is healthy (~20–40s cold start), then renders the workspace
- **Idle reap:** EventBridge (every 5 min) scales to 0 when the activity heartbeat is stale > 15 min; nightly cron backstop
- **Heartbeat-guarded:** backend refreshes a DynamoDB heartbeat while a run/chat/HTTP session is active, so active agent runs are never reaped mid-flight
- **Compute:** `FARGATE_SPOT`, right-sized to 0.5 vCPU / 1 GB (~$28/mo always-on → ~$0 idle + cents per active hour)
- Public gallery reads published content from the Lambda API, so visitors never wake (or pay for) the backend

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

Automated recurring intention execution (60s loop). **Off by default** — enabled only with `ENABLE_SCHEDULER=1`. When on, each due intention runs through the Agent SDK and the same per-user/org quota gate (skips when over budget). Logs to `.scheduler-log.jsonl`.

### 16. Vault Download/Export (Shipped)

`GET /api/vault/download` — streams vault contents as ZIP, excludes dotfiles.

### 17. Account Menu (Shipped)

Top-right user chip showing the signed-in GitHub identity (display only — no link to a user page). `GET /api/vault/me` returns the GitHub login (`preferred_username`), display name (`name`), and avatar (`picture`) parsed from the Cognito/ALB OIDC JWT, plus `githubConnected` and a `vaultItemCount` (recursive file count, excludes dotfiles). The avatar renders the GitHub image when available, otherwise the GitHub octocat mark. Clicking it reveals the login + vault item count; in local dev (`githubConnected: false`) it says "Dev mode / Not connected to GitHub". The "Back to Gallery" and "Logout" actions (icon buttons with hover tooltips) sit beside it.

### 18. Projects — Isolated Workspaces (Shipped)

A user vault holds multiple **projects**, each an isolated mini-vault under `vaults/{userId}/projects/{projectId}/` with its own `.tree.json`, `.sources.json`, leaves, and `.claude/` config. A `.projects.json` manifest lists them. The active project is chosen by the client (`X-Project-Id` header on REST, `?project=` on the chat WS) and defaults to `default`, so legacy single-vault callers keep working. A global `fetch` wrapper injects the header so every existing call site is project-scoped without per-site edits.

- `GET /api/vault/projects` — list projects with `itemCount` + `sourceCount`
- `POST /api/vault/projects` `{name}` — create (name → slug)
- Top-bar **ProjectSwitcher**: switch projects, create new ones; switching reconnects the chat WS and re-scopes all data.

### 19. Sources & Source Reliability (Shipped)

Surfaces exactly what the agent searched and fetched to fill a project — a clear window into agent behavior. `WebSearch` queries and `WebFetch` URLs from `tool_use` events are de-duped and persisted per-project in `.sources.json`.

- `GET /api/vault/sources` — the active project's sources (searches + pages read, with counts)
- **Sources** nav view: lists searches and fetched pages (clickable links), refreshes live during a run.
- **Meta-questions** — one-click chips that ask the agent about its own sourcing: "How reliable are these sources?", "Why these sources — and what else?", "What did each source contribute?". Each chip sends a grounded prompt (the actual source list) into chat.

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

**Identity flow:** ALB Cognito JWT (GitHub OAuth) → server middleware → `sanitizePath()` against vault root → Agent SDK invoked with `cwd`/`HOME` = the user's vault. Agent auth is the operator `ANTHROPIC_API_KEY`, not per-user credentials.

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

All users share one Fargate task. User isolation is application-layer. Suitable for internal teams and portfolio demonstrations, not multi-tenant production. The task scales to zero when idle (see Feature 13b), so a cold start (~20–40s, surfaced as a "Starting…" splash) precedes the first request after an idle period.

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
