# AI Builders Challenge

A 4-hour application challenge for product managers in the AI Builders Program.

You will analyze user transcripts and behavioral logs, read an agentic home-lending codebase to compare intent with actual behavior, form a hypothesis, write an automated test that captures the broken behavior, fix the bug, redeploy, and confirm the fix in fresh logs.

## What ships in this bundle

- `app/` — a Flask borrower-agent backed by an in-memory property knowledge base. It retrieves property data, grounds an LLM response, and writes structured JSONL logs to stdout. One subsystem has a subtle issue — that's yours to find.
- `fixtures/` — 8 property records, 8 user transcripts, per-session behavioral signals, and one pre-recorded log run.
- `tests/` — deepeval starter tests. Some fail out of the box. That is the point.
- `.claude/skills/` — three BMAD-inspired agent personas (Log Analyst, Hypothesis Synthesizer, Agentic Harness Configurer) that you can invoke from Claude Code or similar.
- `cli/` — `init`, `export`, `hash` subcommands.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r tests/requirements.txt
python -m cli init
cp .env.example .env   # fill in ANTHROPIC_API_KEY if you have one
./scripts/run_local.sh
```

In another shell:
```bash
pytest tests/ -v
```

Some tests will fail. Your job is to figure out **why** using the log analyst and hypothesis synthesizer skills — not to make the tests pass by force.

## The loop

1. Read a few transcripts in `fixtures/transcripts/` and `fixtures/behavioral.json`. What do borrowers seem to be saying about their experience?
2. Read `fixtures/seed_logs/run_2026-04-15.jsonl`. What events are logged, and do any fields suggest the gap?
3. Use the **log-analyst** skill to structure that analysis.
4. Use the **hypothesis-synthesizer** skill to produce a testable claim in If/Then/Because form and a draft test name.
5. Open `tests/test_property_retrieval.py` and extend it (or add a new file) so the failing assertion captures the broken behavior.
6. Read `app/` code. Where does intent (prompts, endpoints) diverge from actual behavior (retrieval logic)?
7. Apply the minimal fix. Use the **agentic-harness-configurer** skill to propose any additional structure worth adding.
8. Re-run tests. Pull fresh logs. Write a one-page story you could hand to engineering.

## Tracing deployments

Every log line carries a `code_hash` — a 12-hex fingerprint of your current commit plus any uncommitted diffs. When you deploy, the hash travels with the app. When you pull logs down, you can correlate them to the exact code that was running. Run `python -m cli hash` to see the current value.

## Exporting

Once you're happy with your version, `python -m cli export` produces a tarball of the whole bundle.
