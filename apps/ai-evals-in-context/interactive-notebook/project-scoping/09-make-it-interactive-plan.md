# Plan: Workshop Flow — AI Evaluation Walkthrough

## Context

The application has a 5-phase SDLC narrative flow (`/` → `/problem` → `/phase/1`…`/phase/5` → `/governance`) aimed at PMs and business stakeholders. The interactive notebook (`ai_eval_workshop.ipynb`) tells a complementary technical story — building, validating, and improving AI evaluation pipelines — but has no web presence.

This plan adds a second narrative journey at `/workshop/…` that walks through the notebook's content across 5 stages. Content will be narrative summaries (~500-800 words per stage) with illustrative code snippets, not literal notebook transcriptions.

## Stage Mapping

| Stage | URL | Notebook Sections | Short Title | Theme |
|-------|-----|-------------------|-------------|-------|
| Landing | `/workshop` | Cell 0 intro | Workshop | Overview + 5-stage map |
| 1 | `/workshop/1` | Sections 1-2 | Foundation | RAG pipeline, generic metrics, custom metrics |
| 2 | `/workshop/2` | Section 3 | Acceptance | Golden dataset, positive/negative examples |
| 3 | `/workshop/3` | Sections 4-5 | Validation | IRR, Cohen's kappa, multi-rater dynamics, Fleiss' kappa, calibration |
| 4 | `/workshop/4` | Sections 6-7 | Improvement | System prompt v1→v2, judge v1→v2, golden regression, dual improvement loops |
| 5 | `/workshop/5` | Appendices A-C | Reporting | Multi-turn threads, trace validation, TSR with prompt traceability + PR acceptance |

