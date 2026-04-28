# Banyan Tree Knowledge Workspace — Chikorita Redesign

## Context

The Research Workspace is transforming from a developer-tool aesthetic (dark glassmorphism, panel-heavy layout) to a **knowledge garden** inspired by the Banyan Tree metaphor:

- **Roots** = who you are (inferred identity, internalized knowledge)
- **Branches** = active intentions (what you're reaching toward)
- **Leaves** = information artifacts (research the agent produces)
- **Flowers** = personal insights (what resonated with YOU)
- **Gallery** = shared flowers (what you publish)

The UI shifts to a **Claude.ai-inspired layout** (centered chat, icon sidebar for navigation, contextual right panel for artifacts) with a **Chikorita-inspired color palette** (sage greens, leaf accents, earth-brown borders, ruby flowers).

---

## Phase 1: Chikorita Color Palette

Replace all dark blue-silver tokens with nature greens/browns. This is a light theme.

### File: `prototypes/research-workspace/src/design-system/tokens.css`

Replace the entire `:root` block:

```css
:root {
  /* Surface hierarchy (light sage, layered paper) */
  --color-surface: #f4f7ec;
  --color-surface-dim: #eaeddf;
  --color-surface-bright: #ffffff;
  --color-surface-container-lowest: #fafcf5;
  --color-surface-container-low: #f0f4e6;
  --color-surface-container: #e8eddb;
  --color-surface-container-high: #dfe5cf;
  --color-surface-container-highest: #d4dbb4;
  --color-surface-variant: #d4dbb4;

  /* Primary — leaf green */
  --color-primary: #4a8a38;
  --color-primary-container: #d4edcc;
  --color-primary-fixed: #b8d9ac;
  --color-primary-fixed-dim: #7bb661;
  --color-on-primary: #ffffff;
  --color-on-primary-container: #2d5a22;
  --color-on-primary-fixed: #1a3314;

  /* Secondary — ruby-red (Chikorita eyes, flowers) */
  --color-secondary: #8b2252;
  --color-secondary-container: #f5d0e0;
  --color-on-secondary: #ffffff;
  --color-on-secondary-container: #6b1040;

  /* Tertiary — warm amber-brown (branches, structure) */
  --color-tertiary: #8b7355;
  --color-tertiary-container: #f0e4d4;
  --color-on-tertiary: #ffffff;
  --color-on-tertiary-container: #5a4830;

  /* Text */
  --color-on-surface: #1e2d1a;
  --color-on-surface-variant: #4a5a42;
  --color-on-background: #1e2d1a;
  --color-inverse-surface: #2d4a28;
  --color-inverse-on-surface: #e3ebd8;
  --color-inverse-primary: #7bb661;

  /* Borders — earth tones */
  --color-outline: #6b5b4a;
  --color-outline-variant: #c4b8a4;

  /* Error */
  --color-error: #ba1a1a;
  --color-error-container: #ffdad6;
  --color-on-error: #ffffff;
  --color-on-error-container: #410002;

  /* Success — bright leaf */
  --color-accent-success: #5daa45;

  /* Tree semantic tokens */
  --color-root: #6b5b4a;
  --color-branch: #8b7355;
  --color-leaf: #7bb661;
  --color-flower: #8b2252;

  /* Spacing, radii, fonts — unchanged */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 48px;

  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;

  --font-headline: "Space Grotesk", sans-serif;
  --font-body: "Newsreader", serif;
  --font-label: "Inter", sans-serif;
  --font-mono: "SF Mono", "Cascadia Code", "Fira Code", "JetBrains Mono", ui-monospace, monospace;
}
```

### File: `prototypes/research-workspace/tailwind.config.ts`

Add tree semantic colors to `theme.extend.colors`:
```
root: "var(--color-root)",
branch: "var(--color-branch)",
leaf: "var(--color-leaf)",
flower: "var(--color-flower)",
```

### File: `prototypes/research-workspace/src/index.css`

Major CSS changes:

1. **Backdrop**: `#08090c` dark dot-grid → `#f4f7ec` sage with subtle green dot-grid
2. **`.glass-widget`** → **`.bark-card`**: Dark transparent glass → light semi-transparent paper with brown border
3. **`.glass-header`** → **`.branch-header`**: Dark blur → light sage blur
4. **Sidebar** → **Nav rail**: Keep 56px, change from dark to sage background
5. **All `text-white/X`** references → semantic `text-on-surface` or `text-on-surface-variant`
6. **All `bg-white/[X]`** references → `bg-on-surface/[X]` or surface token equivalents
7. **Milkdown overrides**: `color: #ffffff` → `color: var(--color-on-surface)`, link color `#93b4ff` → `var(--color-primary)`
8. **Activity animations**: Blue pulse → green pulse
9. **Tool call cards**: White-on-dark → dark-on-light
10. **Syntax highlighting**: Create `syntax-forest.css` replacing `syntax-dark.css` (keywords=ruby, strings=green, comments=muted sage)

### Ultraplan Findings: `text-white/` and `bg-white/` Migration

The Ultraplan review found **242 instances of `text-white/`** and **many `bg-white/[X]`** references across 19 TSX files that must be migrated to semantic tokens. Key mappings:

| Old Pattern | New Pattern | Used For |
|------------|-------------|----------|
| `text-white/70` | `text-on-surface/70` | Normal text |
| `text-white/40` | `text-on-surface-variant/60` | Muted text |
| `text-white/20` | `text-on-surface-variant/30` | Very muted text |
| `bg-white/[0.04]` | `bg-on-surface/[0.04]` | Hover backgrounds |
| `bg-white/[0.06]` | `bg-outline-variant/20` | Dividers |
| `border-white/[0.04]` | `border-outline-variant/20` | Subtle borders |
| `text-white` (on primary bg) | `text-on-primary` | Button text |

**Files requiring migration** (highest density first):
- `IntentionsPanel.tsx` (~55 instances)
- `ToolCallCard.tsx` (~25 instances)
- `AgentActivityStrip.tsx` (~20 instances)
- `AmbientStatusBar.tsx` (~15 instances)
- `RunTabBar.tsx`, `RunSummaryView.tsx`, `ToolCallStream.tsx`
- `FileBrowser.tsx`, `SessionConfigPanel.tsx`, `ToolPolicyEditor.tsx`
- `CodeEditor.tsx`, `MarkdownEditor.tsx`

**Additional light-theme fixes**:
- Remove `color-scheme: dark` from date inputs in IntentionsPanel
- Change Milkdown `color: #ffffff !important` → `color: var(--color-on-surface) !important`
- Change `prose-invert` class in MarkdownRenderer → remove or change to `prose`
- Update ToastContainer backgrounds from dark to light
- Remove old `ToolActivityPanel.tsx` (dead code, no longer imported)

---

## Phase 2: Claude.ai Layout (Nav + Chat + Context Panel)

### New layout architecture

```
+--56px--+------ centered, max-w-720px ------+-- 0 or 420px --+
|        |                                    |                 |
| [tree] |  Chat messages (scrollable)        | Context panel   |
| [files]|                                    | (slides in      |
| [graph]|                                    |  when relevant) |
| [cfg]  |  ┌──────────────────────────────┐  |                 |
| [pub]  |  │ What would you like to       │  | • Intention list|
|        |  │ explore?                      │  | • File viewer   |
|        |  └──────────────────────────────┘  | • Graph molecule|
+--------+------------------------------------+-----------------+
```

### New components to create

| File | Purpose |
|------|---------|
| `src/components/nav/NavRail.tsx` | 56px icon column, no expanding. Click = switch view. |
| `src/components/nav/NavIcon.tsx` | Icon with hover tooltip label, active indicator dot |
| `src/components/context/ContextPanel.tsx` | Right-side sliding panel (420px), header with close button |
| `src/components/views/ChatView.tsx` | Centered chat wrapper (max-w-2xl), passes context triggers up |
| `src/components/views/FileExplorerView.tsx` | Full-page FileBrowser + FileEditor side by side |
| `src/components/views/TreeGraphView.tsx` | Full-page knowledge graph (stub initially) |
| `src/components/views/ConfigView.tsx` | Full-page SessionConfigPanel wrapper |

### WorkspaceLayout.tsx rewrite

```tsx
type ViewId = "chat" | "files" | "tree" | "config";
type ContextContent = { type: "intentions"; } 
                    | { type: "file"; path: string; }
                    | { type: "molecule"; branchId: string; }
                    | { type: "activity"; }
                    | null;

// State:
const [activeView, setActiveView] = useState<ViewId>("chat");
const [contextPanel, setContextPanel] = useState<ContextContent>(null);

// Layout:
<div className="workspace-layout workspace-backdrop flex">
  <NavRail activeView={activeView} onNavigate={setActiveView} />
  <main className="flex-1 flex min-w-0">
    <div className="flex-1 flex justify-center overflow-hidden">
      {/* View switcher renders one view at a time */}
    </div>
    {contextPanel && <ContextPanel ... onClose={() => setContextPanel(null)} />}
  </main>
</div>
```

### Components to remove
- `src/components/sidebar/SidebarRail.tsx` — replaced by NavRail
- `src/components/sidebar/SidebarIcon.tsx` — replaced by NavIcon

### Components to modify
- `ChatPanel.tsx` — redesign welcome screen ("What would you like to explore?"), larger centered input at bottom, remove header bar, add context panel triggers
- `FileBrowser.tsx` — adapt for full-page use (remove glass-header dependency)
- `SessionConfigPanel.tsx` — adapt for full-page use

### Mobile layout
5 bottom tabs: Chat, Files, Tree, Config, Publish. Context panel becomes a bottom sheet modal.

---

## Phase 3: Tree Data Model

### New file: `src/types/tree.ts`

```typescript
export interface Root {
  id: string;
  label: string;
  confidence: number;  // 0-1
  source: 'stated' | 'inferred' | 'internalized';
  internalizedFrom?: string;  // branchId
  createdAt: string;
}

export interface Branch {
  id: string;
  title: string;
  description: string;
  status: 'growing' | 'flowering' | 'internalizing' | 'rooted';
  parentBranchId?: string;
  rootConnections: string[];
  createdAt: string;
  lastActiveAt: string;
}

export interface Leaf {
  id: string;
  branchId: string;
  type: 'markdown' | 'code' | 'diagram' | 'reference';
  filePath: string;
  summary: string;
  createdAt: string;
}

export interface Flower {
  id: string;
  branchId: string;
  leafId?: string;
  rootConnections: string[];
  insight: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
}

export interface Connection {
  from: string;
  to: string;
  type: 'feeds' | 'led_to' | 'internalized_as' | 'branched_from';
  label?: string;
}

export interface BanyanTree {
  version: 1;
  roots: Root[];
  branches: Branch[];
  leaves: Leaf[];
  flowers: Flower[];
  connections: Connection[];
  lastModified: string;
}
```

### New file: `src/hooks/useTree.ts`

Load/save `.tree.json` via existing vault file API (`GET/PUT /api/vault/files/.tree.json`). Auto-migrate from `.intentions.json` on first load if no `.tree.json` exists.

### Migration: Intentions → Tree

Each existing `Intention` maps to a `Branch`:
- `type` → preserved in description context
- `title` → `branch.title`
- `description` → `branch.description`
- `schedule` → stored as branch metadata for scheduler
- `documents` → stored as connections to leaf nodes

---

## Phase 4: Chat-First Intention Creation & Conversational Interaction

The chat replaces the form-based IntentionsPanel as the primary way to create and manage intentions. The system acts as a **research companion** that helps users articulate, refine, and connect their learning goals through dialogue.

### ChatPanel Redesign

- Remove header bar (connection status moves to nav rail badge)
- Full-height centered chat, max-w-2xl
- Large input area at bottom with rounded-xl border, placeholder: "What would you like to explore?"
- Messages: Left-aligned with subtle role indicators (like Claude.ai), not asymmetric bubbles
- Tool uses: Compact inline leaf-green badges below message content

### Welcome State (Empty Chat)

```
        What would you like to explore?

  ┌──────────────────┐  ┌──────────────────┐
  │ 🌱 Connect my    │  │ 🔬 Explore a     │
  │ experience to    │  │ research topic   │
  │ a new field      │  │ in depth         │
  └──────────────────┘  └──────────────────┘
  ┌──────────────────┐  ┌──────────────────┐
  │ 🌿 Synthesize    │  │ 🧭 What should   │
  │ what I've        │  │ I explore        │
  │ learned          │  │ next?            │
  └──────────────────┘  └──────────────────┘
```

Suggestion chips are leaf-shaped pills with subtle green border. Clicking one populates the input and sends.

### Conversation Phase Detection & Contextual Surfaces

The system detects what **phase** the conversation is in and shows the right panel:

| Signal in Chat | Phase | Context Panel Shows |
|---------------|-------|---------------------|
| "I want to learn about..." | **Intending** | Intention list, new one highlighted with pulse |
| "Tell me about..." / "What is..." | **Exploring** | Nothing (full-width chat) |
| "How does X connect to Y?" | **Connecting** | Knowledge molecule for that cluster |
| Agent running research | **Researching** | Activity strip (tool calls as calm cards) |
| Agent produced a file | **Reviewing** | File viewer (rendered markdown artifact) |
| "Show me my tree" | **Reflecting** | Full molecule graph |
| User makes personal connection | **Flowering** | Flower card with lineage |

**How phase detection works** (initial implementation):
- The chat WebSocket already streams `tool_use` events — use these to detect "Researching" phase
- When assistant response mentions a file path → detect "Reviewing" phase, open file in context panel
- Frontend pattern-matches user messages for intent signals ("I want to", "how does", "show me")
- The context panel has a close button — user can always dismiss it

### Conversation Flow: Creating an Intention

```
You: I want to understand how my data science background
     connects to ML engineering roles

                              ┌─ Context Panel ──────────┐
System: That's an interesting │ ┌─ Your Branches ──────┐ │
direction. Let me understand  │ │                       │ │
your background better.       │ │ ● KV caching (3 🍃)  │ │
                              │ │ ● Flash attention     │ │
What kind of data science     │ │ ◉ NEW: DS → ML Eng   │ │ ← pulsing
work have you done?           │ │                       │ │
                              │ └───────────────────────┘ │
                              └───────────────────────────┘

You: Mostly geospatial analysis — satellite imagery
     classification, remote sensing pipelines

System: Interesting — satellite imagery classification
involves CNNs, data pipelines, and production deployment
patterns that map directly to ML engineering.

I've refined your intention:

┌─ 🌱 Branch ─────────────────────────────────────┐
│ "Geospatial → ML Engineering Career Bridge"      │
│                                                   │
│ Explore how satellite imagery classification      │
│ skills (CNNs, geospatial pipelines, raster        │
│ processing) connect to ML engineering roles       │
│                                                   │
│ Connected to: 🌳 Data Science (root)              │
│                                                   │
│ [▶ Research Now]  [✏ Edit]  [⏰ Schedule]         │
└───────────────────────────────────────────────────┘

Would you also like me to look at how remote sensing
connects to foundation models? That's a hot area where
your background would be especially relevant.
```

### Conversation Flow: Connecting Intentions

```
You: I want to learn about attention mechanisms

System: You already have a branch on KV caching.
Attention mechanisms are the foundation that KV
caching builds on.

Should I:                     ┌─ Context Panel ──────────┐
                              │ ┌─ Molecule ────────────┐ │
(a) Add as a prerequisite     │ │      ○ attention      │ │
    to KV caching             │ │     / \               │ │
                              │ │    /   \              │ │
(b) Create a separate branch  │ │   ○     ○ KV cache   │ │
    that links to it          │ │ flash    |            │ │
                              │ │ attn    ○ MQA        │ │
(c) Expand KV caching to      │ │                      │ │
    include attention basics   │ └──────────────────────┘ │
                              └───────────────────────────┘
```

### Conversation Flow: Flower Blooming (Insight Recognition)

```
You: Oh wait — attention is basically spatial
     autocorrelation! In my geospatial work, nearby
     pixels influence each other with learned weights,
     and that's exactly what attention does with tokens.

System: That's a beautiful connection. 🌸

You've just linked your geospatial roots to your
attention research — spatial autocorrelation IS a
form of attention over spatial features.

┌─ 🌸 Flower ──────────────────────────────────────┐
│ "Attention = Spatial Autocorrelation"              │
│                                                    │
│ Attention mechanisms in transformers work like      │
│ spatial autocorrelation — nearby tokens influence   │
│ each other with learned weights, just like nearby   │
│ pixels in satellite imagery.                        │
│                                                    │
│ 🌳 Root: Geospatial Data Science                   │
│ 🌿 Branch: Understanding Attention Mechanisms      │
│ 🍃 Leaf: reviews/attention-mechanisms.md           │
│                                                    │
│ [🌸 Share to Gallery]  [Save as Note]              │
└────────────────────────────────────────────────────┘

Would you like to share this insight to your gallery?
```

### Conversation Flow: Internalization (Branch → Root)

```
System: I've noticed something — over the last few
conversations, you've been explaining attention
concepts back to me and using them to reason about
new problems. You asked questions today that
presuppose understanding of multi-head attention.

It seems like attention mechanisms have moved from
something you were learning about (a branch) to
something you understand deeply (a root).

┌─ 🌳 Internalization ────────────────────────────┐
│ "Understanding Attention Mechanisms"              │
│                                                   │
│ Status: 🌿 growing → 🌳 rooted                   │
│                                                   │
│ This branch is becoming part of your foundation.  │
│ New intentions can now build on this knowledge.   │
│                                                   │
│ Evidence:                                         │
│ • Explained flash attention unprompted             │
│ • Used attention vocabulary casually               │
│ • Connected attention to geospatial concepts       │
│ • Asked questions presupposing understanding       │
│                                                   │
│ [Confirm ✓]  [Not yet — keep as branch]           │
└───────────────────────────────────────────────────┘
```

---

## Phase 5: Knowledge Graph Visualization

### TreeGraphView.tsx — "The Garden View"

Not one big graph. **Knowledge molecules** — small clusters of 3-7 connected nodes that are visually graspable. The key design principle: **help users hold the structure in their head** and see connections between things they're learning.

### Molecule Layout

```
A molecule is a cluster of related nodes:

        ○ Flash Attention          (leaf)
       / \
      /   \
  ○ Tiling  ○ Memory Hierarchy    (leaves)
      \   /
       \ /
        ● KV Cache Optimization   (branch, larger)
        |
        ○ Multi-Query Attention    (leaf)
        
  ↑ This is the "Inference Optimization" molecule
```

### Tree Visualization (Full Garden)

```
                  🌸           🌸        flowers at the top
                 /   \        /
            🍃 🍃   🍃    🍃  🍃       leaves on branches
              \  |   /      |  /
               branch A    branch B    branches grow up
                  \       /
                   \     /
     ═════════════╧═════╧════════════  ground line
                   /     \
                  /       \
              root 1    root 2         roots grow down
                          |
                        root 3
                   (internalized)
```

### Visual Rules
- **Roots grow down** (brown, stable, grounding)
- **Branches grow up** (amber/brown, aspirational)
- **Leaves are green dots** on branches
- **Flowers are ruby dots** with subtle glow
- **Internalizing branches curve downward** through the ground line
- **Published flowers** have a share icon indicator
- **The ground line** separates "who you are" from "what you're exploring"

### Rendering
- Use D3 force layout or vis.js with custom gravity constraints
- Roots: gravity pulls downward, brown circles
- Branches: gravity pulls upward, amber lines
- Nodes colored by type using tree semantic tokens:
  - `--color-root` (#6b5b4a) for roots
  - `--color-branch` (#8b7355) for branches
  - `--color-leaf` (#7bb661) for leaves
  - `--color-flower` (#8b2252) for flowers
- Clicking a node opens it in the context panel
- Hovering shows a tooltip with the node's title and connections

---

## Phase 6: Agentic Skill Architecture (Future — Design Only)

This phase defines the Claude Code skills, hooks, and sub-agent patterns that will power the tree growth. **Not implemented in this session** but designed now for architectural alignment.

### Skills (`.claude/skills/` in the vault)

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `gardener` | Every chat message | **Orchestrator** — reads tree, detects conversation phase, delegates to sub-skills |
| `branch-grower` | "I want to learn about..." | Creates/manages branches. Asks follow-up questions. Connects to roots. |
| `researcher` | Branch exists, user wants depth | Spawns 3 parallel sub-agents: foundations, personal connections, practical applications. Writes leaves. |
| `synthesizer` | Hook triggers after 5+ leaves on a branch | Finds patterns across leaves. Identifies gaps. Writes synthesis with Mermaid diagrams. |
| `flower-bloomer` | User makes personal connection ("that's like...") | Captures insight as a flower. Connects to root + branch + leaf. Offers gallery publishing. |
| `root-deepener` | Onboarding, or mastery signals detected | Infers/updates roots from conversation. Handles branch→root internalization. |
| `gallery-publisher` | "Share this" / "Publish" | Crafts gallery item from flower with full lineage (root→branch→leaf→flower). |
| `tree-viewer` | "Show me my tree" / periodic reflection | Generates graph visualization. Offers reflective questions about gaps and growth. |

### Hooks (`.claude/hooks/` in the vault)

| Hook | Type | Purpose |
|------|------|---------|
| `leaf-tracker.js` | PostToolUse (Write) | Counts leaves per branch. When count ≥ 5, writes `.synthesis-needed-{branchId}` flag. |
| `synthesis-trigger.js` | PostToolUse | Checks for synthesis-needed flags. Queues synthesis runs via `.synthesis-queue-{branchId}`. |
| `root-updater.js` | PreToolUse (chat messages) | Monitors for mastery signals ("I understand now", "that's like", restatements). Logs to `.root-signals.jsonl`. |

### Sub-Agent Orchestration Pattern

When the `researcher` skill runs, it spawns parallel sub-agents:

```
Researcher (parent)
  ├─ Agent 1: "Foundations" → writes leaves/{branch}/foundations.md
  ├─ Agent 2: "Personal Connection" → writes leaves/{branch}/connections.md  
  └─ Agent 3: "Practical Applications" → writes leaves/{branch}/practical.md

When all 3 complete → researcher writes summary leaf
→ leaf-tracker hook fires → counts leaves
→ if ≥5, synthesis-trigger queues synthesis run
```

### Tree Lifecycle (How Growth Works)

```
1. ONBOARDING → root-deepener asks "Tell me about yourself"
   → Roots created with confidence scores

2. INTENDING → branch-grower creates branch
   → Connected to relevant roots
   → Context panel shows updated tree

3. RESEARCHING → researcher spawns sub-agents  
   → Leaves grow on the branch
   → Activity shows inline in chat

4. SYNTHESIZING → triggered by hook after 5+ leaves
   → Synthesizer finds patterns, gaps, connections
   → Writes synthesis leaf + Mermaid diagrams

5. FLOWERING → flower-bloomer detects personal insight
   → "Oh, that's like..." → Flower captured
   → Offered for gallery publishing

6. INTERNALIZING → root-deepener detects mastery
   → Branch curves down, becomes new root
   → User's identity grows

7. PUBLISHING → gallery-publisher shares flower
   → Gallery shows: insight + journey + person

8. GROWING → New roots enable new branches
   → Cycle repeats, tree deepens and widens
```

### Vault File Structure

```
vault/
├── .tree.json              ← Full tree state
├── .root-signals.jsonl     ← Mastery signal log
├── leaves/
│   ├── distributed-training/
│   │   ├── foundations.md
│   │   ├── connections.md
│   │   └── practical.md
│   └── kv-caching/
│       └── basics.md
├── syntheses/
│   └── inference-optimization.md
├── flowers/
│   └── attention-is-autocorrelation.md
└── .claude/
    ├── skills/
    │   ├── gardener/SKILL.md
    │   ├── branch-grower/SKILL.md
    │   ├── researcher/SKILL.md
    │   ├── synthesizer/SKILL.md
    │   ├── flower-bloomer/SKILL.md
    │   ├── root-deepener/SKILL.md
    │   ├── gallery-publisher/SKILL.md
    │   └── tree-viewer/SKILL.md
    └── hooks/
        ├── leaf-tracker.js
        ├── synthesis-trigger.js
        └── root-updater.js
```

---

## Files Summary

### New files (10)
| File | Purpose |
|------|---------|
| `src/components/nav/NavRail.tsx` | Icon navigation rail |
| `src/components/nav/NavIcon.tsx` | Individual nav icon with tooltip |
| `src/components/context/ContextPanel.tsx` | Right-side artifact panel |
| `src/components/views/ChatView.tsx` | Centered chat wrapper |
| `src/components/views/FileExplorerView.tsx` | Full-page file browser |
| `src/components/views/TreeGraphView.tsx` | Knowledge graph view |
| `src/components/views/ConfigView.tsx` | Full-page config |
| `src/types/tree.ts` | Banyan Tree type definitions |
| `src/hooks/useTree.ts` | Tree state management hook |
| `src/design-system/syntax-forest.css` | Light-theme syntax highlighting |

### Modified files (6)
| File | Changes |
|------|---------|
| `tokens.css` | Full palette replacement (Chikorita greens/browns) |
| `index.css` | Glass→bark cards, dark→light backdrop, all color refs, animations |
| `tailwind.config.ts` | Add tree semantic colors |
| `WorkspaceLayout.tsx` | Complete rewrite: NavRail + view switcher + context panel |
| `ChatPanel.tsx` | Redesign: centered layout, nature welcome, inline activity |
| `IntentionsPanel.tsx` | Adapt for context panel use, tree data model |

### Removed files (3)
| File | Reason |
|------|--------|
| `src/components/sidebar/SidebarRail.tsx` | Replaced by NavRail |
| `src/components/sidebar/SidebarIcon.tsx` | Replaced by NavIcon |
| `src/design-system/syntax-dark.css` | Replaced by syntax-forest.css |

---

## Verification Plan

1. `yarn workspace @proto-portal/research-workspace dev` — start on port 3009
2. **Color check**: All text readable on sage backgrounds. No white-on-white or invisible text. Run browser DevTools accessibility audit on every view.
3. **Nav rail**: Click each icon — view switches without page reload. Active icon highlighted green. Hover shows tooltip label.
4. **Chat view**: Centered, max-width ~720px. Welcome screen shows "What would you like to explore?" with 4 green suggestion chips. Messages render with markdown. Connection status visible.
5. **Context panel**: Slides in from right when relevant. Close button dismisses. Test: mention a file path in chat → file viewer appears. Navigate to intentions → intention list appears.
6. **Files view**: Full-page file browser + editor side by side. Files load and save correctly.
7. **Config view**: SessionConfigPanel renders full-page with readable text.
8. **Tree view**: Shows graph of `.tree.json` contents (or empty state if no tree yet).
9. **Milkdown editor**: Text visible on light background. Links colored green. Code blocks have proper light backgrounds.
10. **Syntax highlighting**: CodeEditor readable on light background with forest syntax theme.
11. **Modal dialogs**: Delete confirmation, onboarding, tool policy editor, publish dialog — all render correctly on light backgrounds.
12. **Toast notifications**: Visible on light background.
13. **Mobile**: 5-tab bottom nav, chat is default.
14. **Lint**: `yarn lint` passes — no hardcoded hex in TSX files.
15. **Build**: `yarn workspace @proto-portal/research-workspace build` succeeds.

## Implementation Scope (MVP vs. Deferred)

### MVP (This Session)
- Phase 1: Full color palette swap + all `text-white/` and `bg-white/` migration
- Phase 2: NavRail + view switching + ChatView as default. Basic ContextPanel shell.
- Phase 3: Tree types + useTree hook
- Phase 4: ChatPanel welcome screen redesign + suggestion chips

### Deferred (Next Sessions)
- Phase 4 (full): Conversation phase detection, automatic context panel triggers
- Phase 5: Knowledge graph visualization (D3/vis.js)
- Phase 6: Agentic skills, hooks, sub-agent orchestration
- Mobile bottom-sheet for context panel
- Tree migration from `.intentions.json`
