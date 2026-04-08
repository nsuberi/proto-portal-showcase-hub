# Plan: Golden Dataset V1 vs V2 Pipeline Comparison via LangSmith

## Context

The notebook already compares V1 vs V2 pipeline answers for the 4 test scenarios (cell 52), but the **golden dataset** (12 examples: 8 positive, 4 negative) was only evaluated once — using pre-written expected outputs with V1 custom metrics (cell 25). There's no V2 comparison on the golden dataset, and no pipeline-generated answers for the golden inputs at all.

The user wants Appendix B cells that:
1. Pull V1 and V2 golden dataset evaluation data from LangSmith using `prompt_version` metadata
2. Show a comparison highlighting improvements and regressions

This requires two parts: generating the data (main notebook body) and querying it (Appendix B).

## Current State

- **Cell 25** evaluates golden dataset with pre-written `expected_output` as `actual_output` — no pipeline involvement, no `prompt_version` metadata
- **Cell 52** compares V1 vs V2 on 4 test scenarios in-memory — good pattern to follow
- **Appendix B cells 68–69** show prompt/judge diffs, cells 70–72 validate single-turn traces
- `prompt_version` metadata exists on `ask_mortgage_assistant` calls (cells 10, 51) but NOT on any golden dataset traces

## Changes

### Part 1: New cell in Section 6 — Generate golden pipeline V1/V2 answers and evaluate

**Insert after cell 52** (the V1 vs V2 test_questions comparison). This new cell:

1. Loops through `golden_examples`, calling `ask_mortgage_assistant(golden.input)` with V1 prompt → builds `LLMTestCase` using the actual pipeline answer and retrieval context
2. Same loop with `system_prompt=SYSTEM_PROMPT_V2`
3. Evaluates both sets with `custom_metrics` (`regulatory_compliance`, `actionability`)
4. Uses `evaluate_and_trace` with:
   - `trace_name="deepeval_golden_pipeline"` (distinguishes from the pre-written golden eval)
   - Passes `prompt_version` in metadata by adding it to the `evaluate_and_trace` metadata
5. Builds and displays a comparison DataFrame (same pattern as cell 52)

**Key detail**: `evaluate_and_trace` currently accepts `section` and `label` but not `prompt_version`. Two options:
- **Option A**: Add a `metadata_extra` dict parameter to `evaluate_and_trace` that merges into the trace metadata → clean but changes the helper function signature
- **Option B**: Write an inline evaluation loop (like `eval_irr` in cell 31) that passes `prompt_version` directly in the `trace()` metadata → self-contained, no signature change

**Recommendation: Option B** — keeps the new cell self-contained and doesn't risk breaking the 6 existing call sites of `evaluate_and_trace`. The inline pattern already exists in cells 31 and 56.

### Part 2: New cells in Appendix B — Query LangSmith and compare

**Insert after cell 69** (judge diff cell), before the existing trace validation cells.

**Cell A — markdown**: Section header explaining that we're pulling V1 vs V2 golden dataset results from LangSmith to verify the comparison is captured and queryable.

**Cell B — code**:
1. Query `runs` (already fetched in cell 70) for traces named `deepeval_golden_pipeline`
2. Split by `metadata["prompt_version"]` into V1 and V2 groups
3. Extract metric scores from `run.outputs`
4. Build a side-by-side DataFrame keyed by golden label (positive/negative)
5. Annotate: improved (FAIL→PASS), regressed (PASS→FAIL), unchanged
6. Print summary statistics

## Files Modified

- `interactive-notebook/ai_eval_workshop.ipynb` — 1 new cell in Section 6, 2 new cells in Appendix B

## Verification

- Validate Python syntax on all new code cells
- Confirm cell ordering: new Section 6 cell appears after cell 52 (V1/V2 test comparison)
- Confirm Appendix B cells appear after judge diff (cell 69) and before trace query cells
- Check that `deepeval_golden_pipeline` trace name doesn't collide with `deepeval_golden_dataset`
