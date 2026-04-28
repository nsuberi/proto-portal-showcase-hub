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
| `claude_api_url` | No | Claude endpoint (default: api.anthropic.com) |
| `claude_model` | No | Model ID (default: claude-3-5-sonnet-20241022) |
| `api_gateway_enforcement` | No | Toggle for app-layer client-key check coordination |
| `sandbox_alert_email` | No | Destination for sandbox CloudWatch + budget notifications |

**Secrets**: All sensitive values (Anthropic API key, OIDC RSA keypair, GitHub OAuth credentials) live in AWS Secrets Manager and are read by terraform via `data "aws_secretsmanager_secret_version"` blocks in `main.tf` and `research-workspace.tf`. Bootstrap them with `z_creds/bootstrap.sh`. No secret values are accepted as terraform variables — `terraform apply` only needs the deploy role assumed.

| Secret name | Consumer |
|-------------|----------|
| `portfolio-prod/anthropic-api-key` | ai-evals ECS task + shared API Lambda |
| `research-workspace-prod/oidc-private-key` | OIDC proxy Lambda |
| `research-workspace-prod/oidc-public-key` | OIDC proxy Lambda |
| `research-workspace-prod/github-oauth-client-id` | Cognito IDP + OIDC proxy Lambda |
| `research-workspace-prod/github-oauth-client-secret` | Cognito IDP + OIDC proxy Lambda |

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

- **CloudFront Function**: The `prototype_router` function handles SPA routing for all prototypes by name. If you add a new prototype, update the function's hardcoded prototype list in `main.tf`.
- **CloudFront Path Patterns**: Use `vault*` (not `vault/*`) to match both `/vault` and `/vault/anything`. The `/*` pattern requires at least a trailing slash, causing no-trailing-slash requests to fall through to the next behavior (usually S3) and return a 404 or the wrong page.
- **Lambda packaging**: `lambda-api.tf` uses `null_resource.copy_docs` to copy API docs into `shared/api/` before zipping. The `null_resource` has `triggers = { always_run = timestamp() }` so it runs every apply.
- **Secrets Manager**: The Lambda function reads `prod/proto-portal/claude-api-key` at runtime. If you rotate the key, update it in Secrets Manager — no Terraform change needed.
- **OIDC for CI**: GitHub Actions uses role `arn:aws:iam::671388079324:role/terraform-cooking-up-ideas` for deployments, not static credentials.
- **State locking**: If a Terraform run crashes, you may need to force-unlock the state. Use `terraform force-unlock <LOCK_ID>` with caution. See `docs/TERRAFORM_STATE_DEBUG.md`.

## ECS Deployment — Common Pitfalls

### 1. `ignore_changes = [task_definition]` Trap
The research-workspace ECS service uses `lifecycle { ignore_changes = [task_definition] }`. This means **`terraform apply` will NOT update the running service** even when it creates a new task definition revision. You MUST manually force a redeployment:
```bash
LATEST_TD=$(aws ecs describe-task-definition --task-definition <name> --region us-east-1 \
  --query 'taskDefinition.taskDefinitionArn' --output text)
aws ecs update-service --cluster <cluster> --service <service> \
  --task-definition "$LATEST_TD" --force-new-deployment --region us-east-1
```
**"Terraform apply succeeded" does NOT mean the container is running your latest code.** Always verify with `aws logs tail` that the new container started.

### 2. ECR Image vs Running Container
Pushing a new image to ECR does NOT automatically deploy it. ECS tasks only pull the `latest` tag when a new task starts. You need `--force-new-deployment` to trigger a new task pull.

### 3. IAM Role Credentials Don't Persist
Each shell invocation (each Bash tool call) starts a fresh shell. `eval $(aws sts assume-role ...)` only sets env vars for THAT shell. Chain all AWS commands in a single `eval ... && cmd1 && cmd2` invocation, or re-assume in each command.

### 4. Secrets via Data Sources
Cognito's GitHub IDP, the OIDC proxy Lambda, and the shared API Lambda all read their secrets via `data "aws_secretsmanager_secret_version"` blocks. If you delete a secret out of band (or before the consumer is updated), the next `terraform plan` fails with `secret not found`. To rotate or replace a secret, update the value in Secrets Manager (`aws secretsmanager put-secret-value`) and re-apply terraform — no `-var` arguments needed.

### 5. ALB Path Prefix Forwarding
The ALB forwards the FULL CloudFront path to containers (no path stripping). If CloudFront routes `/prototypes/foo/bar/*` to the ALB, the container receives requests at `/prototypes/foo/bar/endpoint`. The container must either strip the prefix or register routes with the full path.

### 6. Complete ECS Deploy Checklist
A complete ECS container deployment requires ALL of these steps:
1. Build Docker image locally
2. Tag and push to ECR
3. `terraform apply` (creates new task definition revision if config changed)
4. `aws ecs update-service --force-new-deployment` (pulls new image)
5. Wait for deployment to stabilize (check `aws ecs describe-services`)
6. Verify logs show the correct application started (`aws logs tail`)

## Making Changes

1. Always `terraform plan` before `terraform apply`
2. For destructive changes (resource replacement), confirm with the user
3. After modifying CloudFront config, remember it takes ~5 minutes to propagate globally
4. After adding/removing a prototype, update the CloudFront function's prototype list

## Related

- [Root AGENTS.md](../AGENTS.md) — Monorepo overview
- [Deploy scripts](../scripts/) — `deploy-infrastructure.sh`, `deploy-site.sh`
- [Terraform docs](docs/) — State debugging, unified infra plan
