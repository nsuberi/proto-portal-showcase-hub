# AI Builders Challenge

A 4-hour application challenge for product managers in the AI Builders Program.

You will analyze user transcripts and behavioral logs, read an agentic home-lending codebase to compare intent with actual behavior, form a hypothesis, write an automated test that captures the broken behavior, fix the bug, redeploy, and confirm the fix in fresh logs.

## What ships in this bundle

- `app/` — a Flask borrower-agent backed by an in-memory property knowledge base. It retrieves property data, grounds an LLM response, and writes structured JSONL logs to stdout. One subsystem has a subtle issue — that's yours to find. Endpoints: `/health`, `/chat`, `/logs`, `/properties`, `/transcripts`, `/behavioral`.
- `app/static/` — pre-built troubleshooter UI served at `/`. Rebuilt from `web/`; falls back to an inline API help page if absent.
- `web/` — Vite + React + Tailwind source for the troubleshooter UI (chat, live log tail, property browser, transcript reader, behavioral signals). Yarn workspace `ai-builders-challenge-web`; dev server proxies the API on `:5100`.
- `fixtures/` — 8 property records, 8 user transcripts, per-session behavioral signals, and one pre-recorded log run.
- `tests/` — deepeval starter tests (`test_property_retrieval.py`, `test_borrower_grounding.py`, `test_logging_schema.py`). Some fail out of the box. That is the point.
- `.claude/skills/` — three BMAD-inspired agent personas (Log Analyst, Hypothesis Synthesizer, Agentic Harness Configurer) that you can invoke from Claude Code or similar.
- `cli/` — `init`, `export`, `hash` subcommands.
- `Dockerfile` + `docker-compose.yml` — container build that copies `app/` (including `static/`), installs `tests/requirements.txt`, and runs `python -m app.server` on `:5100`.
- `scripts/run_local.sh`, `scripts/tail_logs.sh` — local dev helpers.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r tests/requirements.txt
python -m cli init
cp .env.example .env   # fill in ANTHROPIC_API_KEY if you have one
./scripts/run_local.sh
```

Then open http://localhost:5100 — there is a troubleshooter UI with a chat,
live log stream, property browser, transcript reader, and behavioral signals
dashboard. The UI ships pre-built in `app/static/`. To rebuild it:

```bash
cd web && yarn install && yarn build     # or npm install && npm run build
```

For UI development with hot reload, run Flask on `:5100` and in another shell:
```bash
cd web && yarn dev                       # serves on :5173, proxies API to :5100
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
9. Record a walkthrough video (see **Submission** below).

## Submission

Submissions have two deliverables:

1. **Exported bundle** — `python -m cli export` produces a tarball of your code, tests, and a fresh log run that reflects the fix.
2. **Walkthrough video** (≈5–8 minutes) that presents your one-page story alongside a live prototype demo. Screen-record the troubleshooter UI at http://localhost:5100 and narrate:
   - The **evidence** — show the relevant transcript turns, the behavioral signal, and the seed-log event that pointed you at the problem.
   - The **hypothesis** — read the If/Then/Because claim and the test name.
   - The **failing test** — run `pytest` and show it red.
   - The **fix** — show the diff and re-run the test green.
   - The **post-fix behavior** — send a `/chat` request in the UI, open the Logs view, and point at the fields that prove the bug is gone (e.g., `retrieved_ids`, `code_hash` change).
   - The **handoff story** — hold your one-pager up on screen and walk through it end-to-end.

Any screen recorder works (QuickTime, Loom, OBS). Upload the video somewhere linkable and include the URL in your one-pager.

## Tracing deployments

Every log line carries a `code_hash` — a 12-hex fingerprint of your current commit plus any uncommitted diffs. When you deploy, the hash travels with the app. When you pull logs down, you can correlate them to the exact code that was running. Run `python -m cli hash` to see the current value.

## Exporting

Once you're happy with your version, `python -m cli export` produces a tarball of the whole bundle. Submit that tarball together with a link to your walkthrough video (see **Submission** above).
