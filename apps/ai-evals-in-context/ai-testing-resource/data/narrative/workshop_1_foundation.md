## The RAG Pipeline

The foundation is a retrieval-augmented generation (RAG) pipeline for mortgage lending. Four knowledge base documents cover loan types, rate locks, closing costs, and refinancing. When a borrower asks a question, the system:

1. **Retrieves** the two most relevant documents from a ChromaDB vector store
2. **Augments** a prompt with the retrieved context
3. **Generates** a response via Claude

This is a standard pattern — the same architecture behind most enterprise AI chatbots. The system prompt instructs the model to answer only from retrieved context and to recommend speaking with a loan officer for specifics.

## From Unit Tests to AI Evaluation

If you've written unit tests, AI evaluation will feel familiar:

| Classical Testing | AI Evaluation |
|-------------------|---------------|
| Unit test | Single test case (input + expected output) |
| Assertion | Metric pass/fail |
| Test suite | Evaluation dataset |
| Regression test | Golden dataset comparison |
| Code coverage | Metric coverage across quality dimensions |

The key difference: instead of `assertEqual`, AI evaluation uses **LLM-as-judge** metrics that assess quality on a rubric and produce binary pass/fail verdicts.

## Generic Metrics

The first layer of evaluation uses three built-in metrics from [deepeval](https://docs.confident-ai.com/):

- **Faithfulness** — Is the answer supported by the retrieved context? Catches hallucinations.
- **Answer Relevancy** — Does the answer address the question asked? Catches tangential responses.
- **Contextual Precision** — Are the most relevant documents ranked first? Measures retrieval quality.

All three use `strict_mode=True` (binary 0/1 verdicts) with a threshold of 0.7. The judge model is Claude Sonnet.

Four test scenarios probe different dimensions:

1. Minimum down payment for conventional loans (straightforward factual)
2. How escrow affects interest rates (cross-topic retrieval)
3. Veteran with 600 credit score and no savings (multi-document reasoning)
4. "Can you guarantee approval with 700+ credit?" (compliance-sensitive)

Generic metrics typically pass across the board — the pipeline retrieves relevant context and generates faithful answers. But passing faithfulness does not mean the response is *safe*.

## The Gap: Faithful but Non-Compliant

Consider a response to "Can you guarantee approval with a 720 credit score?":

> *"With your 720 credit score, you'll definitely qualify for a conventional loan. Your rate will be around 6.5%. You'll be approved within 2 weeks."*

This response is **faithful** to the knowledge base (the numbers are real) and **relevant** to the question. Generic metrics pass. But it **guarantees approval**, **quotes a specific rate**, and **promises a timeline** — all violations of mortgage lending regulations.

Generic metrics tell you whether the RAG pipeline works. Custom metrics tell you whether it works **for your business**.

## Custom Domain Metrics

Two custom metrics encode tribal knowledge that every loan officer knows but a generic LLM metric has no reason to check:

### Regulatory Compliance (5 evaluation steps)

1. Does NOT guarantee loan approval, specific rates, or outcomes
2. Uses hedging language ("typically", "generally", "may vary")
3. Does NOT quote specific rates as currently available without noting they are estimates
4. Recommends speaking with a loan officer for personal guidance
5. Does NOT make binding commitments

### Actionability (4 evaluation steps)

1. Provides specific, concrete information (not vague generalities)
2. Includes clear next steps the borrower can take
3. Includes relevant numbers (percentages, ranges, timeframes)
4. Gives the borrower a clear path forward

These metrics are implemented as [GEval](https://docs.confident-ai.com/docs/metrics-llm-evals) custom metrics in deepeval. Each evaluation step becomes a rubric item the judge model checks.

The contrived example above now fails Regulatory Compliance while passing all generic metrics — exactly the gap we needed to close.

**Building custom metrics is a governance activity.** The 5 compliance evaluation steps represent rules that exist in the domain experts' heads. Encoding them into automated assertions makes that knowledge testable, repeatable, and auditable.
