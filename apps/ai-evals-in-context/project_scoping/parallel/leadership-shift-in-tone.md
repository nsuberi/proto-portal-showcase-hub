# Plan: Phase 3 "Build and Test" Redesign + Site-Wide Narrative Voice Reframing

## Context

The site's narrative needs to shift to the voice of a **head of engineering and head of product jointly addressing PMs and BAs who are newly able to write code**. The core message: "This is not new -- the SDLC has existed for a long time, the best senior engineers all follow it, and having clear structure for how to create a TSR and how it fits into the rituals of the company is how we unlock fast experimentation and risk-control." Phase 3 "Build" gets renamed to "Build and Test" everywhere, and its content gets redesigned using `sdlc_governance.jsx` as inspiration. Card content is adapted for the PM/BA audience (not verbatim from JSX). Voice changes apply to **all pages**.

---

## Part A: Phase 3 Redesign (structural changes)

### A1. Add SDLC test data model to `viewer/narrative.py`

Add `SDLC_TESTS` list and `SDLC_ROLES` dict near the top of the file. Content adapted from `sdlc_governance.jsx` TESTS array (lines 3-88) but rewritten for a PM/BA audience:

- **8 test types**: Unit, Integration, E2E, Performance, Acceptance, Steel Thread, AI Acceptance, AI Evals
- Each has: `id`, `name`, `icon`, `color`, `category` (traditional/evolved/new), `description`, `sdlc_role`, `who_creates`, `who_validates`, `ai_considerations`, `audit_value`
- All text fields adapted to be understandable by PMs/BAs without deep engineering context (e.g. explain *why* each test matters for the product, not just the technical mechanics)
- `SDLC_ROLES` maps abbreviations (DEV, TL, QA, PO, SRE, GOV, BIZ) to names and colors

### A2. Rename "Build" to "Build & Test" in PHASES dict (`viewer/narrative.py`)

- `short_title`: "Build" → "Build & Test"
- `title`: "Building with AI" → "Building and Testing with AI"
- `subtitle`: "Test Types as the Path to Quality" → "The SDLC Test Types That Senior Engineers Already Use"
- Route docstring updated

### A3. Simplify `phase_3()` route (`viewer/narrative.py`)

Remove dependencies on `TEST_TYPES`, `get_explanation()`, `all_type_explanations`, `business_facing_types`. Instead pass `sdlc_tests=SDLC_TESTS` and `sdlc_roles=SDLC_ROLES` to the template.

### A4. Rewrite Phase 3 template (`templates/narrative/phase3_implementation.html`)

Replace the current AI eval banner + flat card grid with:

- **Joint leadership statement banner** (`.sdlc-statement`) -- prose block framing test types as established SDLC practice
- **Filter buttons** (`.sdlc-filter`) -- All / Traditional SDLC / New for AI Era (minimal JS)
- **Expandable SDLC cards** (`.sdlc-card`) -- Click to expand, mirroring `sdlc_governance.jsx` layout:
  - **Collapsed**: icon, name, badge (TRADITIONAL / EVOLVED FOR AI / NEW FOR AI ERA), description, role tag previews (DEV → TL), chevron
  - **Expanded**: two-column grid -- Left: "Role in the SDLC" + "AI-Era Considerations" (amber box). Right: "Audit & Standardization Value" + "Who Creates" + "Who Validates" (colored role tags)
- **Inline JS** (~25 lines) for card expand/collapse toggle and filter show/hide

### A5. Add CSS to `static/css/design-system.css`

New BEM section for `.sdlc-statement`, `.sdlc-filter`, `.sdlc-card`, `.sdlc-role-tag` classes. ~150 lines following existing design system patterns. Responsive grid at 768px breakpoint.

### A6. Update rainbow arc SVG (`templates/components/rainbow_arc.html`)

Line 23: Change single-line "Build" to two-line `<tspan>` layout ("Build" / "& Test"), following the existing pattern for "Iterate & Approve" and "Deploy & Monitor".

---

## Part B: Site-Wide Narrative Voice + Substantive Content from Resource Docs

Voice: Head of Engineering + Head of Product, addressing PMs/BAs who are new to building. Core themes:
- "This is not new -- the SDLC has always existed"
- "The best senior engineers already follow this"
- "TSR structure + company rituals = fast experimentation + risk control"
- "You bring domain expertise; the SDLC is the bridge to production"

In addition to voice changes, we incorporate **specific frameworks, tables, and examples** from the four narrative-resources documents to add substantive context.

### B1. Landing page (`templates/narrative/landing.html`)

