# Agent Instructions: Terraform Infrastructure

## What This Manages

AWS infrastructure for the entire portfolio: S3 static hosting, CloudFront CDN with SPA routing, Lambda-based API (Express), API Gateway, Route53 DNS, and integration with the AI Evals ECS deployment.

## Architecture

```
CloudFront Distribution
├── Default behavior → S3 bucket (static site)
│   └── CloudFront Function: prototype_router
│       ├── SPA routing (extensionless paths → index.html)
│       ├── Subdomain routing (learningpath.cookinupideas.com)
│       └── Prototype path routing (/prototypes/{name}/*)
├── /api/* → API Gateway → Lambda (Express API proxy)
└── /ai-evals/* → ALB → ECS Fargate (Flask app, separate infra)
```

## File Map

| File | Purpose |
|------|---------|
| `main.tf` | S3 bucket, CloudFront distribution, CloudFront function for SPA routing |
| `lambda-api.tf` | Lambda function (from `shared/api/`), API Gateway, IAM roles |
| `route53.tf` | DNS records for cookinupideas.com subdomains |
| `additional-iam-policy.tf` | Extended IAM policies for cross-service access |
| `variables.tf` | Input variables (region, bucket, secrets, Claude config) |
| `outputs.tf` | Exported values (URLs, distribution ID, API keys) |
| `backend.tf` | S3 + DynamoDB state backend |
| `modules/ai-evals/` | AI Evals ECS/ALB infrastructure module |

## State Management

- **Backend**: S3 bucket `portfolio-portal-terraform-state`
- **Locking**: DynamoDB table `terraform-state-locks`
- **Key**: `environments/prod/terraform.tfstate`
- **Region**: `us-east-1`

## Key Variables

| Variable | Sensitive | Purpose |
|----------|-----------|---------|
| `bucket_name` | No | S3 bucket for static hosting |
| `aws_region` | No | AWS region (default: us-east-1) |
| `environment` | No | Environment name (default: production) |
| `jwt_secret` | Yes | API authentication |
| `api_key_salt` | Yes | API key generation |
| `claude_api_url` | No | Claude endpoint (default: api.anthropic.com) |
| `claude_model` | No | Model ID (default: claude-3-5-sonnet-20241022) |
| `api_gateway_api_key_value` | Yes | API Gateway key |
| `ai_evals_anthropic_api_key` | Yes | AI Evals Claude API key |

**Note**: The Claude API key is stored in AWS Secrets Manager (`prod/proto-portal/claude-api-key`), NOT passed as a Terraform variable.

## Commands

```bash
cd terraform/

# Initialize (first time or after backend changes)
terraform init

# Validate configuration
terraform validate

# Plan changes
terraform plan -out=tfplan.plan

# Apply (review plan first!)
terraform apply tfplan.plan

# View outputs
terraform output
terraform output -raw cloudfront_distribution_id
```

## Gotchas

- **CloudFront Function**: The `prototype_router` function handles SPA routing for all 4 prototypes by name. If you add a new prototype, update the function's hardcoded prototype list in `main.tf`.
- **Lambda packaging**: `lambda-api.tf` uses `null_resource.copy_docs` to copy API docs into `shared/api/` before zipping. The `null_resource` has `triggers = { always_run = timestamp() }` so it runs every apply.
- **Secrets Manager**: The Lambda function reads `prod/proto-portal/claude-api-key` at runtime. If you rotate the key, update it in Secrets Manager — no Terraform change needed.
- **OIDC for CI**: GitHub Actions uses role `arn:aws:iam::671388079324:role/terraform-cooking-up-ideas` for deployments, not static credentials.
- **State locking**: If a Terraform run crashes, you may need to force-unlock the state. Use `terraform force-unlock <LOCK_ID>` with caution. See `docs/TERRAFORM_STATE_DEBUG.md`.

## Making Changes

1. Always `terraform plan` before `terraform apply`
2. For destructive changes (resource replacement), confirm with the user
3. After modifying CloudFront config, remember it takes ~5 minutes to propagate globally
4. After adding/removing a prototype, update the CloudFront function's prototype list

## Related

- [Root AGENTS.md](../AGENTS.md) — Monorepo overview
- [Deploy scripts](../scripts/) — `deploy-infrastructure.sh`, `deploy-site.sh`
- [Terraform docs](docs/) — State debugging, unified infra plan
