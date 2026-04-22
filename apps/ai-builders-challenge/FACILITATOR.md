# Facilitator Notes — AI Builders Challenge

For workshop leads and reviewers. Participants should not read this file before attempting the challenge.

## Timing (4 hours)

| Time | Phase | Success signal |
|------|-------|----------------|
| 0:00–0:30 | Setup + explore | `./scripts/run_local.sh` boots; at least one `/chat` round-trips |
| 0:30–1:30 | Discovery | Participant has triangulated transcripts + seed logs + behavioral.json and named the pattern |
| 1:30–2:15 | Hypothesis + failing test | `pytest tests/test_property_retrieval.py` fails with the expected mismatch assertion |
| 2:15–3:00 | Fix + test passes | `pytest` green; `CODE_HASH` changes between pre- and post-fix runs |
| 3:00–3:30 | Deploy + re-pull logs | `docker compose up --build` runs; `/logs` shows scope-correct retrievals |
| 3:30–4:00 | Storytelling + video | One-page handoff doc **and** a 5–8 min walkthrough video presenting the one-pager alongside a live prototype demo (chat round-trip + Logs view showing corrected `retrieved_ids`) |

## The embedded bug

`app/retrieval.py::retrieve_appraisal` runs the TF-IDF scorer across **every** property in the KB instead of first filtering to `property_id`. The result: a borrower who asks about `prop_042` (Burnside) gets back the Hawthorne property `prop_017` because their text descriptions overlap heavily.

The minimal fix is one line before scoring:
```python
candidates = [p for p in kb if p.property_id == property_id]
```
plus replacing `kb` with `candidates` in the scorer list comprehension.

## What good looks like

- They reference **at least two** of the three evidence sources (transcripts, logs, behavioral) in their write-up.
- Their failing test asserts on a **log field** (like `retrieved_ids`), not just on response text, because response text depends on the LLM's mood.
- They notice that `CODE_HASH` moves when they change code — and use it in their story as a deployment-traceability artifact.
- They name at least one harness improvement beyond the one-line fix (confidence threshold, typed error when KB empty, prompt guardrail forbidding conflation).
- Their video actually **shows** the prototype — a live `/chat` round-trip and the Logs view before vs. after the fix — not just a slide-deck read-aloud.

## Common stumbles

- Trying to fix the bug before writing a test. Coach them toward test-first.
- Over-mocking the LLM in their test. The `test_borrower_grounding.py` pattern (address-leakage check) shows an honest offline proxy.
- Assuming the issue is in the prompt. The prompt is actually fine — it's the upstream retrieval that violates it.

## Regenerating seed logs

If participants want a "before" log set larger than what ships:
```bash
./scripts/run_local.sh &
for s in sess_101 sess_102 sess_103; do
  for pid in prop_042 prop_104 prop_078; do
    curl -s -X POST localhost:5100/chat \
      -H 'content-type: application/json' \
      -d "{\"session_id\":\"$s\",\"property_id\":\"$pid\",\"message\":\"describe my property\"}"
  done
done > fixtures/seed_logs/run_$(date +%F).jsonl
```
