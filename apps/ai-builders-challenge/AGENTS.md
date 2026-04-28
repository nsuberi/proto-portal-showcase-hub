# AGENTS.md — AI Builders Challenge

Terse navigation for coding agents. Treat this as source-of-truth for layout and commands; see `README.md` for participant-facing framing and `FACILITATOR.md` for workshop leads (do NOT spoil the embedded bug for participants).

## What this is

A 4-hour shaped challenge: a Flask borrower-agent with a subtle retrieval bug. Participants triangulate transcripts + behavioral signals + JSONL logs, write a failing test, fix the bug, and re-verify via fresh logs. The bug is intentional — do not "fix" it unprompted.

## Layout

```
app/                  Flask borrower-agent (Python 3.11)
  server.py           Entrypoint. Routes: /health /chat /logs /properties
                      /transcripts[/<id>] /behavioral + SPA fallback at /
  agent.py            respond(session_id, property_id, message) orchestrator
  retrieval.py        TF-IDF over property KB            ← contains the bug
  kb.py               In-memory property knowledge base loader
  llm_client.py       Anthropic client + offline stub
  logger.py           Structured JSONL logger; contextvar session/span binding;
                      in-memory 2000-event ring buffer
  codehash.py         12-hex fingerprint of commit + uncommitted diff
  prompts/            borrower_system.md, borrower_grounding.md
  static/             Pre-built SPA (committed). Copied into Docker image.

web/                  Vite + React + Tailwind source (yarn workspace)
  src/App.tsx         Top-level router between views
  src/components/     app-shell, header, sidebar, ui/* primitives
  src/views/          chat, logs, properties, transcripts, behavioral
  src/lib/api.ts      Fetch helpers; dev proxy → :5100
  vite.config.ts      Build outDir → ../app/static; dev proxy config

tests/                pytest + deepeval
  test_property_retrieval.py   Retrieval correctness (fails until bug fixed)
  test_borrower_grounding.py   Faithfulness / address-leakage offline proxy
  test_logging_schema.py       Log structure contract
  conftest.py                  Fixtures
  requirements.txt             Runtime + test deps (used by Dockerfile too)

fixtures/
  properties.json              8 property records
  transcripts/session_*.jsonl  8 user transcripts
  behavioral.json              Per-session signals
  seed_logs/run_2026-04-15.jsonl   Pre-recorded log run (buggy behavior)

cli/__main__.py       `python -m cli {init,export,hash}`
scripts/              run_local.sh, tail_logs.sh
.claude/skills/       log-analyst, hypothesis-synthesizer,
                      agentic-harness-configurer
Dockerfile            python:3.11-slim; copies app/ fixtures/ cli/ scripts/
docker-compose.yml    Local container orchestration
```

## Commands

```bash
# Backend (from this directory)
python -m venv .venv && source .venv/bin/activate
pip install -r tests/requirements.txt
./scripts/run_local.sh              # Flask on :5100
pytest tests/ -v
python -m cli hash                  # current code_hash

# Frontend
cd web && yarn install
yarn build                          # writes to ../app/static/
yarn dev                            # :5173, proxies API calls to :5100

# Container
docker compose up --build           # serves :5100 with whatever is in app/static/
```

Rebuild `app/static/` before committing UI changes — the Dockerfile does NOT run a node build. The pre-built bundle is the deploy artifact.

## Conventions

- **Python**: black (default line length), flake8 `--max-line-length 120 --extend-ignore E501,W503`. The repo's pre-commit hook enforces this on staged `.py`.
- **Logs**: every event is one JSON line to stdout; `code_hash` + (when bound) `session_id` + `span_id` are added automatically by `logger.event`. Use `logger.bind_context(session_id, span_id)` at request entry and `logger.clear_context()` at exit — don't thread them through kwargs.
- **Design tokens**: web UI uses Tailwind directly (local to this prototype); it does NOT consume `shared/design-tokens/` — the parent repo's token lint is scoped elsewhere.
- **Do not** edit `fixtures/seed_logs/run_2026-04-15.jsonl` — it's the canonical "before" evidence participants analyze.
- **Do not** rewrite `app/retrieval.py` to fix the bug unless explicitly asked. The bug is the point of the exercise.

## Dev server ports

| Service          | Port |
|------------------|------|
| Flask backend    | 5100 |
| Vite dev server  | 5173 |

## Submission (participant deliverable)

Two artifacts: (1) tarball from `python -m cli export`, (2) 5–8 min walkthrough video presenting the one-pager story alongside a live prototype demo (chat round-trip + Logs view before/after fix). See `README.md` §Submission for the narration outline.

## When editing

- Backend route changes → update `web/src/lib/api.ts` and the matching view.
- New log fields → consider whether `test_logging_schema.py` needs an assertion.
- Web build output lands in `app/static/`; commit both the source change and the rebuilt bundle in the same commit so Docker deploys stay in sync.
- Participant-facing language lives in `README.md`; facilitator-only details (bug location, rubric) live in `FACILITATOR.md`.
