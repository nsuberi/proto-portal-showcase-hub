# AI Evals In Context

Flask app demonstrating AI evaluations in the testing pyramid. Deployed to ECS Fargate (ARM64) at `https://portfolio.cookinupideas.com/ai-evals/`.

## Development

- Use `python3`, not `python`
- Phase config: `viewer/narrative.py` PHASES dict; navigation renders from `short_title`
- Templates: `templates/narrative/`, components: `templates/components/`
- CSS: BEM naming in `static/css/design-system.css`
- Collapsible macro: `{% from "components/collapsible.html" import collapsible %}`
- Affordances reference: `.claude/affordances.md` — read before modifying, update after

## Secrets

`ANTHROPIC_API_KEY` in local `.env` (gitignored). Copy `.env.example` to `.env`. Production uses AWS Secrets Manager.

## Linting (run before commits)

```bash
source .venv/bin/activate
black <file_or_dir>                                          # Format
flake8 --exclude .venv,__pycache__ --max-line-length 120 <file_or_dir>  # Lint
```

## Testing

```bash
source .venv/bin/activate
export $(grep -v '^#' .env | xargs)

python3 -m pytest tests/unit/ -v                # Always run
python3 -m pytest tests/e2e/ -v                 # Always run
python3 -m pytest tests/integration/ -v         # When touching AI/RAG logic
python3 -m pytest tests/security/ tests/acceptance/ -v  # When touching AI/response logic

# Full suite (excludes playwright/steelthread)
python3 -m pytest tests/unit/ tests/e2e/ tests/integration/ tests/acceptance/ tests/security/ tests/performance/ tests/ai_acceptance/ -v
```

Playwright/steelthread tests need Docker Compose (`docker compose up -d --build`, serves on localhost:5001). Use `--base-url http://localhost:5001`.

## Deploy

```bash
cd ai-testing-resource/
./scripts/deploy.sh          # Build, push to ECR, update ECS
./scripts/verify-deployment.sh  # Smoke test endpoints
```

**ARM64:** Do NOT add `--platform linux/amd64`. Native builds on Apple Silicon deploy directly. CI uses ARM64 runners.

**Proxy:** `APPLICATION_ROOT=/ai-evals` is set in ECS task def (`terraform/modules/ecs/main.tf`).

## Verify Deployment

Health check alone is insufficient — old tasks may still be running. Confirm new code is live:
```bash
aws ecs describe-services --cluster ai-testing-resource-prod --services ai-testing-resource-prod \
  --query 'services[0].deployments' --output table
aws logs tail /ecs/ai-testing-resource-prod --since 30m --follow  # If issues
```

## Terraform

State in S3 (`ai-evals-terraform-state`) with DynamoDB locking. Only required var: `TF_VAR_anthropic_api_key`. See `terraform/variables.tf` for full list.

CI/CD OIDC Role: `arn:aws:iam::671388079324:role/github-actions-terraform-bootstrap`
