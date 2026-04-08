## The Medical Diagnostic Analogy

Before trusting an automated diagnostic test, clinicians validate it against expert judgment. AI evaluation is no different:

| Medical Testing | AI Evaluation |
|-----------------|---------------|
| Diagnostic test | Automated LLM metric |
| Expert clinician | Human annotator |
| Patient sample | AI-generated response |
| Sensitivity (TPR) | Catches bad responses when they're bad |
| Specificity (TNR) | Lets good responses through when they're good |

A test with high sensitivity but low specificity catches everything — including things that aren't problems (false alarms). A test with high specificity but low sensitivity is precise when it flags an issue, but misses real problems. You need both.

## Cohen's Kappa: Human vs. Machine

Cohen's kappa measures agreement between two raters beyond what you'd expect by chance. The formula:

**kappa = (observed agreement - expected agreement) / (1 - expected agreement)**

The interpretation scale:

| Kappa | Strength |
|-------|----------|
| < 0.00 | Poor (worse than chance) |
| 0.00 - 0.20 | Slight |
| 0.21 - 0.40 | Fair |
| 0.41 - 0.60 | Moderate |
| 0.61 - 0.80 | Substantial |
| 0.81 - 1.00 | Almost perfect |

**Target: kappa >= 0.6** (substantial agreement) before trusting the automated judge for production decisions.

## The Annotation Set

Twenty mortgage responses are annotated by both a human expert and the automated LLM judge:

- **7 clearly acceptable** — well-hedged, compliant, informative
- **5 clearly unacceptable** — guarantees, hallucinations, missing disclaimers
- **8 borderline** — where reasonable people might disagree

The borderline cases are the test. Any metric can handle the extremes. What matters is how the judge behaves on ambiguous responses — the "helpful but insufficiently hedged" answer, the response that cites real numbers but frames them too definitively.

## Reading the Confusion Matrix

The 2x2 confusion matrix (Human label vs. LLM Judge label) reveals the judge's personality:

- **High true positive rate + lower true negative rate** → The judge is **too lenient**. It catches bad responses but also lets some through that humans would flag.
- **Lower true positive rate + high true negative rate** → The judge is **too strict**. It's precise when it flags issues but rejects responses humans find acceptable.
- **Both high** → The judge is **well-calibrated**. This is the target.

Each disagreement tells you something specific. A false negative (judge rejects what humans accept) suggests evaluation steps are too broad. A false positive (judge accepts what humans reject) suggests missing evaluation steps.

## Multi-Rater Dynamics

In practice, "the human expert" is a team of people with legitimately different priorities:

| Rater | Optimizes For | Willing to Sacrifice |
|-------|--------------|---------------------|
| Product team | Helpfulness, clarity, specificity | Some regulatory caution |
| Compliance officer | Regulatory safety, no guarantees | Some helpfulness |
| LLM judge | Consistent rubric application | Nothing beyond the rubric |

Fifteen traces are rated by all three. The results cluster into patterns:

- **Traces 1-5**: All three agree acceptable (straightforward factual responses)
- **Traces 6-8**: All three agree unacceptable (guarantees, fabrications)
- **Traces 9-12**: Product + LLM say acceptable, Compliance says unacceptable
- **Traces 13-15**: Mixed signals — genuinely ambiguous

The disagreement pattern in traces 9-12 is the most informative. Compliance flags responses as non-compliant that the product team and LLM judge find acceptable. This isn't a bug — it reveals that the compliance perspective applies standards the rubric doesn't fully capture.

## Pairwise Kappa and Fleiss' Kappa

**Pairwise Cohen's kappa** computes agreement for every pair of raters, producing a heatmap. Typically, Product and LLM Judge have the highest agreement (both assess general quality), while any pair involving Compliance has lower agreement (different priorities).

**Fleiss' kappa** extends to 3+ raters simultaneously, answering: across all raters, is there more agreement than chance? It's computed from the distribution of ratings per trace rather than pairwise comparisons.

## From Agreement to Action

| Agreement Pattern | Action |
|-------------------|--------|
| All 3 agree acceptable | **Automate** — high-confidence pass |
| All 3 agree unacceptable | **Automate** — high-confidence block |
| Product + LLM agree, Compliance disagrees | **Compliance review** — route to human |
| No majority agreement | **Escalate** — needs team discussion |

## Calibration Sessions

Low kappa does not mean abandon the metric. It means **calibrate**. Common causes of disagreement:

- **Ambiguous criteria** — "appropriate hedging language" means different things to different people
- **Different priorities** — product values helpfulness, compliance values safety
- **Missing context** — raters lack information that would resolve the ambiguity

The remedy is a calibration session: review specific disagreements as a team, discuss edge cases, update the rubric, and re-annotate. One session typically raises kappa by 0.1-0.2 points.