**Voice changes:**
- **Hero subtitle** (lines 11-15): Reframe to directly address PMs/BAs -- "Welcome to the SDLC. This structure is not new..."
- **Phase 3 card** (line 163): "Build" → "Build &amp; Test", updated description
- **Builder bridge** (lines 129-136): "These are not new requirements invented for AI..."
- **Guiding principle quote** (lines 63-69): "The SDLC is not bureaucracy..."

**Reframe "The Three-Part Framework" section** (lines 27-60): The current "Governance / Approvals / Business Value" cards use vague titles. Rename and reframe the whole section under the headline **"Design with the End in Mind"**:
1. **Governance Process & Requirements** (was "Governance") -- Establish the rituals: acceptance criteria agreement, test review sessions, TSR checkpoints. These are how builders and approvers develop shared confidence.
2. **Approval Stakeholders & Rituals** (was "Approvals") -- Know who approves and when. When teams know what "done" looks like from Day 1, the path to go/no-go is predictable. Approvals accelerate delivery, they don't block it.
3. **Business Value of Your Work** (was "Business Value") -- The TSR ties test results back to requirements so stakeholders always know where things stand. Is the juice worth the squeeze?

**New substantive content from resource docs:**
- Add **"What the SDLC Protects" (4 pillars)** from `sdlc_what_it_is.docx` -- Security, Trust, Reliability, Solving real problems -- as a visual section below the three-part framework. These 4 pillars give substance to *why* governance matters.
- Add the **"IS vs IS NOT" table** (Perspective Three / non-engineers) from `sdlc_what_it_is.docx` as a **top-level visible section** (NOT collapsible) below the builder bridge. This directly addresses PM/BA anxieties and should be immediately readable.

### B2. Landing page markdown (`data/narrative/landing.md`)

Rewrite with joint leadership voice. Incorporate the **"What we ask of you"** message from `sdlc_what_it_is.docx`: "Bring your domain expertise... The SDLC is not the obstacle between your code and production. It is the bridge."

### B3. Problem page markdown (`data/narrative/problem.md`)

Add framing paragraph: "This is a scenario your team will recognize..." The business challenge content stays mostly intact.

### B4. Phase 1 markdown files (`data/narrative/phase1_*.md`)

- **phase1_interview.md**: Keep dialogue as-is
- **phase1_requirements.md**: Add framing about SDLC artifact
- **phase1_acceptance.md**: Add the **PM/BA/Engineering collaboration table** from `ai_evaluation_sdlc.docx` showing who does what at each stage (Define job → Error analysis → Changes → TSR → Monitoring → Communicate). This is the single most powerful addition for the PM/BA audience -- it shows them exactly where they fit.

### B5. Phase 1 template (`templates/narrative/phase1_interview.html`)

Add a new collapsible section after Acceptance Criteria: **"Your Role in the SDLC"** containing the collaboration table (B4 above).

### B6. Phase 2 markdown (`data/narrative/phase2_testing.md`)

Rewrite "Key Insight" to reinforce established practice. Add:
- **Risk Tiering table** (Tier 1/2/3) from `ai_evaluation_sdlc.docx` -- shows how governance scales by risk level (Low/Medium/High), what TSR depth required, who reviews. This is critical context for PMs deciding how much process to apply.
- **TSR Structure overview** (7 sections) from `ai_evaluation_sdlc.docx` -- preview of what the TSR contains, so PMs understand where the journey is heading.

### B7. Phase 3 intro markdown (`data/narrative/phase3_intro.md`)

Full rewrite with "this is the vocabulary you need" framing.

### B8. Phase 3 template -- additional content beyond card redesign

Within the redesigned Phase 3 (Part A), add:
- **Error Analysis Failure Mode Taxonomy** (8 types) from `ai_evaluation_sdlc.docx` as a new section below the test cards. Table: Hallucination, Scope Violation, Tone Mismatch, Edge Case Failure, Inconsistency, Bias/Fairness, Performance Degradation, Drift -- with "What It Looks Like" and "Root Cause Category" columns. This gives the test types concrete meaning by showing *what they catch*.
- **Connect to the Open/Axial coding methodology** already implemented in Phase 4: Explain that in Phase 4 (Iterate & Approve), these failure modes become **axial codes** -- the category labels that enable quantification across traces. Each trace annotation has an **open code** (free-text observation specific to one trace, e.g. "Price stated as $349, actual is $299") and an **axial code** (the category label, e.g. "Factual Hallucination"). This bridges Phase 3's vocabulary with Phase 4's methodology. Reference the existing `AXIAL_CODES` dict in `viewer/trace_inspector.py` as the system's current axial code inventory.
- Note: The 8 failure mode types from the resource doc are a superset of the 6 axial codes currently in the system (`length_violation`, `prompt_issue`, `hallucination`, `missing_source`, `accurate_answer`, `correct_retrieval`). The taxonomy on Phase 3 shows the *full landscape*; Phase 4 demonstrates a working subset applied to real traces.

