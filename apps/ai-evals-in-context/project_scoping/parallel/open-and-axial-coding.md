# Phase 4: AJAX Version Switching, Qualitative Coding Annotations, and TSR Updates

## Context

Phase 4 (Iterate & Approve) has two UX/content issues:
1. **Version selector causes scroll-to-top** — clicking V1/V2/V3 does a full page navigation via `<a href>`, unlike the trace sidebar which already uses AJAX
2. **Annotations lack structure** — currently shown as highlighted text + footnotes. User wants a proper "Annotations" section using Hamel Husain & Shreya Shankar's qualitative coding methodology (Open Coding = free text observations, Axial Coding = categorized labels for quantification)
3. **TSRs and seed scripts need to reference axial codes** — failure mode descriptions should cite specific axial code counts and percentages

The existing `type` field in trace annotations (e.g., `hallucination`, `length_violation`) IS the axial code identifier. The `text` field IS the open code. No trace data format change needed — just a new mapping and UI reframe.

---

## Step 1: Define AXIAL_CODES mapping (shared data model)

**File**: `ai-testing-resource/viewer/trace_inspector.py`

Add `AXIAL_CODES` dict and `get_annotation_summary()` function:

```python
AXIAL_CODES = {
    "length_violation": {"label": "Length Violation", "description": "Response length outside target range", "category": "format"},
    "prompt_issue": {"label": "Prompt Design Issue", "description": "System prompt causes undesirable behavior", "category": "design"},
    "hallucination": {"label": "Factual Hallucination", "description": "Model fabricates facts not in source data", "category": "accuracy"},
    "missing_source": {"label": "Missing Source Attribution", "description": "Response lacks KB citations", "category": "grounding"},
    "accurate_answer": {"label": "Verified Accurate", "description": "Information confirmed against KB", "category": "accuracy"},
    "correct_retrieval": {"label": "Correct Retrieval", "description": "RAG retrieved the relevant document", "category": "grounding"},
}

def get_annotation_summary() -> dict:
    """Count each axial code per version for the summary table."""
    # Returns {"v1": {"length_violation": 20, ...}, "v2": {...}, "v3": {...}}
```

This is the single source of truth used by Python templates, JS (via API), seed scripts, and TSR generation.

---

## Step 2: New API endpoints

**File**: `ai-testing-resource/viewer/narrative.py`

### 2a: Version switch endpoint
`GET /api/phase4/version/<version>` → returns JSON with:
- `version`, `traces`, `selected_trace_id`, `trace_detail`, `annotated_response`, `has_spans`
- `failure_modes`, `arch_context`
- `annotation_summary` (all 3 versions)
- `axial_codes` (the mapping)

### 2b: Axial codes reference endpoint
`GET /api/phase4/axial-codes` → returns `{axial_codes: {...}, summary: {...}}`

Also update the `phase_4()` route to pass `axial_codes` and `annotation_summary` to the template context.

---

## Step 3: Template changes

**File**: `ai-testing-resource/templates/narrative/phase4_evaluation.html`

### 3a: Version tabs → buttons with AJAX
Replace `<a href="...">` links (lines 107-118) with `<button onclick="switchVersion('v1')" data-version="v1">` elements.

### 3b: Add `id` attributes to version-dependent sections
- `id="failure-mode-section"` on failure mode panel wrapper
- `id="arch-context-section"` on architecture context wrapper
- `id="trace-sidebar-section"` on trace sidebar div

### 3c: Methodology definitions + annotation summary table
Add above the trace inspector section:
- Brief definition block explaining **Annotation**, **Open Coding** (free text — specific observation), **Axial Coding** (category label — enables quantification)
- Cross-version summary table showing counts and percentages of each axial code for V1, V2, V3

### 3d: Redesign annotations section in trace detail
Replace the footnotes (lines 173-186) with a structured "Annotations" section:
- Each annotation shows an **axial code tag** (badge) + **open code text** (description)
- Styled with severity colors (error=red, warning=orange, success=green, info=blue)

---

## Step 4: CSS additions

**File**: `ai-testing-resource/static/css/design-system.css`

