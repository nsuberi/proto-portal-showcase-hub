# AI Integration Strategy Visualizer — Technical Spec

## Purpose

A leadership communication tool that visualizes three organizational strategies for integrating AI into existing business systems. The visual makes the strategic choice feel tangible and navigable by showing how different team structures (pillared vs. cross-functional squads) operate on the same systems, with animated demos running in real time.

The goal: a leader walks away saying *"I understand the three options, I understand what team structure each requires, and I can see where to start."*

---

## Visual Language

Inspired by Augment Code's Context Engine page. The core visual element is a **rotating node-sphere constellation** — not a solid filled sphere. It's made of dozens of small dots distributed in a fibonacci pattern, connected by thin edges forming a mesh. The sphere rotates slowly around the Y axis, and nodes fade in/out based on depth (back-face nodes dim, front-face nodes brighten).

### Aesthetic

- **Background:** Near-black (#08080c)
- **Typography:** IBM Plex Mono (monospace, labels/data), Outfit (display headers)
- **Palette:** Amber sphere nodes, emerald green for AI/converted, soft blue halos for active targets, indigo/pink/amber for team roles
- **Motion:** Slow rotation, pulsing halos, animated spotlight beams, stroke-dashoffset flow arrows

---

## Object Definitions

### NodeMeshSphere

The foundational visual primitive. A 3D fibonacci-distributed constellation of points rendered as 2D SVG.

| Property | Description |
|---|---|
| `count` | Number of nodes (55 for brownfield, 20 for green moons, 15–18 for smaller moons) |
| `radius` | Sphere radius in SVG units |
| `thresh` | Edge connection threshold — nodes closer than this get a connecting line |
| `speed` | Y-axis rotation speed (radians per millisecond) |
| `baseColor` | Default node color (amber `#d97706` for brownfield, `#27272a` for empty moon mesh) |
| `seedOffset` | Rotation offset so multiple spheres aren't synchronized |

**Geometry generation:** `fibSphere()` uses the golden angle to distribute points evenly across the sphere surface. `buildEdges()` connects all node pairs within the distance threshold.

**Projection:** `useSphereProjection()` hook rotates all 3D points around the Y axis by `time * speed`, then projects to 2D. Each projected node has `{ px, py, depth, size, opacity }` where depth (0=back, 1=front) modulates visibility.

**Shared projection model:** The projection is computed once and shared between the mesh renderer and team scene components. This is what allows spotlight beams to track actual rotating node positions.

### NodeMeshRenderer

Renders the projected mesh with stateful coloring.

**Node states:**

| State | Dot Color | Halo | Ring | Tooltip |
|---|---|---|---|---|
| Default (unconverted) | Amber `#d97706` | None | None | None |
| Active target | Amber (stays brown) | Soft blue glow (3 concentric layers: `#2563eb`, `#3b82f6`, `#60a5fa`) with pulsing ring | Dashed blue ring, animated | Blue-backed label with node name |
| Converted | Green `#10b981` | Subtle green pulse | None | Green-backed label |
| Tracked (by a team) | Role color | Role-colored glow | Dashed ring in role color | None |

**Edge coloring:** Edges between two green nodes render in green. All others render in dark amber (`#92400e`). For empty moon meshes, edges render in `#27272a` (line color).

### TeamDot

A colored circle representing a person, identified by role.

| Role | Color | Hex |
|---|---|---|
| Product | Indigo | `#818cf8` |
| Engineering | Pink | `#f472b6` |
| Business | Amber | `#fbbf24` |

Each dot has an inner white highlight and an optional pulse animation (concentric ring that breathes in and out at 2.5s period).

### Spotlight

A beam connecting a TeamDot (or squad cluster) to a specific node on the sphere.

**Visual layers:**
1. Wide glow beam (12px, 3% opacity, rounded linecap)
2. Core beam (2px, 18% opacity, dashed `2 5`, animated stroke-dashoffset)
3. Focus point — filled circle (10px, 6% opacity) + outlined ring (4px)
4. Optional label text below the focus point

**Tracking behavior:** The spotlight endpoint is read directly from the sphere's projected node array at render time. As the sphere rotates, the beam follows the node. When the tracked node rotates to the back face (depth < 0.12), the spotlight returns null and disappears.

### DocPacket

A small violet rectangle (`#c4b5fd`) that arcs between tribe zones during document handoffs.

**Properties:** `fromX/Y`, `toX/Y`, `progress` (0–1). The Y coordinate follows a sine curve for a parabolic arc. Contains two small white "text lines" inside for the document appearance.

### DataFlowArc

Animated dashed curve between two points (used for brown↔green data exchange in Connected Moons).

**Layers:** Thin background path (0.4px, 8% opacity) + thicker dashed foreground (1.5px, 35% opacity, animated stroke-dashoffset).

---

## Integration Patterns

Three vertical options, selected via the left sidebar.

### Pattern 001: Embedded Replacement

**Concept:** Replace components inside the brownfield sphere. The sphere starts entirely amber. Nodes convert to green one at a time (or in batches) as teams complete their workflow.

**Visual:** Single large sphere (55 nodes, radius 95). Active target nodes glow with a blue halo while their center stays amber. When a cycle completes, the blue halo disappears and the dot turns green permanently. A progress bar shows `N/55 converted`.

**Debug panels:** Left side shows `REMAINING (N)` with unconverted node indices; right shows `CONVERTED (N)` with green node indices. These update in real time.

**Reset:** When all 55 nodes are green, the system pauses for one cycle then resets to all-amber.

### Pattern 002: Connected Moons

**Concept:** A green AI moon orbits the brownfield and exchanges data with it. Both systems evolve simultaneously.

**Visual:** Brown sphere (50 nodes, left) + green moon mesh (20 nodes, right). Data flow arcs animate between them. The brown sphere has nodes converting to green. The moon mesh starts as just gray edges with no visible nodes — green dots appear progressively as the squad builds capability.

### Pattern 003: Independent Moons

**Concept:** Fully separate green systems built from scratch with no brownfield connection.

**Visual:** Brown sphere (45 nodes, left) stays unchanged. Two green moons (18 and 15 nodes) on the right side of a dashed "NO CONNECTION" boundary. Each moon starts as an empty mesh and fills with green nodes over time.

---

## Team Structures

Two modes, toggled via the center sidebar.

### Pillared

Three separate tribes — Product, Engineering, Business — positioned above the sphere in distinct zones separated by dashed lines.

**Embedded replacement workflow (per node, ~6.7s total):**

| Phase | Duration | Actor | Action | Visual |
|---|---|---|---|---|
| PM Observe | 0.83s | Product | Observes target node | Indigo spotlight tracks the node |
| PM Write | 0.50s | Product | Writes requirements doc | "writing..." indicator appears |
| Doc → Eng | 0.50s | — | Document flies PM → Engineering | Violet DocPacket arcs between zones |
| Eng Observe | 0.83s | Engineering | Observes same target node | Pink spotlight tracks the node |
| Eng Write | 0.50s | Engineering | Writes technical spec | "writing..." indicator |
| Doc → Biz | 0.50s | — | Spec flies Eng → Business | DocPacket arc |
| Biz Validate | 0.67s | Business | Validates against target node | Amber spotlight tracks the node |
| Biz Write | 0.33s | Business | Writes approval | "writing..." indicator |
| Doc → Eng | 0.50s | — | Approval flies Biz → Engineering | DocPacket arc |
| Eng Implement | 0.50s | Engineering | Implements changes | Pink spotlight returns to node |
| Eng Write | 0.33s | Engineering | Writes completion update | "writing..." indicator |
| Doc → PM | 0.33s | — | Update flies Eng → Product | DocPacket arc |
| PM Review | 0.33s | Product | Reviews — node converts green | Indigo spotlight, then node flips |

**Key visual detail:** Only one tribe's spotlight is active at a time. The active tribe's label brightens (0.8 opacity) while inactive tribes dim (0.3 opacity). All three tribes target the same node — they just take turns.

**Connected moons (pillared):** Tribes alternate between brown sphere work (odd cycles) and green moon building (even cycles). Spotlight color changes to green when targeting the moon.

**Independent moons (pillared):** Product works on moon 1, Engineering works on moon 2. They alternate turns.

### Cross-Functional Squads

Mixed-color dot clusters positioned above the sphere. Each squad contains PM, Engineering, and Business dots clustered together.

**Embedded replacement:** Three squads (α, β, γ) each target a **different** node simultaneously.

| Phase | Duration | Action | Visual |
|---|---|---|---|
| Observe | 1.0s | All squads observe their target | 3 spotlights track 3 different nodes |
| Change | 1.0s | All squads implement changes | Spotlights still active, label changes |
| Review | 0.5s | Nodes convert green, squads review | Spotlights off, nodes flip to green |
| Next | 0.17s | Advance to next targets | Brief pause |

**Idle squads:** When fewer unconverted nodes remain than squads (e.g., 1 node left with 3 squads), surplus squads show "(idle)" and their dots stop pulsing. Only squads with valid targets fire spotlights.

**Squad definitions:**

| Squad | Name | Spotlight Color | Composition |
|---|---|---|---|
| α | SQUAD α | Indigo (`#818cf8`) | PM, Eng, Biz, Eng |
| β | SQUAD β | Pink (`#f472b6`) | Eng, PM, Biz |
| γ | SQUAD γ | Amber (`#fbbf24`) | Biz, PM, Eng |

**Connected moons (squads):** Squad α works the brown sphere, Squad β builds the green moon. Each targets their respective nodes simultaneously.

**Independent moons (squads):** Squad α builds moon 1, Squad β builds moon 2. Both work in parallel, each adding green nodes to their mesh.

---

## State Machine

### Conversion Hook (`useConversion`)

A reusable React hook that tracks conversion progress across team mode switches.

**State (persisted via `useRef`):**
- `convertedRef`: Total number of permanently green nodes
- `modeStartRef`: Timestamp when current mode session began
- `lastCycleRef`: Last committed cycle number (prevents double-counting)

**On mode switch:** `modeStartRef` resets to current time. `lastCycleRef` resets to -1. `convertedRef` is preserved — green nodes stay green. Any in-progress node reverts to amber (its cycle didn't complete).

**Per-render logic:**
1. Compute `completedCycles = floor(elapsed / cycleDur)`
2. If `completedCycles > lastCycleRef` and nodes remain:
   - Loop through new cycles one at a time
   - Each cycle converts `min(squadCount, remaining)` nodes
   - This handles the last batch correctly (1 node left, 3 squads → 1 conversion)
3. When `allDone` and one more cycle passes → reset all refs

**Green set derivation:** Always `EMBED_TARGET_NODES[0..greenCount-1]`. Active targets are always `EMBED_TARGET_NODES[greenCount..greenCount+N-1]`. This guarantees no overlap and no re-targeting of green nodes.

**Squad lights-off behavior:** In squad mode, when `cycleTime >= 6 * P3` (2s mark), spotlights turn off and a `displayGreen` set is computed that includes the current active nodes. This makes nodes appear green the instant the beams disappear, before the cycle boundary officially commits them.

---

## Layout

### Top Bar
Status dot (color matches current pattern) + "AI INTEGRATION STRATEGY" label + pattern counter.

### Controls Row (3 columns)

| Column | Width | Content |
|---|---|---|
| Integration Pattern | 240px | 3 buttons: Embedded, Connected, Independent |
| Team Structure | 200px | 2 buttons: Pillared, Cross-Functional Squads (with dot previews) |
| Legend | flex | Color key for roles, node states, and document packets |

### Main Visualization
SVG viewBox `0 0 700 420`. Contains the active scene (sphere + teams + spotlights + progress).

### Bottom Info
Pattern name, description, and key insight panel.

---

## Color System

| Token | Hex | Usage |
|---|---|---|
| `brown` | `#d97706` | Default sphere node fill (amber) |
| `brownLight` | `#f59e0b` | Highlighted amber nodes |
| `brownDark` | `#92400e` | Sphere edge lines |
| `green` | `#10b981` | Converted nodes, green moon nodes |
| `greenLight` | `#6ee7b7` | Green label text |
| `greenDark` | `#14532d` | Green label background |
| `active` | `#60a5fa` | Active target halo (blue-400) |
| `activeSoft` | `#3b82f6` | Mid halo ring (blue-500) |
| `activeGlow` | `#2563eb` | Outer halo wash (blue-600) |
| `pm` | `#818cf8` | Product role dots + spotlights |
| `eng` | `#f472b6` | Engineering role dots + spotlights |
| `biz` | `#fbbf24` | Business role dots + spotlights |
| `doc` | `#c4b5fd` | Document packet fill |
| `bg` | `#08080c` | Page background |
| `line` | `#27272a` | Separator lines, empty mesh edges |

---

## Technical Stack

- **Framework:** React (functional components + hooks)
- **Styling:** Inline styles + Tailwind utility classes
- **Rendering:** SVG for all sphere, team, and flow visuals
- **Animation:** `requestAnimationFrame` loop driving a `time` state; CSS keyframe-equivalent via SVG `<animate>` elements; stroke-dashoffset for flow arrows
- **Fonts:** Google Fonts (IBM Plex Mono, Outfit)
- **Dependencies:** None beyond React
- **Output:** Single `.jsx` file, no backend

---

## Key Design Decisions

1. **Node-tracking spotlights:** Sphere geometry is computed in a shared hook, so both the mesh renderer and team scenes reference the same projected positions. Spotlights follow actual rotating nodes rather than targeting fixed coordinates.

2. **Amber stays amber until done:** Active target nodes maintain their amber fill — the blue is only a halo. This makes the brown→green transition a clear binary flip, not a gradual color shift.

3. **Persistent green state across mode switches:** A single `useRef` integer tracks conversion progress. Switching from pillared to squads preserves which nodes are green. The in-progress node restarts its cycle in the new mode.

4. **Idle squads:** When fewer nodes remain than squads, surplus squads go idle rather than re-targeting green nodes. This prevents visual confusion and accurately represents real team dynamics.

5. **Moon mesh starts empty:** In Connected and Independent patterns, the green moon renders as just edges initially (gray `#27272a`). Green dots appear progressively as teams build capability, making the creation process visible.

6. **1/3 time scale:** All cycle durations are scaled to 1/3 of their original values for a faster, more watchable demo. Pillared cycles run ~6.7s per node; squad cycles run ~2.7s.

---

## Pipeline Stages

The 55 nodes represent a financial services data pipeline. They are grouped into four stages that reflect how data flows through an organization — from intake through transformation into decisions and finally into action with customers.

### Stage 1: INTAKE (13 nodes)

**AI Readiness Theme:** Understanding your data — what comes in, how it's captured.

This is the foundation. Before an organization can apply AI to anything, it needs to understand what data it has, how it enters the system, and whether it arrives in a shape that machines can reason about. The work here is about making intake structured, observable, and spec-compliant.

| Node ID | Label | Role in Pipeline |
|---------|-------|-----------------|
| 0 | intake-router | Routes incoming requests to the correct processing queue |
| 1 | auth-gateway | Authenticates callers and issues session tokens |
| 2 | session-mgr | Manages active sessions and tracks request context |
| 3 | form-validator | Validates submitted form data against field-level rules |
| 4 | data-mapper | Maps external data formats to internal canonical schema |
| 5 | intake-flow | Orchestrates the multi-step intake sequence |
| 6 | queue-handler | Manages async processing queues for intake events |
| 7 | event-bus | Publishes domain events for downstream subscribers |
| 8 | cache-layer | Caches frequently accessed reference data |
| 9 | rate-limiter | Throttles incoming requests to prevent overload |
| 12 | identity-verify | Verifies applicant identity against external sources |
| 48 | routing-logic | Determines which processing path a request follows |
| 49 | load-balancer | Distributes traffic across service instances |

### Stage 2: TRANSFORMATION (13 nodes)

**AI Readiness Theme:** Building specs — how data is enriched, classified, and stored.

With intake understood, the organization builds reliable pipelines that classify, parse, enrich, and warehouse data. This stage is about creating the "single source of truth" — clean data with clear lineage that AI models can train on and draw from.

| Node ID | Label | Role in Pipeline |
|---------|-------|-----------------|
| 13 | doc-classifier | Classifies incoming documents by type |
| 14 | ocr-engine | Extracts text from scanned images and PDFs |
| 15 | pdf-parser | Parses structured data from PDF documents |
| 16 | data-enrichment | Augments records with third-party data |
| 23 | audit-logger | Records all system actions for audit trail |
| 38 | audit-trail | Maintains immutable log of data changes |
| 39 | archive-svc | Archives processed records for long-term storage |
| 40 | search-index | Indexes records for full-text search |
| 41 | analytics-agg | Aggregates metrics for reporting |
| 42 | data-extract | Extracts data from source systems |
| 43 | etl-pipeline | Transforms and loads data between systems |
| 44 | data-warehouse | Stores structured data for analytics |
| 45 | bi-connector | Connects BI tools to the data warehouse |

### Stage 3: DECISION (15 nodes)

**AI Readiness Theme:** Applying intelligence — scoring, compliance, approvals.

Clean data and reliable pipelines enable the organization to make better decisions. This stage is where AI has the highest-leverage impact: replacing hardcoded business rules with models that learn, adapting compliance checks to changing regulations, and making approval workflows intelligent rather than mechanical.

| Node ID | Label | Role in Pipeline |
|---------|-------|-----------------|
| 10 | risk-scoring | Assigns risk scores to applications |
| 11 | credit-check | Pulls and evaluates credit reports |
| 17 | approval-gate | Gates workflow progression on approval conditions |
| 18 | workflow-engine | Orchestrates multi-step business processes |
| 24 | compliance-rule | Evaluates regulatory compliance rules |
| 25 | reg-matcher | Matches transactions to applicable regulations |
| 26 | policy-engine | Enforces organizational policy constraints |
| 27 | eligibility | Determines product eligibility for applicants |
| 28 | pricing-calc | Calculates pricing based on risk and product rules |
| 29 | fee-schedule | Manages fee structures and applies correct fees |
| 33 | compliance-chk | Performs compliance verification at key checkpoints |
| 34 | fraud-detect | Detects potentially fraudulent activity |
| 35 | aml-screen | Screens against anti-money-laundering watchlists |
| 36 | sanctions-chk | Checks against sanctions and embargo lists |
| 47 | alert-engine | Generates and routes alerts based on threshold rules |

### Stage 4: ACTION (14 nodes)

**AI Readiness Theme:** New products & interfaces — communications, services, delivery.

This is the capstone. With foundations in place, the organization builds new customer-facing capabilities: AI-generated disclosures, personalized communications, intelligent payment routing, real-time dashboards. These are the new products and interfaces that accomplish the business goals.

| Node ID | Label | Role in Pipeline |
|---------|-------|-----------------|
| 19 | notification-svc | Orchestrates multi-channel notifications |
| 20 | email-sender | Sends transactional and marketing emails |
| 21 | sms-gateway | Sends SMS messages |
| 22 | doc-review | Manages human review of generated documents |
| 30 | payment-proc | Processes payment transactions |
| 31 | escrow-mgr | Manages escrow accounts and disbursements |
| 32 | fund-transfer | Executes fund transfers between accounts |
| 37 | report-gen | Generates regulatory and business reports |
| 46 | dashboard-api | Serves data to real-time dashboards |
| 50 | disclosure-gen | Generates legally required disclosure documents |
| 51 | template-mgr | Manages document and communication templates |
| 52 | signing-svc | Manages electronic signature workflows |
| 53 | delivery-track | Tracks document delivery and receipt |
| 54 | feedback-loop | Captures customer feedback and routes to teams |

### Conversion Order

Nodes convert in stage order: all INTAKE nodes first, then TRANSFORMATION, then DECISION, then ACTION. Within each stage, infrastructure/foundational nodes convert before customer-facing ones. This replaces the previous sequential (0, 1, 2, ... 54) order with a deliberate AI-readiness narrative.

The full conversion sequence is defined as `CONVERSION_ORDER: number[]` — a reordered array of all 55 node IDs.

---

## Node Data Model

Each node carries a data model describing what it does before and after AI conversion. This is the same regardless of team structure (pillared vs squads) — the organizational approach affects the animation choreography, not the transformation content.

### Schema

```
NodeDataModel {
  nodeId: number
  label: string
  stage: "intake" | "transform" | "decide" | "act"
  conversionOrder: number              // position in AI-readiness sequence

  before: {
    summary: string                    // 1-sentence brownfield behavior
    inputFields: DataField[]           // what flows in
    outputFields: DataField[]          // what flows out
    logic: string                      // how it transforms (plain English)
    pain: string                       // the problem / why this is ripe for AI
  }

  after: {
    summary: string                    // 1-sentence AI-enhanced behavior
    inputFields: DataField[]           // what flows in (may have new fields)
    outputFields: DataField[]          // what flows out (may have new fields)
    logic: string                      // how AI transforms it
    gain: string                       // the benefit / what AI unlocks
  }

  patterns: {
    embedded: { action: string }
    connected: {
      action: string
      integrationWork?: string         // API changes required
      apiEmits?: DataField[]           // what old system sends to moon
      apiReceives?: DataField[]        // what old system accepts back
    }
    independent: { action: string }
  }
}

DataField {
  name: string                         // e.g., "applicant_income"
  type: string                         // e.g., "number", "string", "object"
  source?: string                      // upstream node label
  isNew?: boolean                      // true if added by AI enhancement
}
```

### Worked Examples

#### Example 1: intake-router (Node 0, Stage: INTAKE)

**Before:**
- Summary: Static regex-based routing table mapping URL patterns to handler queues
- Input: `{ path: string, method: string, headers: object }`
- Output: `{ queue_name: string, priority: number }`
- Logic: Match path against 200+ regex rules, assign to queue by first match. Priority is hardcoded per queue.
- Pain: Regex rules accumulate over years. No one knows which are active. Routing errors cause silent misdelivery.

**After:**
- Summary: Intent-classified routing with fallback to rules
- Input: `{ path: string, method: string, headers: object, request_body_preview: string (NEW) }`
- Output: `{ queue_name: string, priority: number, confidence: number (NEW), routing_reason: string (NEW) }`
- Logic: NLP classifier reads request metadata + body preview to determine intent. Routes by intent with confidence score. Falls back to regex if confidence < 0.85.
- Gain: Self-documenting routing. Misdelivery rate drops. New request types auto-categorize without rule authoring.

**Pattern narratives:**
- Embedded: "Replace regex routing table with intent classifier inside the existing routing service."
- Connected: "Old router emits request metadata to AI moon for intent classification, receives routing decision back." API emits: `{ request_metadata: object }`. API receives: `{ route_decision: object }`. Integration work: "Add /api/v2/classify-intent endpoint to routing service."
- Independent: "New intake gateway built from scratch with ML-first routing. Old router continues unchanged."

#### Example 2: risk-scoring (Node 10, Stage: DECISION)

**Before:**
- Summary: Rules-based risk score using hardcoded thresholds
- Input: `{ credit_score: number, income: number, debt_ratio: number, employment_years: number }`
- Output: `{ risk_tier: enum(low|medium|high), risk_score: number }`
- Logic: If credit_score > 720 AND debt_ratio < 0.36 AND employment_years > 2 then low. Else cascading if/else.
- Pain: Static thresholds miss nuance. Manual updates lag market changes by months. No explanation for denials.

**After:**
- Summary: ML model scoring with explainable feature importance
- Input: `{ credit_score: number, income: number, debt_ratio: number, employment_years: number, behavioral_signals: object (NEW), market_context: object (NEW) }`
- Output: `{ risk_tier: enum(low|medium|high), risk_score: number, feature_importance: object (NEW), confidence: number (NEW), explanation: string (NEW) }`
- Logic: Gradient-boosted model trained on 5-year outcomes. Incorporates behavioral signals and market conditions. Outputs SHAP values for each feature.
- Gain: 20% better default prediction. Real-time model updates. Auditable explanations satisfy regulatory requirements.

**Pattern narratives:**
- Embedded: "Replace hardcoded scoring logic with ML model endpoint inside the existing risk service."
- Connected: "Old risk service sends applicant data bundle to AI moon, receives enriched risk result with explanations." API emits: `{ applicant_bundle: object }`. API receives: `{ ml_risk_result: object }`. Integration work: "Add /api/v2/risk-assess endpoint; old service must serialize applicant context."
- Independent: "New risk platform built from scratch with ML-native scoring. Old system keeps its hardcoded rules."

#### Example 3: disclosure-gen (Node 50, Stage: ACTION)

**Before:**
- Summary: Template-merge disclosure generation using static Word templates
- Input: `{ applicant_data: object, loan_terms: object, template_id: string }`
- Output: `{ pdf_document: binary, disclosure_type: string }`
- Logic: Select template by ID, merge applicant data into placeholders, render to PDF. Templates maintained by legal team manually.
- Pain: Template updates take weeks through legal review. Disclosures are generic. Errors in merge fields cause compliance issues.

**After:**
- Summary: AI-assembled disclosures with regulatory-aware content selection
- Input: `{ applicant_data: object, loan_terms: object, template_id: string, jurisdiction: string (NEW), applicant_profile: object (NEW) }`
- Output: `{ pdf_document: binary, disclosure_type: string, plain_language_summary: string (NEW), readability_score: number (NEW), regulatory_citations: string[] (NEW) }`
- Logic: LLM selects and assembles disclosure sections based on jurisdiction and applicant profile. Generates plain-language summaries. Cross-references regulatory database for required citations.
- Gain: Jurisdiction-specific disclosures in minutes not weeks. Plain-language summaries improve customer comprehension. Automated regulatory citation reduces compliance risk.

**Pattern narratives:**
- Embedded: "Replace template-merge logic with AI-assembled disclosure pipeline inside existing document service."
- Connected: "Old document service sends template context to AI moon, receives assembled disclosure with summaries." API emits: `{ disclosure_context: object }`. API receives: `{ assembled_disclosure: object }`. Integration work: "Add /api/v2/assemble-disclosure endpoint; old service must pass jurisdiction context."
- Independent: "New disclosure platform built from scratch with LLM-native document assembly. Old system keeps template merge."

---

## AI Readiness Narrative

The conversion order tells a deliberate story about organizational AI readiness. It mirrors how mature organizations actually adopt AI — not by starting with flashy customer-facing products, but by building understanding from the ground up.

### Level 1: Understand Your Data (INTAKE)

The organization starts by examining what data enters the system and how. This is the "data literacy" phase. Every field, every format, every routing decision gets a clear spec. AI at this level is about making intake observable and self-documenting — intent classification, smart validation, adaptive routing.

**What it looks like:** Teams are documenting APIs, cataloging data formats, adding observability to intake pipelines. The work feels foundational, not glamorous. But without it, everything downstream is built on assumptions.

### Level 2: Build Reliable Specs (TRANSFORMATION)

With intake understood, the organization builds pipelines that classify, parse, enrich, and warehouse data reliably. AI at this level replaces manual classification (document types, data extraction) with models that learn. The data warehouse becomes the "single source of truth" that downstream intelligence draws from.

**What it looks like:** Teams are building ETL pipelines with AI-powered extraction, setting up feature stores, creating the data contracts that decision-making systems depend on.

### Level 3: Apply Intelligence (DECISION)

Clean data and reliable pipelines enable intelligent decisions. This is where AI has the highest-leverage impact: risk models that learn from outcomes, compliance checks that adapt to new regulations, fraud detection that catches novel patterns. The organization moves from "rules someone wrote years ago" to "models that improve continuously."

**What it looks like:** Data scientists are deploying models alongside existing rules. A/B testing compares AI decisions to legacy logic. Explainability is built in from the start because regulators require it.

### Level 4: Build New Experiences (ACTION)

The capstone. With a solid AI foundation, the organization creates customer-facing capabilities that were previously impossible: AI-generated disclosures tailored to jurisdiction and reading level, personalized communications, intelligent payment routing, real-time dashboards that predict rather than just report. These are the new products and interfaces that accomplish the business goals.

**What it looks like:** Product teams are shipping features that directly compete in the market. The AI readiness work from levels 1-3 is invisible to customers — they just experience a dramatically better product.

---

## Pattern Narratives

Each integration pattern tells a different organizational story about how the same data model transformations get implemented. The data changes are identical — only the approach differs.

### Embedded Replacement: "Improving What Exists"

The organization uses AI-accelerated development to fix logic inside existing brownfield applications. Each node is replaced in place: the old service stays, its internal logic changes. This is the highest-governance, highest-impact path.

**Story arc:** "We looked at our 55 services and said: these rules are brittle. We're going to replace them, one by one, with AI-powered logic. The service boundaries stay the same. The APIs stay the same. But inside, hardcoded rules become learned models, static templates become generative pipelines, manual classifications become ML classifiers."

**What the viewer sees:** A single sphere where amber nodes flip to green one at a time. Each conversion represents a service whose internal logic has been modernized. The team structure (pillared or squads) determines how fast and how many nodes convert per cycle.

### Connected Moons: "Building Alongside, Connected by Contracts"

The organization builds a new AI platform (the "moon") that orbits the brownfield system and exchanges data with it. Both systems evolve simultaneously. This requires integration work: the old system must update its APIs to emit data the new moon can consume, and accept processed data back.

**Story arc:** "We don't want to touch the old system's logic — that's a minefield of accumulated complexity. Instead, we build a new platform alongside it. The old system sends us raw data through new API endpoints, we process it with AI, and we send enriched results back. The old system is still the system of record, but the intelligence lives in the moon."

**Integration work detail:** For each node in the brown sphere, the Connected Moons pattern defines:
- **What the old system emits:** The data bundle it needs to serialize and send to the moon via a new API endpoint
- **What the old system receives back:** The enriched result the moon returns after AI processing
- **What API changes are needed:** The specific endpoint or contract that must be built on the old system

Not every node requires direct API integration. Infrastructure nodes (cache-layer, rate-limiter, load-balancer) support the integration infrastructure rather than having their own data exchange contracts.

**What the viewer sees:** Two spheres — the brown system of record and the green AI moon — connected by animated data flow arcs. The brown sphere converts nodes (improving its API surface), while the green moon grows nodes (building AI capabilities). The data flow arcs represent the API contracts between them.

### Independent Moons: "Starting Clean for Specific Outcomes"

The organization builds fully separate AI-powered systems that own specific outcomes independently. No connection to the brownfield. No integration work. Clean boundaries, fast iteration.

**Story arc:** "We're not going to fix the old system. We're not going to integrate with it. We're going to build new platforms from scratch that handle specific outcomes end-to-end. The old system keeps running for everything else. Over time, traffic migrates naturally as the new platforms prove their value."

**What the viewer sees:** The brown sphere stays entirely amber — unchanged. Two green moons grow independently on the other side of a dashed "NO CONNECTION" boundary. Each moon represents a self-contained AI platform being built from scratch.

---

## Progressive Disclosure

The visualization supports drill-down into the specifics of each node's data model transformation. This uses a progressive disclosure pattern — the top-level view shows the animated sphere constellation; clicking into details reveals the before/after data model at each stage.

### Side Panels (Replaces Debug Panels)

The raw REMAINING/CONVERTED debug panels (foreignObject with index arrays) are replaced with **stage-grouped, clickable node lists** rendered as proper React DOM elements positioned over the SVG.

**Layout:**

```
┌──────────┐                              ┌──────────┐
│ REMAINING│     ┌──────────────────┐      │CONVERTED │
│          │     │                  │      │          │
│ INTAKE   │     │   3D Sphere      │      │ INTAKE   │
│  ▸ node  │     │   Animation      │      │  ✓ node  │
│  ▸ node  │     │                  │      │  ✓ node  │
│          │     │                  │      │          │
│ TRANSFORM│     │                  │      │ TRANSFORM│
│  ▸ node  │     │                  │      │  ✓ node  │
│  ▸ node  │     └──────────────────┘      │          │
│          │                               │          │
│ DECIDE   │     ┌──────────────────┐      │          │
│  ▸ node  │     │ INTAKE 8/13 │ .. │      │          │
│  ▸ node  │     └──────────────────┘      │          │
│          │                               │          │
│ ACT      │                               │          │
│  ▸ node  │                               │          │
└──────────┘                               └──────────┘
```

Each node entry shows its label. Nodes being actively worked on (blue halo in the sphere) pulse in the panel. Nodes move from REMAINING to CONVERTED as they complete.

### Detail Drawer

Clicking any node name in the side panels opens a **slide-out detail drawer** from the right edge of the screen. The drawer is a React DOM element (not SVG foreignObject) to support proper scrolling, fonts, and interaction.

**Drawer contents:**

```
┌─────────────────────────────────────┐
│ ✕ CLOSE                            │
│                                     │
│ risk-scoring          [DECISION]    │
│ ─────────────────────────────────── │
│                                     │
│ BEFORE                              │
│ ┌─────────────────────────────────┐ │
│ │ Rules-based risk score using    │ │
│ │ hardcoded thresholds            │ │
│ │                                 │ │
│ │ IN:  credit_score: number       │ │
│ │      income: number             │ │
│ │      debt_ratio: number         │ │
│ │                                 │ │
│ │ OUT: risk_tier: enum            │ │
│ │      risk_score: number         │ │
│ │                                 │ │
│ │ LOGIC: If credit_score > 720... │ │
│ │                                 │ │
│ │ ⚠ Static thresholds miss       │ │
│ │   nuance. Manual updates lag... │ │
│ └─────────────────────────────────┘ │
│                                     │
│ AFTER                               │
│ ┌─────────────────────────────────┐ │
│ │ ML model scoring with explain-  │ │
│ │ able feature importance         │ │
│ │                                 │ │
│ │ IN:  credit_score: number       │ │
│ │      income: number             │ │
│ │      debt_ratio: number         │ │
│ │    + behavioral_signals: object │ │
│ │    + market_context: object     │ │
│ │                                 │ │
│ │ OUT: risk_tier: enum            │ │
│ │      risk_score: number         │ │
│ │    + feature_importance: object │ │
│ │    + confidence: number         │ │
│ │    + explanation: string        │ │
│ │                                 │ │
│ │ LOGIC: Gradient-boosted model...│ │
│ │                                 │ │
│ │ ✦ 20% better default predict-  │ │
│ │   ion. Auditable explanations.. │ │
│ └─────────────────────────────────┘ │
│                                     │
│ PATTERN: Connected Moons            │
│ ┌─────────────────────────────────┐ │
│ │ Old risk service sends appli-   │ │
│ │ cant data to AI moon, receives  │ │
│ │ enriched risk result back.      │ │
│ │                                 │ │
│ │ API EMITS:                      │ │
│ │   applicant_bundle: object      │ │
│ │                                 │ │
│ │ API RECEIVES:                   │ │
│ │   ml_risk_result: object        │ │
│ │                                 │ │
│ │ INTEGRATION WORK:               │ │
│ │ Add /api/v2/risk-assess end-    │ │
│ │ point; serialize applicant ctx  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

New fields (marked `isNew: true`) display with a `+` prefix and a highlighted color to make additions visually obvious.

The pattern narrative section updates automatically when the user switches integration patterns via the control buttons. The before/after data model stays the same — only the pattern section changes.

### Stage Progress Bar

A horizontal bar below the SVG visualization showing per-stage conversion progress:

```
INTAKE 8/13 ████████░░░░░ │ TRANSFORM 3/13 ████░░░░░░░░░ │ DECIDE 0/15 ░░░░░░░░░░░░░ │ ACT 0/14 ░░░░░░░░░░░░░
```

Each stage segment uses a subtle color tint. Completed stages show a checkmark. The active stage (the one currently being converted) pulses.

### Connected Moons Data Flow Annotations

When a node is selected in the Connected Moons view, the DataFlowArc between the brown sphere and green moon highlights and shows annotation labels with the specific data being exchanged for that node:

```
         { applicant_bundle } →
  ○ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ ◉
         ← { ml_risk_result }
```

When no node is selected, the arcs revert to their generic animated appearance.
