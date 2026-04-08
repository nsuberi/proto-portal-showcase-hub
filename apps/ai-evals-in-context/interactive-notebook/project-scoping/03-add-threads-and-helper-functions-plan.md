# Plan: Refactor Notebook Helpers + Add Multi-Turn Conversation Section

## Context

The notebook `interactive-notebook/ai_eval_workshop.ipynb` will be shown in a video. Two changes are needed:
1. Extract repeated code into helper functions for cleaner presentation
2. Add a new section demonstrating multi-turn conversations with LangSmith thread tracking

---

## Step 0: Create `interactive-notebook/AGENTS.md`

Create an `AGENTS.md` file scoped to the interactive-notebook folder with guidance for AI agents working on this notebook:

```markdown
# AI Agent Guidelines for interactive-notebook/

## Cost Management
- **Be strategic about which cells to run.** This notebook makes real API calls (Anthropic for RAG + evaluation, LangSmith for tracing). Each full run costs money.
- Only re-run cells that are affected by your changes. If you changed a helper function, re-run the helper cell + the cells that call it — not the entire notebook.
- When testing evaluation changes, use a single test case first before running the full parallel batch.
- The golden dataset (12 examples) and IRR traces (20 examples) each trigger multiple LLM judge calls. Avoid unnecessary re-runs of these sections.

## Execution Time
- Always write code to minimize end-to-end notebook execution time.
- Use `ThreadPoolExecutor` for independent API calls (already done for evaluation cells).
- Prefer `deepcopy(metric)` over re-instantiating metrics — avoids redundant model setup.
- When adding new sections, use the same parallel patterns established in the helper functions.
- Keep `max_tokens` as low as reasonable for test/demo calls.
```

---

## Change 1: Extract Helper Functions

### New cell: "Helper Functions" (insert after cell 5, before the RAG pipeline section)

Three helpers that eliminate the 4x repeated evaluation pattern + the agreement analysis pattern:

#### Helper A: `get_metric_name(metric)`
Extracts a display name from any deepeval metric (handles both built-in metrics and GEval):
```python
def get_metric_name(metric):
    """Get display name from a deepeval metric."""
    if hasattr(metric, "name") and metric.__class__.__name__ == "GEval":
        return metric.name
    return metric.__class__.__name__.replace("Metric", "")
```

#### Helper B: `evaluate_and_trace(index, test_case, metrics, trace_name, section, label)`
Consolidates the evaluate+trace pattern used in cells 11, 16, 23, 29:
```python
def evaluate_and_trace(index, test_case, metrics, trace_name, section, label):
    """Evaluate a test case against metrics with LangSmith tracing."""
    with trace(
        name=trace_name, run_type="chain",
        inputs={"input": test_case.input[:200], "label": label},
        metadata={"section": section, "label": label}
    ) as eval_run:
        row = {"label": label}
        for metric in metrics:
            m = deepcopy(metric)
            m.measure(test_case)
            row[get_metric_name(m)] = "PASS" if m.score == 1 else "FAIL"
        eval_run.outputs = {k: v for k, v in row.items() if k != "label"}
    return index, row
```

#### Helper C: `run_parallel_evaluation(items, eval_func, max_workers=None)`
Consolidates the ThreadPoolExecutor pattern:
```python
def run_parallel_evaluation(items, eval_func, max_workers=None):
    """Run eval_func(i, item) in parallel across items. Returns list of results."""
    results = [None] * len(items)
    with ThreadPoolExecutor(max_workers=max_workers or len(items)) as executor:
        futures = {executor.submit(eval_func, i, item): i for i, item in enumerate(items)}
        for future in as_completed(futures):
            idx, row = future.result()
            results[idx] = row
            print(f"  Scored: {row.get('label', idx)}")
    return results
```

### Cells that change to use helpers

