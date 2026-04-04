# Plan: Integrate LangSmith Tracing into Interactive Notebook

## Context

The interactive-notebook in `ai-evals-in-context` uses DeepEval metrics + direct Anthropic API calls + ChromaDB RAG, but has **no observability**. The `code-dojo` project has a mature LangSmith integration using `@traceable`, `trace()` context managers, and `wrap_anthropic()`. The goal is to add LangSmith tracing so that:

1. **RAG pipeline calls** show up as traces with visible child spans for ChromaDB retrieval (as a "tool" run) and Claude generation (as an "llm" run)
2. **DeepEval test case evaluations** are logged as traces with metric scores as outputs

## Files to Modify

| File | Change |
|------|--------|
| `interactive-notebook/.env` | Add `LANGSMITH_API_KEY`, `LANGCHAIN_TRACING_V2`, `LANGCHAIN_PROJECT` |
| `interactive-notebook/.env.sample` | Add LangSmith vars (without key value) |
| `interactive-notebook/requirements.txt` | Add `langsmith>=0.1.0` |
| `interactive-notebook/ai_eval_workshop.ipynb` | Instrument 6 code cells (details below) |

## Cell-by-Cell Changes

### Cell 1 (setup) — Add LangSmith env config

After `load_dotenv()` and the API key check, add LangSmith setup:

```python
# Configure LangSmith tracing (uses LANGSMITH_API_KEY from .env)
langsmith_key = os.getenv("LANGSMITH_API_KEY")
if langsmith_key:
    os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
    os.environ.setdefault("LANGCHAIN_API_KEY", langsmith_key)
    print(f"LangSmith tracing enabled (project: {os.getenv('LANGCHAIN_PROJECT', 'default')})")
else:
    print("LangSmith API key not found — tracing disabled. Add LANGSMITH_API_KEY to .env for observability.")
```

### Cell 6 (RAG pipeline) — Wrap with `@traceable` + child spans

Replace the current cell with LangSmith-instrumented version:

- `wrap_anthropic(anthropic.Anthropic())` auto-traces all Claude API calls as `llm` runs
- `@traceable(name="ask_mortgage_assistant")` makes each RAG call a top-level trace
- `trace(name="chromadb_retrieval", run_type="tool")` makes retrieval visible as a tool call

```python
import anthropic
from langsmith import traceable, trace
from langsmith.wrappers import wrap_anthropic

client = wrap_anthropic(anthropic.Anthropic())

@traceable(name="ask_mortgage_assistant")
def ask_mortgage_assistant(question: str, n_results: int = 2) -> dict:
    # Step 1: Retrieve relevant documents (traced as "tool" run)
    with trace(name="chromadb_retrieval", run_type="tool",
               inputs={"question": question, "n_results": n_results}) as retrieval_run:
        results = collection.query(query_texts=[question], n_results=n_results)
        context_docs = results["documents"][0]
        retrieval_context = context_docs
        context_text = "\n\n---\n\n".join(context_docs)
        retrieval_run.outputs = {"num_docs": len(context_docs), "documents": context_docs}

    # Step 2: Generate response with Claude (auto-traced by wrap_anthropic)
    system_prompt = (... same as before ...)
    message = client.messages.create(... same as before ...)
    answer = message.content[0].text

    return {"answer": answer, "context": context_text, "retrieval_context": retrieval_context}
```

**LangSmith trace hierarchy per call:**
```
ask_mortgage_assistant (chain)
├── chromadb_retrieval (tool) — shows query + retrieved docs
└── Claude messages.create (llm) — shows prompt + response + tokens
```

### Cell 11 (generic metrics evaluation) — Log test case evaluations

Wrap each test case's evaluation in a `trace()` so metric results appear in LangSmith:

```python
from langsmith import trace

results_data = []
for i, tc in enumerate(test_cases):
    with trace(
        name=f"deepeval_generic_metrics",
        run_type="chain",
        inputs={"scenario": test_questions[i]["scenario"], "input": tc.input,
                "actual_output": tc.actual_output[:200]},
        metadata={"section": "generic_metrics", "scenario": test_questions[i]["scenario"]}
    ) as eval_run:
        row = {"scenario": test_questions[i]["scenario"]}
        for metric in generic_metrics:
            metric.measure(tc)
            metric_name = metric.__class__.__name__.replace("Metric", "")
            row[metric_name] = "PASS" if metric.score == 1 else "FAIL"
        eval_run.outputs = {k: v for k, v in row.items() if k != "scenario"}
    results_data.append(row)
    print(f"  Scored: {row['scenario']}")
```

### Cell 16 (all metrics) — Same pattern

Wrap each test case evaluation in `trace()` with `metadata={"section": "all_metrics"}`.

### Cell 23 (golden dataset) — Same pattern

Wrap each golden example evaluation in `trace()` with `metadata={"section": "golden_dataset", "label": golden_labels[i]}`.

### Cell 29 (IRR - LLM judge scoring) — Rename loop var + add tracing

**Important**: This cell currently uses `trace` as a loop variable (`for i, trace in enumerate(annotated_traces)`), which would shadow the `langsmith.trace` import. Rename the loop variable to `sample`:

```python
from langsmith import trace

llm_scores = []
for i, sample in enumerate(annotated_traces):
    with trace(
        name="deepeval_irr_evaluation",
        run_type="chain",
        inputs={"input": sample["input"], "response": sample["response"][:200],
                "human_label": sample["human_label"]},
        metadata={"section": "inter_rater_reliability", "trace_index": i}
    ) as eval_run:
        tc = LLMTestCase(
            input=sample["input"],
            actual_output=sample["response"],
            retrieval_context=sample["context"]
        )
        regulatory_compliance.measure(tc)
        llm_scores.append(int(regulatory_compliance.score))
        verdict = "PASS" if regulatory_compliance.score == 1 else "FAIL"
        eval_run.outputs = {"score": regulatory_compliance.score, "verdict": verdict,
                           "human_label": sample["human_label"]}
    print(f"  [{i+1:2d}] {verdict}  human={sample['human_label']:12s} | {sample['input'][:50]}...")
```

Also update the remaining references to `trace[...]` → `sample[...]` later in the same cell (the `human_labels` list comprehension).

## Environment Changes

### `.env` — Add (after existing content):
```
# LangSmith (for AI tracing and observability)
LANGCHAIN_TRACING_V2=true
LANGSMITH_API_KEY=...
LANGCHAIN_PROJECT=ai-eval-workshop
```

### `.env.sample` — Add:
```
# LangSmith (optional — for AI tracing and observability)
LANGSMITH_API_KEY=
LANGCHAIN_PROJECT=ai-eval-workshop
```

### `requirements.txt` — Add:
```
langsmith>=0.1.0
```

## What This Enables in LangSmith

After running the notebook, the `ai-eval-workshop` project in LangSmith will show:

| Trace Name | Run Type | Count | Content |
|------------|----------|-------|---------|
| `ask_mortgage_assistant` | chain | ~4 (from Cell 10) | RAG pipeline with retrieval + generation child spans |
| `chromadb_retrieval` | tool | ~4 (nested) | ChromaDB query + retrieved documents |
| Claude `messages.create` | llm | ~4 (nested) | Full prompt, response, and token usage |
| `deepeval_generic_metrics` | chain | 4 | Generic metric scores per test case |
| `deepeval_all_metrics` | chain | 4 | All metric scores (generic + custom) |
| `deepeval_golden_dataset` | chain | 12 | Golden example evaluations with labels |
| `deepeval_irr_evaluation` | chain | 20 | IRR scoring with human vs LLM comparison |

## Verification

1. `pip install -r requirements.txt` (installs langsmith)
2. Run Cell 1 — should print "LangSmith tracing enabled (project: ai-eval-workshop)"
3. Run through Section 1 (Cells 3→11) — generates RAG traces + generic metric evaluations
4. Open LangSmith dashboard → project `ai-eval-workshop`
5. Verify `ask_mortgage_assistant` traces show nested `chromadb_retrieval` (tool) and Claude (llm) spans
6. Verify `deepeval_generic_metrics` traces show metric scores in outputs
7. Continue running remaining sections and verify golden dataset + IRR traces appear