**Current notebook state (95 cells):** Section 5 has expanded narrative interpretation cells (reading annotations, pairwise kappa analysis, Fleiss' kappa motivation). Section 6 has explicit subsection headers (Steps 2-4). Appendix C includes prompt traceability (moved from Appendix B) and a CI/PR acceptance workflow. All evaluation calls now carry `prompt_version` via `metadata_extra`.

## Architecture

**Key insight**: The existing `base_narrative.html`, `phase_nav.html`, and `get_phase_context()` are parameterized by context variables (`phase`, `phases`, `phase_order`, `prev_phase`, `next_phase`). By creating a parallel `WORKSHOP_STAGES` dict and `WORKSHOP_ORDER` list — and passing them through the same context variable names — all base template logic (header, bottom nav, top nav) works without modification.

The one required nav component change: `phase_nav.html` line 17 skips `landing` in the nav bar. Add `workshop_landing` to that skip list.

## Implementation Steps

### Step 1: Data model + routes (`viewer/narrative.py`)

Add after the existing `PHASE_ORDER` list:

```python
WORKSHOP_STAGES = {
    "workshop_landing": {
        "id": "workshop_landing", "number": 0,
        "title": "AI Evaluation Workshop",
        "subtitle": "Building Trust in Automated Judgment",
        "short_title": "Workshop", "url": "/workshop",
        "next": "workshop_1", "prev": None,
    },
    "workshop_1": {
        "id": "workshop_1", "number": 1,
        "title": "Foundation: RAG Pipeline & Metrics",
        "subtitle": "Assertions, deepeval, and Custom Domain Metrics",
        "short_title": "Foundation", "url": "/workshop/1",
        "next": "workshop_2", "prev": "workshop_landing",
    },
    "workshop_2": {
        "id": "workshop_2", "number": 2,
        "title": "Acceptance Criteria",
        "subtitle": "Golden Datasets with Positive and Negative Examples",
        "short_title": "Acceptance", "url": "/workshop/2",
        "next": "workshop_3", "prev": "workshop_1",
    },
    "workshop_3": {
        "id": "workshop_3", "number": 3,
        "title": "Validating the Validator",
        "subtitle": "Inter-Rater Reliability and Team Calibration",
        "short_title": "Validation", "url": "/workshop/3",
        "next": "workshop_4", "prev": "workshop_2",
    },
    "workshop_4": {
        "id": "workshop_4", "number": 4,
        "title": "Improvement Loops",
        "subtitle": "Pipeline and Judge Refinement Cycles",
        "short_title": "Improve", "url": "/workshop/4",
        "next": "workshop_5", "prev": "workshop_3",
    },
    "workshop_5": {
        "id": "workshop_5", "number": 5,
        "title": "Production & Reporting",
        "subtitle": "Multi-Turn, Traces, and Test Summary Reports",
        "short_title": "Reporting", "url": "/workshop/5",
        "next": None, "prev": "workshop_4",
    },
}

WORKSHOP_ORDER = [
    "workshop_landing", "workshop_1", "workshop_2",
    "workshop_3", "workshop_4", "workshop_5",
]
```

Add `get_workshop_context(stage_id)` — identical to `get_phase_context` but reads from `WORKSHOP_STAGES` / `WORKSHOP_ORDER`. Uses the same context key names (`phase`, `phases`, `phase_order`, `prev_phase`, `next_phase`) so base templates work unchanged.

Add 6 route functions (`workshop_landing`, `workshop_1`…`workshop_5`). Stages 1-5 all use a shared `workshop_stage.html` template. The workshop landing uses `workshop_landing.html`.

### Step 2: Nav component (`templates/components/phase_nav.html`)

Line 17 change:
```jinja2
{% if phase_id not in ['landing', 'workshop_landing'] %}
```

### Step 3: Templates

**`templates/narrative/workshop_landing.html`** — Extends `base_narrative.html`. Custom hero block with "Start the Workshop" CTA. `phase_content` block shows 5 stage overview cards (reuse `.phase-card` pattern). Bottom nav links to stage 1.

**`templates/narrative/workshop_stage.html`** — Extends `base_narrative.html`. Overrides `phase_header` to say "Stage N" instead of "Phase N". `phase_content` block renders `{{ content | safe }}` inside `.narrative-content.narrative-content--narrow`. Minimal template — markdown carries the content.

### Step 4: Markdown content (`data/narrative/`)

6 new files, each ~500-800 words of adapted narrative from the notebook:

| File | Content Source |
|------|---------------|
| `workshop_landing.md` | Notebook cell 0 intro: key insight (governance as accelerator), section-to-stage mapping table, what you'll build at each stage, prerequisites |
| `workshop_1_foundation.md` | Sections 1-2: RAG pipeline (ChromaDB + Claude), deepeval assertions vs unit tests mapping table, generic metrics (faithfulness, relevancy, contextual precision/recall), the gap — faithful but non-compliant responses, GEval custom metrics (regulatory compliance with 5 evaluation steps, actionability), tribal knowledge encoding |
| `workshop_2_acceptance.md` | Section 3: golden dataset as living acceptance criteria, 8 positive + 4 negative mortgage examples, human annotation workflow (collect → generate → rate → discuss → lock), pass-rate separation analysis, transition: "metrics look good — but do they agree with humans?" |
| `workshop_3_validation.md` | Sections 4-5: medical diagnostic analogy (sensitivity/specificity → kappa), 20 simulated traces (7 clear pass, 5 clear fail, 8 borderline), Cohen's kappa computation and interpretation, confusion matrix patterns (too strict vs too lenient). Then multi-rater: product vs compliance vs LLM judge tension, reading annotation patterns (compliance as systematic outlier), pairwise kappa interpretation, Fleiss' kappa for team calibration, agreement-to-action mapping table, calibration sessions |
| `workshop_4_improvement.md` | Sections 6-7: improvement loop (diagnose → improve → re-evaluate → compare), Step 1 diagnosis from metric failures, Step 2 system prompt v1→v2 (added numbered rules, explicit prohibitions, required disclaimer), Step 3 re-evaluation on original scenarios, Step 4 golden dataset regression test (12 examples × 2 versions). Then judge improvement: regulatory_compliance v2 evaluation steps (distinguish general eligibility from personal guarantees), re-measured kappa. Key insight: two parallel loops reinforce each other |
| `workshop_5_reporting.md` | Appendices A-C: multi-turn conversations via LangSmith threads (what transfers vs what's new), trace validation (version diffs, hierarchy verification, golden dataset query). TSR as acceptance artifact: JSON with `pull_request` context + `prompts` (full text of system prompt and judge steps for both versions) + `failure_modes_identified` + `regressions_introduced` + `acceptance` recommendation. Prompt traceability (manual metadata vs Prompt Hub tradeoffs). CI integration sketch (generate TSR → jq gate → artifact upload). Audit trail over merged PRs |

### Step 5: Landing page update (`templates/narrative/landing.html`)

Replace the single CTA (lines 20-23) with a dual-CTA group:

```html
<div class="landing-cta-group">
  <a href="{{ url_for('narrative.problem') }}" class="landing-cta">
    SDLC Journey <span>&rarr;</span>
  </a>
  <a href="{{ url_for('narrative.workshop_landing') }}" class="landing-cta landing-cta--workshop">
    Eval Workshop <span>&rarr;</span>
  </a>
</div>
```

### Step 6: CSS (`static/css/design-system.css`)

Add `.landing-cta-group` (flex row with gap) and `.landing-cta--workshop` (alternate accent color, e.g. indigo `#6366f1`).

### Step 7: Playwright tests (`tests/playwright/test_workshop.py`)

New test file:

- **TestWorkshopPageLoads**: Landing loads with stage cards; parametrized test for stages 1-5
- **TestWorkshopNavigation**: Landing has start CTA; linear forward nav through all 5 stages; backward nav from stage 5
- **TestWorkshopStageContent**: Stage 1 mentions "RAG"/"retrieval"; Stage 3 mentions "kappa"/"inter-rater"; Stage 5 mentions "TSR"/"test summary report"
- **TestLandingToWorkshop**: Main landing has workshop link; clicking it navigates to `/workshop`

### Step 8: E2E + steel thread tests

**`tests/e2e/test_workshop_routes.py`**: Flask client tests — all 6 workshop URLs return 200, landing contains links to all stages.

**`tests/steelthread/test_narrative_steel_thread.py`**: Add `TestWorkshopJourneyLocal` class — workshop landing has start CTA, all 5 stages accessible with >500 chars content.

### Step 9: Affordances update (`.claude/affordances.md`)

Add 7 new Places (workshop landing + 5 stages + the shared template), new UI affordances for workshop nav and dual CTA, and wiring entries.

## Files Modified/Created

| File | Action |
|------|--------|
| `ai-testing-resource/viewer/narrative.py` | **Modify** — add WORKSHOP_STAGES, WORKSHOP_ORDER, get_workshop_context(), 6 routes |
| `ai-testing-resource/templates/components/phase_nav.html` | **Modify** — add `workshop_landing` to skip filter |
| `ai-testing-resource/templates/narrative/workshop_landing.html` | **Create** — workshop entry page |
| `ai-testing-resource/templates/narrative/workshop_stage.html` | **Create** — shared stage template |
| `ai-testing-resource/templates/narrative/landing.html` | **Modify** — dual CTA |
| `ai-testing-resource/static/css/design-system.css` | **Modify** — `.landing-cta-group`, `.landing-cta--workshop` |
| `ai-testing-resource/data/narrative/workshop_landing.md` | **Create** |
| `ai-testing-resource/data/narrative/workshop_1_foundation.md` | **Create** |
| `ai-testing-resource/data/narrative/workshop_2_acceptance.md` | **Create** |
| `ai-testing-resource/data/narrative/workshop_3_validation.md` | **Create** |
| `ai-testing-resource/data/narrative/workshop_4_improvement.md` | **Create** |
| `ai-testing-resource/data/narrative/workshop_5_reporting.md` | **Create** |
| `ai-testing-resource/tests/playwright/test_workshop.py` | **Create** |
| `ai-testing-resource/tests/e2e/test_workshop_routes.py` | **Create** |
| `ai-testing-resource/tests/steelthread/test_narrative_steel_thread.py` | **Modify** — add workshop tests |
| `.claude/affordances.md` | **Modify** — add workshop entries |

## Verification

1. **Unit + E2E tests** (no Docker needed):
   ```bash
   cd ai-testing-resource && source .venv/bin/activate
   python3 -m pytest tests/unit/ tests/e2e/ -v
   ```
   New `test_workshop_routes.py` runs here — all 6 URLs return 200.

2. **Playwright tests** (Docker needed):
   ```bash
   export $(grep -v '^#' .env | xargs)
   docker compose up -d --build
   # Wait for healthy
   python3 -m pytest tests/playwright/test_workshop.py --base-url http://localhost:5001 -v
   python3 -m pytest tests/steelthread/ --base-url http://localhost:5001 -v
   docker compose down
   ```
   Verifies page loads, navigation, content presence, and landing→workshop entry path.

3. **Manual smoke test**: Visit `http://localhost:5001/workshop` and click through all 5 stages. Verify nav bar shows workshop stages (not SDLC phases), prev/next links work, and content renders.

4. **Lint**:
   ```bash
   black viewer/narrative.py tests/playwright/test_workshop.py tests/e2e/test_workshop_routes.py
   flake8 --exclude .venv,__pycache__ --max-line-length 120 viewer/ tests/
   ```