**Cell 11 (evaluate_generic)** — Replace 30-line evaluate_generic + ThreadPoolExecutor with:
```python
def eval_generic(i, tc):
    return evaluate_and_trace(i, tc, generic_metrics, "deepeval_generic_metrics",
                              "generic_metrics", test_questions[i]["scenario"])

results_data = run_parallel_evaluation(test_cases, eval_generic)
df_generic = pd.DataFrame(results_data).set_index("label")
df_generic.index.name = "scenario"
print("\n--- Generic Metric Results ---")
df_generic
```

**Cell 16 (evaluate_all)** — Same pattern:
```python
def eval_all(i, tc):
    return evaluate_and_trace(i, tc, all_metrics, "deepeval_all_metrics",
                              "all_metrics", test_questions[i]["scenario"])

full_results = run_parallel_evaluation(test_cases, eval_all)
df_full = pd.DataFrame(full_results).set_index("label")
df_full.index.name = "scenario"
print("\n--- Full Metric Results (Generic + Custom) ---")
df_full
```

**Cell 23 (evaluate_golden)** — Slightly different because it creates test cases from Golden objects:
```python
def eval_golden(i, golden):
    tc = LLMTestCase(input=golden.input, actual_output=golden.expected_output,
                     retrieval_context=golden.context)
    return evaluate_and_trace(i, tc, custom_metrics, "deepeval_golden_dataset",
                              "golden_dataset", golden_labels[i])

golden_results = run_parallel_evaluation(golden_examples, eval_golden)
df_golden = pd.DataFrame(golden_results)
print("\n--- Golden Dataset Evaluation ---")
df_golden
```

**Cell 29 (evaluate_irr)** — This one is different (single metric, returns score+verdict), so it keeps its own function but uses `get_metric_name` and the parallel runner:
```python
def eval_irr(i, sample):
    with trace(
        name="deepeval_irr_evaluation", run_type="chain",
        inputs={"input": sample["input"], "response": sample["response"][:200],
                "human_label": sample["human_label"]},
        metadata={"section": "inter_rater_reliability", "trace_index": i}
    ) as eval_run:
        tc = LLMTestCase(input=sample["input"], actual_output=sample["response"],
                         retrieval_context=sample["context"])
        m = deepcopy(regulatory_compliance)
        m.measure(tc)
        verdict = "PASS" if m.score == 1 else "FAIL"
        eval_run.outputs = {"score": m.score, "verdict": verdict,
                           "human_label": sample["human_label"]}
    return i, {"score": int(m.score), "verdict": verdict, "label": sample["human_label"],
               "input": sample["input"][:50]}

irr_results = run_parallel_evaluation(annotated_traces, eval_irr, max_workers=10)
llm_scores = [r["score"] for r in irr_results]
llm_labels = ["acceptable" if s == 1 else "unacceptable" for s in llm_scores]
human_labels = [t["human_label"] for t in annotated_traces]

print(f"\nLLM judge passed: {llm_labels.count('acceptable')}/{len(llm_labels)}")
print(f"Human annotator passed: {human_labels.count('acceptable')}/{len(human_labels)}")
```

