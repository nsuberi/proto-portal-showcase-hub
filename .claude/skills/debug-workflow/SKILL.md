---
name: debug-workflow
description: "Diagnose and fix GitHub Actions workflow failures across the portfolio CI/CD pipelines. Use when: (1) A workflow run failed, (2) A deploy is stuck or erroring, (3) Tests pass locally but fail in CI, (4) Terraform or Docker steps fail in Actions. Triggers include phrases like 'workflow failed', 'CI broken', 'deploy failed', 'Actions error', 'pipeline is red', 'build failed in CI', or any reference to GitHub Actions logs or run failures."
---

# Debug GitHub Workflow Skill

Systematic approach to diagnosing and resolving GitHub Actions failures in this monorepo's CI/CD pipelines.

## Workflows in This Repo

| Workflow | File | Triggers | Purpose |
|----------|------|----------|---------|
| **Deploy AI Portfolio** | `.github/workflows/deploy.yml` | Push to `main` (prototypes, shared, terraform, scripts) | Full pipeline: test -> deploy infra -> deploy site -> integration tests |
| **AI Application CI/CD** | `.github/workflows/ai-app-ci.yml` | Push to `main` (apps/ai-evals-in-context) | Docker build -> pytest -> TSR generation -> staging -> production |
| **Lint** | `.github/workflows/lint.yml` | PR and push to `main` | ESLint + design tokens + Python (black/flake8/mypy) |
| **Terraform Force Unlock** | `.github/workflows/terraform-force-unlock.yml` | Manual dispatch | Emergency Terraform state lock removal |

## Step 1: Gather Context

When the user reports a workflow failure, collect:

1. **Which workflow?** — Ask or infer from context
2. **Which job and step?** — Use `gh` to find out:

```bash
# List recent workflow runs
gh run list --limit 10

# View a specific run
gh run view <run-id>

# View failed job logs
gh run view <run-id> --log-failed

# Download full logs
gh run view <run-id> --log
```

3. **What changed?** — Check the commit that triggered it:

```bash
# See what was in the triggering commit
git log --oneline -5
git show <sha> --stat
```

## Step 2: Identify the Failure Category

### Category A: Authentication / Permissions

**Symptoms**: "Could not assume role", "Not authorized", OIDC token errors

**Workflows affected**: deploy.yml (both deploy and integration-tests jobs), ai-app-ci.yml (deploy jobs)

**Root causes**:
- OIDC trust policy doesn't match the branch/environment
- IAM role ARN mismatch — deploy.yml uses `terraform-cooking-up-ideas`, ai-app-ci.yml uses `github-actions-terraform-bootstrap`
- GitHub environment protection rules blocking the run
- Missing repository secrets or variables

**Diagnosis**:
```bash
# Check which role the workflow expects
# deploy.yml: arn:aws:iam::671388079324:role/terraform-cooking-up-ideas
# ai-app-ci.yml: arn:aws:iam::671388079324:role/github-actions-terraform-bootstrap

# Verify secrets are configured (can't see values, but can check names)
gh secret list
gh variable list
```

**Fix**: Verify the IAM role trust policy includes the repo and branch. Check that the `environment: production` is configured in GitHub repo settings with the right reviewers/rules.

---

### Category B: Terraform Errors

**Symptoms**: "Error acquiring the state lock", "Error: No configuration files", plan/apply failures

**Workflows affected**: deploy.yml (deploy job), terraform-force-unlock.yml

**Root causes**:
- **State lock**: A previous run crashed mid-apply. The lock is in DynamoDB table `terraform-state-locks`.
- **Provider/module errors**: Version drift, missing providers
- **Resource conflicts**: Manual changes outside Terraform (drift)
- **Variable errors**: Missing `TF_VAR_*` from secrets/variables

**Diagnosis**:
```bash
# Check Terraform state
cd terraform
terraform init -reconfigure -input=false
terraform plan  # See what it wants to do

# If state locked, check the lock
# The lock ID will be in the error message
```

