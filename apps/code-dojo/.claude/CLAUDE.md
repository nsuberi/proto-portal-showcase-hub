# Code Dojo

Flask-based learning platform with AI-powered code review. Students submit GitHub solutions and receive feedback from Claude. Deployed at `/code-dojo/`.

## Development

- Use `python3`, not `python`
- Port: 5002
- Database: SQLite (`instance/code_dojo.db`, auto-created)
- Entry point: `app.py`
- Blueprints: `routes/` (auth, modules, submissions, admin, anatomy, scheduling, agent_harness)
- Services: `services/` (AI feedback, GitHub integration, Socratic chat, architectural analysis)
- Templates: Jinja2 in `templates/`

## Quick Start

```bash
# Direct (recommended for dev)
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 seed_data.py --smart
python3 app.py

# Docker
docker compose up -d --build
```

## Secrets

`ANTHROPIC_API_KEY` in local `.env` (gitignored). Copy `.env.example` to `.env`.

## Testing

```bash
source venv/bin/activate
python3 -m pytest tests/ -m "not playwright" -v     # Unit + integration
python3 -m pytest tests/ -m playwright --headed      # E2E (requires running app)
```

## Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@codedojo.com | admin123 |
| Instructor | instructor@codedojo.com | instructor123 |
| Student | alice@example.com | student123 |

## Skills

- `concept-to-exercise/` — Generate diagnosis exercises from concept descriptions
- `tech-diagnosis-exercise/` — Generate exercises from git commits
- `breadboarding/` — Technical shaping using Ryan Singer's methodology
