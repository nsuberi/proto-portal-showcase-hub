## Golden Datasets as Living Acceptance Criteria

A golden dataset is your **acceptance criteria** for the AI system — curated examples where you know what good and bad look like. Unlike a test suite that grows organically, a golden dataset is deliberately designed to cover the dimensions that matter.

The workshop builds a golden dataset of 12 mortgage lending examples: 8 positive (compliant, actionable) and 4 negative (non-compliant).

## Positive Examples (8)

Each positive example demonstrates a well-formed response:

- **Credit score for conventional loans** — cites thresholds with hedging, recommends a loan officer
- **Rate lock durations** — explains 30/45/60-day options with fee caveats
- **Closing costs** — provides 2-5% range with component breakdown
- **FHA down payment** — distinguishes credit score tiers (580 vs 500-579)
- **VA loan benefits** — covers no-down-payment with funding fee details
- **PMI removal process** — specific 80% LTV threshold with clear steps
- **Escrow account purpose** — explains tax/insurance bundling
- **Refinancing options** — compares rate-and-term, cash-out, and streamline

## Negative Examples (4)

Each negative example contains a specific violation:

- **Guaranteed approval language** — "you'll definitely be approved"
- **Specific rate promises** — "your rate will be 6.75%"
- **Fabricated programs** — references a "First-Time Advantage Program" that does not exist
- **Pressure tactics with timelines** — "rates are going up, act now" with guaranteed timeline

## The Annotation Workflow

Building a golden dataset is a team activity:

1. **Collect** real customer questions from logs or stakeholder interviews
2. **Generate** candidate responses from the pipeline
3. **Rate** with 2-3 team members independently (before discussing)
4. **Discuss** disagreements — this is where you discover ambiguity in your standards
5. **Lock** consensus ratings as the golden dataset

Step 4 is the most valuable. When a product manager rates a response as "acceptable" and a compliance officer rates it "unacceptable," the disagreement reveals that your acceptance criteria need sharpening. These conversations are more productive than any abstract requirements discussion because they're grounded in concrete examples.

## Validating Metric Separation

With a golden dataset, you can measure whether your metrics actually distinguish good from bad. For each metric, compare the pass rate on positive examples versus negative examples:

| Separation | Meaning | Action |
|------------|---------|--------|
| **Good** (positive rate > negative rate + 20%) | Metric discriminates well | Trust it for automation |
| **Weak** (positive rate > negative rate, but barely) | Metric sees a difference but unreliably | Refine evaluation steps |
| **None** (rates are similar) | Metric is not measuring what you think | Redesign or remove |

Generic metrics (faithfulness, relevancy) tend to show weak or no separation — a faithful hallucination-free response can still be non-compliant. Custom metrics (regulatory compliance, actionability) should show good separation if the evaluation steps are well-written.

## The Transition

At this point the metrics look promising: they pass positive examples and fail negative examples at different rates. But "looks promising" is not "trustworthy." A metric might agree with your golden dataset by coincidence, or it might agree on easy cases while diverging on the borderline cases that matter most.

The next stage asks the central question of AI evaluation: **does the automated judge agree with what a human expert would say?** This is the difference between a metric you hope works and one you can prove works.