### B9. Phase 4 intro markdown (`data/narrative/phase4_intro.md`)

Reframe: "Iteration is how experienced engineers have always shipped quality software..."

Reinforce the **Open Code → Axial Code methodology** already visible on the page: The intro should explain that the trace annotations below use a two-level coding scheme -- open codes (free-text observations) get categorized into axial codes (standardized categories that can be counted). This quantification is what turns subjective quality assessment into objective evidence for the TSR. Reference Husain & Shankar as the methodology source (already cited in the template).

Add: the **week-by-week practical workflow** (4 weeks) from `appendix_trace_capture.docx` as context for what the iteration cycle looks like in practice:
- Week 1: Trace collection
- Week 1-2: Error analysis in review interface (open coding -- annotating traces with free-text observations)
- Week 2: Failure taxonomy and counting (axial coding -- categorizing observations into quantifiable codes)
- Week 2-3: Fix → Test → Document (axial code counts become the "money table" in TSR Section 3)

### B10. Phase 4 template (`templates/narrative/phase4_evaluation.html`)

- Line 4: Update title for consistency with short_title
- Add collapsible **"Trace Review to TSR Mapping"** table from `appendix_trace_capture.docx` showing how trace review outputs (pass/fail annotations, failure taxonomy, counts, etc.) flow into TSR sections. This connects the trace inspector the user is looking at to the governance artifact.

### B11. Phase 5 intro markdown (`data/narrative/phase5_intro.md`)

Reframe monitoring as established practice. Add introduction to the **four-quadrant diagnostic framework**.

### B12. Phase 5 template (`templates/narrative/phase5_monitoring.html`)

Replace the current generic "Production Metrics" content with substantive content from `appendix_b_unified_monitoring.docx`:

- **Four-Quadrant Diagnostic Framework** (new section): Thriving / Product Problem / Hidden Debt / Active Crisis matrix with condition, action, and example for each quadrant. This is the most impactful monitoring addition -- it gives PMs a decision-making tool.
- **Product Engagement Metrics** table: DAU/MAU, adoption rate, task completion, retention, churn, NPS, CSAT -- replaces the current generic "Traditional Metrics" bullet list
- **AI Quality Metrics** table: Failure mode rate, pass rate, hallucination rate, guardrail triggers, user-flagged errors, latency, drift, evaluator agreement -- replaces current generic "AI-Specific Metrics" list
- **Product Review Cadence** table: Daily/Weekly/Bi-weekly/Monthly/Quarterly with audience, what's reviewed, decisions made -- gives PMs a concrete rhythm to follow
- **One concrete scenario** (e.g., "Hidden Debt" -- quality degrading while engagement stable) to make the framework tangible

### B13. Governance intro markdown (`data/narrative/governance_intro.md`)

Reinforce: "The TSR is how your organization documents that the SDLC was followed..."

Add: **TSR Structure (7 sections)** reference as a quick checklist if not already shown in Phase 2.

### B14. Governance template (`templates/narrative/governance_overview.html`)

- Update "Journey Complete" section to use "Build & Test" name and reinforce the "this is not new" message
- Add a collapsible **"Example TSR"** (Tier 2, document summarization) from `ai_evaluation_sdlc.docx` -- the complete worked example showing change summary, error analysis results, changes made, monitoring plan, go/no-go. This gives PMs a concrete model of what they're producing.

### B15. Phase 4 template title (`templates/narrative/phase4_evaluation.html`)

- Line 4: Update `{% block title %}Phase 4: Building AI Features{% endblock %}` → "Phase 4: Iterate & Approve"

---

## Part C: Test Updates

### C1. Modify existing tests (`tests/e2e/test_narrative_flow.py`)

- `test_phase3_includes_test_type_cards` → assert `b"sdlc-card"` instead of `b"test-type-card"`
- `test_phase3_business_facing_badge` → assert `b"TRADITIONAL"` and `b"NEW FOR AI ERA"` instead of `b"Business-Facing"`
- `test_landing_phase_cards_updated` → update `b"Build"` assertion to `b"Build &amp; Test"` or `b"Build"`
- Keep: `test_phase3_no_code_section`, `test_phase3_ai_acceptance_card`
- `test_phase3_responsibility_note` → update if responsibility note moves into sdlc-statement

