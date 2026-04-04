## The Central Question

Every team shipping AI features faces the same question: **How do we know the AI is doing a good job?**

This workshop builds an answer, piece by piece. Starting with a working RAG pipeline and ending with a Test Summary Report wired into CI/CD, each stage adds a layer of confidence that automated judgment can be trusted.

### The Key Insight

Governance is an accelerator, not a gate. Confidence in automated evaluation comes from systematically comparing machine judgment against human judgment. When you can measure that agreement — and improve it — you unlock fast, safe iteration.

### What You'll Build

| Stage | What You Build | What You Prove |
|-------|---------------|----------------|
| **Foundation** | RAG pipeline + generic and custom metrics | The pipeline works and encodes domain rules |
| **Acceptance** | Golden dataset with positive/negative examples | Metrics distinguish good responses from bad |
| **Validation** | Inter-rater reliability analysis | The automated judge agrees with human experts |
| **Improve** | Dual improvement loops with regression tests | Changes are measured, not guessed |
| **Reporting** | Test Summary Report with prompt traceability | Every release has auditable evidence |

### Domain

The workshop uses a **mortgage lending assistant** — a RAG-powered chatbot that answers borrower questions about loan types, rate locks, closing costs, and refinancing. Mortgage lending is a useful domain because:

- Responses must be **factually accurate** (loan eligibility thresholds, fee structures)
- Language must be **regulatorily compliant** (no guarantees, no specific rate promises)
- Answers should be **actionable** (clear next steps, relevant numbers)

These three dimensions — accuracy, compliance, actionability — create natural tension that generic "is it faithful?" metrics cannot fully capture.
