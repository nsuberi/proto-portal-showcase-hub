<!-- section: intro -->
## Multi-Turn Conversations

Real users don't ask a single question and leave. They have conversations. The mortgage assistant's `chat_mortgage_assistant` function extends the RAG pipeline with a `history` parameter — a list of previous messages that gives the model conversational context.

A three-turn example:

1. "What credit score do I need for an FHA loan?"
2. "What about the down payment requirements for that same loan type?"
3. "Can I use gift funds for that down payment?"

Each turn references the previous one. Turn 2's "that same loan type" refers to FHA from Turn 1. Turn 3's "that down payment" refers to the 3.5% requirement established in Turn 2.

### What Transfers from Stages 1-4

Everything built so far — per-turn faithfulness, compliance metrics, IRR methodology, improvement loops — works on individual turns unchanged. Each turn is still an input → retrieval → generation cycle that can be evaluated independently.

### What Requires New Techniques

- **Conversation-level coherence** — Does the model maintain consistent information across turns? Pronoun resolution ("that same loan type") requires understanding the full conversation.
- **Growing context window** — Token usage and cost increase monotonically with each turn as the conversation history accumulates.
- **Compounding errors** — A wrong Turn 1 becomes context for Turn 3. Errors propagate through the conversation in ways they can't in single-turn.
- **Knowledge base coverage** — Follow-up questions probe from different angles, exposing retrieval gaps that single-shot questions miss.

All turns in a conversation share a `thread_id` passed through LangSmith metadata, linking them in the LangSmith Threads view.

<!-- section: tsr -->
## The Test Summary Report

The Test Summary Report (TSR) is the acceptance artifact for a pull request. It answers five questions:

1. **What changed?** — Exact prompt texts (not just labels) for both versions
2. **What failure modes existed in V1?** — Every golden dataset case that failed under V1
3. **Did the PR fix them?** — V2 results for each V1 failure
4. **Were any regressions introduced?** — Cases that passed V1 but fail V2
5. **What is the acceptance recommendation?** — ACCEPT, CONDITIONAL, or REJECT

### TSR Structure

The TSR is a JSON document with these sections:

- **`pull_request`** context — branch, commit SHA, comparison base
- **`prompts`** — full text of system prompt V1 and V2, plus judge evaluation steps for both versions
- **`metrics_summary`** — aggregate pass rates per metric per version
- **`failure_modes_identified`** — array of V1 failures with V2 outcome for each
- **`regressions_introduced`** — array of cases where V2 is worse than V1
- **`acceptance`** — machine-generated recommendation with reasoning

<!-- section: ci -->
## CI Integration

The TSR connects evaluation to the merge workflow:

```yaml
# Simplified CI sketch
- name: Run golden dataset evaluation
  run: python run_eval.py --prompt-version v2

- name: Generate TSR
  run: python generate_tsr.py --baseline v1 --candidate v2

- name: Gate on recommendation
  run: |
    recommendation=$(jq -r '.acceptance.recommendation' tsr.json)
    if [ "$recommendation" != "ACCEPT" ]; then exit 1; fi

- name: Upload TSR as artifact
  uses: actions/upload-artifact@v4
  with:
    name: test-summary-report
    path: tsr.json
```

If the TSR recommendation is not ACCEPT, the merge is blocked. The reviewer sees the TSR as a PR artifact — failure modes, regressions, and the exact prompt changes — and can make an informed decision.

### Prompt Traceability

Two approaches for linking traces back to the prompts that produced them:

**Manual metadata** (used in the workshop): Version prompts as Python variables (`SYSTEM_PROMPT_V1`, `SYSTEM_PROMPT_V2`), pass `prompt_version` through `langsmith_extra` metadata on every call. This works but requires discipline at every call site.

**Prompt Hub** (production alternative): Store prompts as named repositories with Git-like commit history. Tags (`dev`, `staging`, `prod`) point to specific commits. LangSmith auto-links traces to prompt commit hashes when prompts are pulled from the Hub. CI can resolve the exact prompt text from its hash without reading Python source.

Both approaches achieve the same goal: a reviewer can go from a TSR to the exact prompt text that produced a specific trace, and from there to the metric results and human annotations.

<!-- section: audit -->
## The Audit Trail

Each merged PR accumulates a TSR as a build artifact. Over time, this creates an auditable history:

- Which failure modes were identified in each release
- What prompt changes were made and why
- Whether regressions were introduced and how they were resolved
- Who approved the release and on what evidence

This is the governance output the workshop has been building toward — not a compliance checkbox, but a structured evidence trail that gives reviewers confidence to approve fast.