**Note:** The IRR agreement analysis cells (Cohen's kappa, confusion matrix, diagnostic stats) are NOT extracted into helpers — they are each used once and the code is pedagogically valuable to show in full for the video.

---

## Change 2: Multi-Turn Conversation Section

### Placement
Insert as a **new section at the end of the notebook**, after all evaluation/IRR sections and before the existing Summary & Validation section. This is ~4 new cells.

### New markdown cell: section header
```markdown
---
## Multi-Turn Conversations with LangSmith Threads

Real users don't ask single questions — they have conversations. LangSmith **threads** let you group related turns together so you can trace an entire conversation as a unit.

The key: pass a shared `thread_id` via the `langsmith_extra` parameter when calling a `@traceable` function. LangSmith groups all runs with the same `thread_id` into a single conversation view.
```

### New code cell: `chat_mortgage_assistant()` function
```python
import uuid

@traceable(name="chat_mortgage_assistant")
def chat_mortgage_assistant(question: str, history: list[dict] = None,
                            n_results: int = 2) -> dict:
    """Multi-turn mortgage assistant with conversation history.

    Thread tracking is handled by passing langsmith_extra at the call site,
    not inside this function — keeping the tracing concern separate.
    """
    history = history or []

    # Retrieve context for the current question
    with trace(name="chromadb_retrieval", run_type="tool",
               inputs={"question": question, "n_results": n_results}) as retrieval_run:
        results = collection.query(query_texts=[question], n_results=n_results)
        context_docs = results["documents"][0]
        context_text = "\n\n---\n\n".join(context_docs)
        retrieval_run.outputs = {"num_docs": len(context_docs), "documents": context_docs}

    # Build messages: history + new question with context
    system_prompt = (
        "You are a helpful mortgage lending assistant. Answer the borrower's "
        "question using ONLY the provided context. Be specific, cite numbers "
        "when available, and always recommend speaking with a loan officer for "
        "personalized advice. Never guarantee approval, specific rates, or "
        "outcomes. Use hedging language like 'typically', 'generally', and "
        "'may vary based on your situation'."
    )

    messages = list(history) + [{
        "role": "user",
        "content": f"Context:\n{context_text}\n\nQuestion: {question}"
    }]

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    answer = message.content[0].text

    # Return updated history for next turn
    updated_history = messages + [{"role": "assistant", "content": answer}]

    return {
        "answer": answer,
        "history": updated_history,
        "retrieval_context": context_docs
    }
```

### New code cell: Demo multi-turn conversation
The `langsmith_extra={"metadata": {"thread_id": ...}}` kwarg is intercepted by the `@traceable` decorator — it never reaches the function itself. This is the canonical LangSmith way to attach thread IDs.
```python
# Start a 3-turn conversation — all turns share the same thread_id in LangSmith
thread_id = str(uuid.uuid4())
print(f"Thread ID: {thread_id}\n")

# Turn 1: Initial question
turn1 = chat_mortgage_assistant(
    "What credit score do I need for an FHA loan?",
    langsmith_extra={"metadata": {"thread_id": thread_id}}
)
print(f"Turn 1 — Q: What credit score do I need for an FHA loan?")
print(f"A: {turn1['answer'][:200]}...\n")

# Turn 2: Follow-up referencing Turn 1
turn2 = chat_mortgage_assistant(
    "What about the down payment requirements for that same loan type?",
    history=turn1["history"],
    langsmith_extra={"metadata": {"thread_id": thread_id}}
)
print(f"Turn 2 — Q: What about the down payment requirements for that same loan type?")
print(f"A: {turn2['answer'][:200]}...\n")

# Turn 3: Clarifying question
turn3 = chat_mortgage_assistant(
    "Can I use gift funds for that down payment?",
    history=turn2["history"],
    langsmith_extra={"metadata": {"thread_id": thread_id}}
)
print(f"Turn 3 — Q: Can I use gift funds for that down payment?")
print(f"A: {turn3['answer'][:200]}...")

print(f"\n--- All 3 turns tracked under thread_id: {thread_id} ---")
print("Check LangSmith to see them grouped as a conversation.")
```

### New markdown cell: Explanation
```markdown
In LangSmith, navigate to your project and look in the **Threads** view to see all three turns grouped together. Each turn shows:
- The **retrieval step** (what documents were fetched for that question)
- The **LLM call** (the full message history sent to Claude, growing with each turn)
- **Token usage** increasing as conversation context grows

This is essential for evaluating multi-turn behavior: does the assistant maintain context? Does it handle pronoun references ("that same loan type") correctly? Thread-level tracing lets you debug and measure these interactions.
```

---

## Files Modified
- `interactive-notebook/ai_eval_workshop.ipynb` (the only file)

## Verification
1. Run the notebook end-to-end in Jupyter (or `jupyter nbconvert --execute`)
2. Confirm helper functions produce identical DataFrame outputs as before
3. Confirm multi-turn section runs without errors and produces 3 answers
4. Check LangSmith project for thread-grouped traces
5. Verify all existing evaluation sections still work with the refactored helpers