New BEM classes:
- `.annotations-section`, `.annotations-section__title`, `.annotations-section__methodology`
- `.annotation-item`, `.annotation-item--{severity}`, `.annotation-item__axial-code` (tag/badge), `.annotation-item__open-code` (text)
- `.annotation-summary`, `.annotation-summary__table`
- `.methodology-definitions` (for the term definitions block)

---

## Step 5: JavaScript — AJAX version switching + annotation rendering

**File**: `ai-testing-resource/static/js/viewer.js`

### 5a: `switchVersion(version)` function
Replace stub at line 66. Pattern matches existing `switchTrace()`:
1. Optimistic UI: update version tab active state
2. `fetch(appUrl('/api/phase4/version/${version}'))`
3. Call render helpers for each section
4. `pushState` for back button support

### 5b: New render helpers
- `renderFailureModes(failureModes, version)` → into `#failure-mode-section`
- `renderArchitectureContext(archContext, version)` → into `#arch-context-section`
- `renderTraceSidebar(traces, selectedTraceId, version)` → into `#trace-sidebar-section`

### 5c: Update `renderTraceDetail()` (line 328)
Replace `renderAnnotationFootnotes(...)` call with new `renderAnnotations(annotations, axialCodes)` that shows axial code tags + open code text.

### 5d: Fetch AXIAL_CODES on page load
Store globally for use by render functions. Fetch from `/api/phase4/axial-codes` on DOMContentLoaded.

### 5e: Update popstate handler
Handle both `event.state.version` and `event.state.traceId`.

---

## Step 6: Update seeding scripts and TSR data

### 6a: `scripts/generate_traces.py`
- Import `AXIAL_CODES` from `viewer.trace_inspector`
- Add comments in `build_v1_trace()`, `build_v2_trace()`, `build_v3_trace()` documenting axial code usage
- Add validation in `main()` that all annotation `type` values exist in `AXIAL_CODES`

### 6b: `scripts/seed_test_data.py`
- Import `AXIAL_CODES` and `get_annotation_summary`
- Update `create_sample_eval_iterations()` failure mode descriptions to cite axial code counts:
  - V1: "20/20 traces flagged with 'Length Violation'. Average 310 words vs 80-word target."
  - V2: "N hallucinations across 20 traces flagged as 'Factual Hallucination'. Model fabricates prices, specs, policies."
  - V2 (additional): "20/20 traces flagged with 'Missing Source Attribution'."

### 6c: `viewer/iteration_timeline.py`
- Import `AXIAL_CODES`
- Update `FAILURE_MODES` dict descriptions to reference axial code labels

---

## Verification

1. **Unit + E2E tests**: Run `python3 -m pytest tests/unit/ tests/e2e/ -v`
2. **Manual testing**:
   - Navigate to Phase 4, click V1→V2→V3 — page should NOT scroll to top
   - Verify failure modes, architecture context, trace sidebar all update
   - Verify back button navigates between versions
   - Verify annotation section shows axial code tags + open code text
   - Verify summary table shows counts/percentages for all 3 versions
3. **Lint**: `black` then `flake8` on all changed files
4. **New E2E tests**: Test `/api/phase4/version/<v>` and `/api/phase4/axial-codes` endpoints

## Critical files to modify
- `ai-testing-resource/viewer/trace_inspector.py` — AXIAL_CODES, get_annotation_summary()
- `ai-testing-resource/viewer/narrative.py` — new API endpoints, updated phase_4() context
- `ai-testing-resource/viewer/iteration_timeline.py` — updated FAILURE_MODES descriptions
- `ai-testing-resource/templates/narrative/phase4_evaluation.html` — buttons, ids, annotations section, summary table
- `ai-testing-resource/static/js/viewer.js` — switchVersion(), render helpers, renderAnnotations()
- `ai-testing-resource/static/css/design-system.css` — new annotation/summary BEM classes
- `ai-testing-resource/scripts/generate_traces.py` — axial code validation
- `ai-testing-resource/scripts/seed_test_data.py` — quantified failure mode descriptions