**Fix for state locks**:
1. First, verify no other run is actually in progress: `gh run list --workflow=deploy.yml --status=in_progress`
2. If truly orphaned, use the force-unlock workflow: `gh workflow run terraform-force-unlock.yml -f lock_id=<LOCK_ID>`
3. Or manually: `cd terraform && terraform force-unlock <LOCK_ID>`

**Fix for plan/apply failures**:
- Read the Terraform error carefully — it usually names the exact resource and issue
- Check `terraform/main.tf`, `terraform/lambda-api.tf`, and `terraform/modules/ai-evals/` for the affected resource
- For drift: `terraform plan` will show what changed. Consider `terraform import` for manually-created resources.

**Required TF_VAR secrets** (deploy.yml):
- `TF_VAR_bucket_name` (from vars.BUCKET_NAME)
- `TF_VAR_aws_region` (default: us-east-1)
- `TF_VAR_environment` (default: production)
- `TF_VAR_claude_api_key`
- `TF_VAR_jwt_secret`
- `TF_VAR_api_key_salt`
- `TF_VAR_api_gateway_api_key_value`
- `TF_VAR_ai_evals_anthropic_api_key`

---

### Category C: Build / Install Failures

**Symptoms**: Yarn install errors, module not found, TypeScript compilation errors, build script failures

**Workflows affected**: deploy.yml (test and deploy jobs), lint.yml

**Root causes**:
- **Lockfile mismatch**: deploy.yml uses `yarn install --mode=update-lockfile` which can diverge from local
- **Workspace resolution**: `yarn workspaces focus` failing on missing dependencies
- **Node version**: Workflows use Node 20 — check local version matches
- **Build script**: `scripts/build.sh` builds all prototypes sequentially; one failure blocks all

**Diagnosis**:
```bash
# Reproduce locally
yarn install
yarn lint
yarn build  # or ./scripts/build.sh

# Check if a specific workspace builds
yarn workspace @proto-portal/<name> build
```

**Fix**:
- If lockfile: run `yarn install` locally and commit the updated `yarn.lock`
- If workspace: ensure the prototype is in root `package.json` workspaces array
- If TypeScript: check that `tsconfig.json` references are correct
- If build script: read `scripts/build.sh` — each prototype builds independently, identify which one fails

---

### Category D: Test Failures

**Symptoms**: Jest test failures, Playwright timeout, test assertions failing

**Workflows affected**: deploy.yml (test job, integration-tests job), ai-app-ci.yml (test-and-evaluate job)

#### D1: Jest Unit Tests (deploy.yml test job)

Tests run for all 4 prototypes:
- `@proto-portal/ffx-skill-map`
- `@proto-portal/home-lending-learning`
- `@proto-portal/documentation-explorer`
- `@proto-portal/learning-path`

**Diagnosis**:
```bash
# Run locally
yarn workspace @proto-portal/<name> test

# Check coverage artifacts from the run
gh run view <run-id> --log | grep -A 20 "FAIL"
```

#### D2: Playwright Integration Tests (deploy.yml integration-tests job)

Runs after deployment against the live site (`d37oliokys9i7z.cloudfront.net`).

**Common issues**:
- CloudFront cache serving stale content after deploy
- API Gateway URL not propagated correctly from Terraform output
- Playwright browser install missing (`npx playwright install --with-deps chromium`)
- Timeouts due to cold starts or slow CloudFront propagation

**Diagnosis**:
```bash
# Download the Playwright report artifact
gh run view <run-id> --log-failed

# Check if the site is actually updated
curl -s https://d37oliokys9i7z.cloudfront.net/ | head -20
```

#### D3: Pytest in Docker (ai-app-ci.yml)

Runs pytest inside the Docker Compose stack (postgres + redis + api).

**Common issues**:
- Docker Compose health checks timing out (120s limit)
- Database initialization failing (CI uses `tmpfs` for postgres)
- Missing `ANTHROPIC_API_KEY` secret
- Container startup order (api depends on postgres + redis healthy)