### C2. Add new tests

- `test_phase3_sdlc_filter_buttons` -- assert `b"sdlc-filter"` present
- `test_phase3_sdlc_role_tags` -- assert `b"sdlc-role-tag"` present
- `test_phase3_traditional_badge` -- assert `b"TRADITIONAL"` present
- `test_phase3_ai_era_badge` -- assert `b"NEW FOR AI ERA"` present
- `test_phase3_sdlc_statement` -- assert `b"sdlc-statement"` present

---

## Part D: Housekeeping

### D1. Update affordances (`.claude/affordances.md`)

Add new UI/code affordances for SDLC cards, filter, role tags, data models. Update wiring for phase_3() route.

---

## What is NOT changing structurally

- Phase 4 trace inspector, span visualization, version switching functionality
- Phase 5 live demo chatbot form/JS functionality
- Test Navigator (`/viewer/tests`) -- still uses `TEST_TYPES` and `get_explanation()`
- Existing `.test-type-card*` CSS (still used by Test Navigator)
- Route URLs (all paths stay the same)

## Summary of substantive content additions by page

| Page | New Content from Resource Docs |
|------|-------------------------------|
| Landing | 4 SDLC Pillars (Security/Trust/Reliability/Real Problems), IS vs IS NOT table |
| Phase 1 | PM/BA/Engineering collaboration table ("Your Role in the SDLC") |
| Phase 2 | Risk Tiering table (Tier 1-3), TSR Structure overview (7 sections) |
| Phase 3 | Expanded test cards with sdlcRole/aiConsiderations/auditValue/roles, Error Analysis Failure Mode Taxonomy (8 types) |
| Phase 4 | Week-by-week workflow, Trace Review → TSR mapping table |
| Phase 5 | Four-Quadrant Diagnostic Framework, Engagement Metrics table, AI Quality Metrics table, Review Cadence table, concrete scenario |
| Governance | Example TSR (Tier 2 worked example) |

## Implementation order

1. `SDLC_TESTS` + `SDLC_ROLES` data model in narrative.py (additive)
2. CSS additions to design-system.css (additive -- sdlc-card, sdlc-filter, sdlc-role-tag, quadrant-grid, etc.)
3. "Build" → "Build & Test" rename: PHASES dict, landing.html, rainbow_arc.html
4. All markdown files (voice + substantive content):
   - phase3_intro.md (full rewrite)
   - landing.md (voice + "what we ask of you")
   - problem.md (framing paragraph)
   - phase1_requirements.md, phase1_acceptance.md (framing + collaboration table)
   - phase2_testing.md (voice + risk tiering + TSR structure)
   - phase4_intro.md (voice + week-by-week workflow)
   - phase5_intro.md (voice + quadrant intro)
   - governance_intro.md (voice)
5. phase3_implementation.html full rewrite + phase_3() route update (same step) + failure mode taxonomy section
6. Landing page template (hero, builder bridge, 4 pillars, IS/IS NOT, phase card)
7. Phase 1 template (collaboration table section)
8. Phase 4 template (title, trace→TSR mapping collapsible)
9. Phase 5 template (quadrant framework, metrics tables, cadence, scenario)
10. Governance template (journey complete update, example TSR collapsible)
11. Test updates (modified + new assertions)
12. Lint (black + flake8) and run tests
13. Affordances update

## Verification

```bash
source .venv/bin/activate
black ai-testing-resource/viewer/narrative.py ai-testing-resource/tests/e2e/test_narrative_flow.py
flake8 --exclude .venv,__pycache__ --max-line-length 120 ai-testing-resource/viewer/narrative.py ai-testing-resource/tests/e2e/test_narrative_flow.py
python3 -m pytest tests/unit/ tests/e2e/ -v
```

Manual: Visit every page (`/`, `/problem`, `/phase/1` through `/phase/5`, `/governance`) to verify:
- "Build & Test" appears in nav, rainbow arc, landing cards, Phase 3 title
- Phase 3 expandable cards work with filter buttons and role tags
- Failure mode taxonomy table renders correctly on Phase 3
- Four-quadrant framework renders on Phase 5 with metrics tables
- Collaboration table appears on Phase 1
- Risk tiering and TSR structure appear on Phase 2
- Example TSR collapsible works on governance page
- Narrative voice is consistent across all pages (joint leadership tone, "this is not new" message)
- No broken links or missing content
