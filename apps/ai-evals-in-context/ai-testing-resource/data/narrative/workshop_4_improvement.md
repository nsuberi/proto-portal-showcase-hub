## The Improvement Loop

With metrics, a golden dataset, and validated inter-rater reliability, improvement becomes systematic instead of guesswork. The loop:

**Diagnose** → **Improve** → **Re-evaluate** → **Compare**

Each pass through the loop produces measurable evidence of whether the change helped, hurt, or had no effect. This is what makes AI development auditable.

## Diagnosing the Pipeline (Step 1)

Start with the metric results from Stage 1. Count failures per metric across all test scenarios. The pattern tells you where to look:

- Mostly **faithfulness** failures → retrieval quality or hallucination in generation
- Mostly **compliance** failures → system prompt lacks explicit rules
- Mostly **actionability** failures → responses are vague, missing next steps

In the workshop's mortgage assistant, the compliance metric produced the most failures. The system prompt (V1) was a single paragraph with inline guidance — enough for a capable model to usually comply, but not structured enough to prevent edge-case violations.

## Improving the System Prompt (Step 2)

The V1 system prompt was conversational: "You are a helpful mortgage assistant. Answer questions based on the provided context. Be professional."

The V2 system prompt adds structure:

```
You are a mortgage lending assistant. Follow these rules strictly:

1. Answer ONLY from the provided context. Do not use outside knowledge.
2. NEVER quote specific interest rates, monthly payments, or approval timelines.
3. NEVER guarantee approval, qualification, or specific outcomes.
4. Use hedging language: "typically", "generally", "may vary based on your situation".
5. When citing numbers from the context, present them as general guidelines,
   not personal guarantees.
6. Always end with: "For guidance specific to your situation, please consult
   with a qualified loan officer."
```

The key changes: numbered rules instead of prose, explicit prohibitions (NEVER), and a mandatory disclaimer. These give the model unambiguous constraints rather than aspirational guidance.

## Re-Evaluating (Step 3)

The same four test scenarios from Stage 1 are run through the V2 pipeline with all five metrics. Each evaluation carries `prompt_version: "v2"` metadata so traces can be filtered by version in LangSmith.

Side-by-side comparison counts three categories:

- **Improvements**: FAIL → PASS (the change fixed something)
- **Regressions**: PASS → FAIL (the change broke something)
- **Unchanged**: same result in both versions

## Golden Dataset Regression Test (Step 4)

Re-evaluating the original four scenarios is necessary but not sufficient. The golden dataset of 12 examples provides a broader regression test. All 12 inputs are run through both V1 and V2 pipelines, and custom metrics are applied to the generated responses.

This catches an important failure mode: a prompt change that fixes the original test scenarios but breaks behavior on cases that were previously working. The golden dataset acts as a regression suite.

## Improving the Judge

The pipeline is only half the system. The automated judge also needs improvement.

### Diagnosing Judge Errors

Review the disagreements from Stage 3. If the judge was too strict (all disagreements are false negatives — rejecting responses humans accepted), the evaluation steps are too broad.

The V1 Regulatory Compliance steps flagged general eligibility information as violations. Saying "conventional loans typically require a 620 credit score" is not a personal guarantee — it's a factual summary from the knowledge base. But V1's evaluation step "Does NOT quote specific rates as currently available" was broad enough to catch this.

### Improving Evaluation Steps

V2 evaluation steps make key distinctions:

1. Does NOT guarantee approval; **citing general eligibility criteria from context is acceptable**
2. Does NOT use **pressure tactics** (urgency, scarcity, time-limited offers)
3. Does NOT **fabricate information** contradicting retrieval context
4. Does NOT make **definitive personal promises**; **general statements about typical processes are acceptable**
5. Does NOT present **opinions as universal facts** without hedging

The core change: V2 distinguishes general information (acceptable) from personal guarantees (unacceptable). This matches how human experts actually evaluate — a loan officer wouldn't flag "FHA loans require 580 credit for 3.5% down" as non-compliant.

### Re-Measuring Kappa

Run the V2 judge on the same 20 annotated traces from Stage 3. Compute new kappa, confusion matrix, and diagnostic statistics. Compare V1 and V2 side by side.

## Two Parallel Loops

The key insight: pipeline improvement and judge improvement are parallel loops that reinforce each other.

| Loop | What Changes | Measured By |
|------|-------------|-------------|
| Pipeline loop | System prompt, retrieval, generation | Metric pass rates on golden dataset |
| Judge loop | Evaluation steps, rubric criteria | Kappa with human annotations |

Improving the pipeline without improving the judge means better responses measured by a miscalibrated ruler. Improving the judge without improving the pipeline means more accurate measurement of the same problems. Both loops need to advance together.

## What You've Built

| Component | Version | Tool |
|-----------|---------|------|
| RAG pipeline | V1, V2 | ChromaDB + Claude |
| Generic metrics | - | deepeval built-in |
| Custom metrics | V1, V2 | deepeval GEval |
| Golden dataset | 12 examples | deepeval EvaluationDataset |
| IRR analysis | V1, V2 | Cohen's kappa, confusion matrix |
| Multi-rater analysis | - | Fleiss' kappa, pairwise comparison |

Every component is versioned and every change is measured. This is the evaluation infrastructure that makes the next stage — production reporting — possible.