**Diagnosis**:
```bash
# Reproduce locally
cd apps/ai-evals-in-context/ai-testing-resource
docker compose -f docker-compose.yml -f docker-compose.ci.yml build
docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d
docker compose exec api pytest tests/ -v --tb=short
```

---

### Category E: Docker / Container Failures (ai-app-ci.yml)

**Symptoms**: Build failures, health check timeouts, service startup errors

**Root causes**:
- **ARM64 architecture**: CI runs on `ubuntu-24.04-arm` to match ECS Graviton. If a dependency doesn't support ARM64, it fails here.
- **Docker build cache**: No cache in CI — builds from scratch each time
- **Health check**: Waits for 3 healthy services (postgres, redis, api). The api container runs `entrypoint.sh` which does DB init + seed before starting Flask.
- **TSR generation**: `scripts/generate_tsr.py` parses pytest XML results. If tests produce unexpected output format, TSR fails.

**Diagnosis**:
```bash
# Check container logs from the workflow
gh run view <run-id> --log | grep -A 50 "Container Status"
gh run view <run-id> --log | grep -A 50 "API Container Logs"
```

---

### Category F: Deployment Failures

**Symptoms**: S3 sync fails, CloudFront invalidation fails, site not updating

**Workflows affected**: deploy.yml (deploy job)

**Root causes**:
- S3 bucket permissions changed
- CloudFront distribution ID mismatch (read from Terraform output)
- `PLACEHOLDER_API_GATEWAY_URL` not replaced in built files
- `scripts/deploy-site.sh` depends on Terraform outputs being available

**Diagnosis**:
```bash
# Check what deploy-site.sh does
cat scripts/deploy-site.sh

# Verify Terraform outputs
cd terraform && terraform output
```

---

### Category G: Lint Failures

**Symptoms**: ESLint errors, design token violations, Python formatting issues

**Workflows affected**: lint.yml, deploy.yml (test job via `yarn lint`)

**Sub-categories**:

| Linter | Command | Fix |
|--------|---------|-----|
| ESLint | `yarn lint:code` | Fix violations in source, or update `eslint.config.js` |
| Design tokens | `yarn lint:tokens` | Replace hardcoded hex/rgb with design token CSS vars. Escape hatch: `// design-token-lint-ignore` |
| black | `yarn lint:python --fix` | Auto-format Python files |
| flake8 | `yarn lint:python` | Fix style violations manually |
| mypy | `yarn lint:python` | Fix type errors |

**Diagnosis**:
```bash
# Run locally to see exact errors
yarn lint
# Or individually:
yarn lint:code
yarn lint:tokens
yarn lint:python
```

## Step 3: Fix and Verify

1. **Fix locally** — reproduce the failure, apply the fix
2. **Test locally** — run the same commands the workflow runs
3. **Push to a branch** — verify the fix in CI before merging to main
4. **Re-run if transient** — `gh run rerun <run-id>` for flaky failures (but investigate why it's flaky)

## Quick Reference: Re-running Workflows

```bash
# Re-run all failed jobs
gh run rerun <run-id> --failed

# Re-run a specific workflow manually
gh workflow run deploy.yml

# Cancel a stuck run
gh run cancel <run-id>
```

## Quick Reference: Key Secrets and Variables

| Secret/Variable | Used By | Purpose |
|-----------------|---------|---------|
| `CLAUDE_API_KEY` | deploy.yml | Claude API for Lambda proxy |
| `JWT_SECRET` | deploy.yml | API authentication |
| `API_KEY_SALT` | deploy.yml | API key hashing |
| `API_GATEWAY_API_KEY` | deploy.yml | API Gateway usage plan key |
| `ANTHROPIC_API_KEY` | ai-app-ci.yml, deploy.yml | AI Evals Anthropic API access |
| `TSR_API_URL` | ai-app-ci.yml | Where to upload Test Summary Reports |
| `TSR_API_TOKEN` | ai-app-ci.yml | Auth for TSR upload |
| `BUCKET_NAME` (var) | deploy.yml | S3 bucket for site content |
| `AWS_REGION` (var) | deploy.yml | AWS region (default: us-east-1) |
