# Inference Insights: Automated Research Gallery

An automated research gallery that runs Claude Code 4x daily, exploring inference engineering papers from arXiv and generating illustrated insights. Each insight connects distributed systems concepts to Nathan's experience as a Big Data ML Engineer at FINRA, with cross-domain connections to music/signal processing and architecture.

**Live at:** `portfolio.cookinupideas.com/prototypes/inference-insights/`

## How It Works

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  LaunchAgent     │────▶│ session.sh   │────▶│ Claude Code  │
│  4x daily        │     │ orchestrator │     │ (Sonnet, -p) │
│  7am/11am/3pm/8pm│     │              │     │              │
└─────────────────┘     └──────┬───────┘     └──────┬───────┘
                               │                     │
                               │  git commit + push   │  reads arXiv API
                               │  deploy-site.sh      │  writes .md + .cells.json
                               ▼                     ▼
                        ┌──────────────┐     ┌──────────────┐
                        │ Production   │     │ Local repo   │
                        │ portfolio    │     │ content/     │
                        │ site (S3+CF) │     │ data/        │
                        └──────────────┘     └──────────────┘
```

## Token Cost Predictions

| Metric | Estimate |
|--------|----------|
| Per session | ~10K input + ~6K output tokens ≈ **$0.24** (Opus 4.6 rates: $15/M in, $75/M out) |
| Daily (4 sessions) | **~$0.96** |
| Monthly | **~$29** |
| Safety cap | `--max-budget-usd 0.50` per session |

If using Claude Code Max subscription, sessions consume rate limit quota instead of per-token billing.

## Scheduling

**macOS LaunchAgent** at `~/Library/LaunchAgents/com.cookinupideas.inference-insights.plist`

| Time | Purpose |
|------|---------|
| 7:00 AM | Morning session |
| 11:00 AM | Midday session |
| 3:00 PM | Afternoon session |
| 8:00 PM | Evening session |

```bash
# Install (one-time)
launchctl load ~/Library/LaunchAgents/com.cookinupideas.inference-insights.plist

# Unload
launchctl unload ~/Library/LaunchAgents/com.cookinupideas.inference-insights.plist

# Manual trigger
./scripts/inference-insights-session.sh

# Check status
launchctl list | grep inference
```

## Monitoring

```bash
# Recent session output
tail -100 /tmp/inference-insights.log

# Check for errors
grep -i error /tmp/inference-insights.err

# Session history via git
git log --oneline --grep="inference-insights"

# Session count (from memory.json)
cat prototypes/inference-insights/data/memory.json | python3 -c "import json,sys; print(json.load(sys.stdin)['totalSessions'])"
```

## Feedback Transfer: Production → Local

1. **User interacts** with gallery on production site (favorite, dismiss, request topic)
2. **App POSTs** feedback to API Gateway → Lambda writes to S3
3. **Before each session**, script runs `aws s3 cp` to download latest feedback
4. **Claude Code reads** feedback and adjusts research directions accordingly

## Security

| Concern | Mitigation |
|---------|------------|
| Source restriction | **arXiv API only** — no open web search |
| Tool restriction | `Read`, `Write`, `Edit`, `WebFetch` only — no `Bash`, no `WebSearch` |
| Budget cap | `--max-budget-usd 0.50` per session |
| File scope | Writes scoped to `content/` and `data/` directories only |
| Credentials | No secrets in LaunchAgent plist; IAM role assumed in script |

## Development

```bash
yarn dev:inference-insights    # Dev server on port 3009
yarn build:inference-insights  # Production build
```

## Content Format

Each insight produces two complementary files:

- **Narrative** (`.md`) — Conceptual explanation with FINRA parallels and cross-domain connections
- **Code cells** (`.cells.json`) — Interactive code canvases with simulated output (stream/dataframe/chart/json)

This mirrors the ai-evals workshop pattern without requiring Jupyter as a dependency.
