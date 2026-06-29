# Manual Deploy from a Fresh Machine

This is the recipe for bootstrapping the AWS Secrets Manager secrets
(`z_creds/` folder) and running a manual `terraform apply` from a machine
that hasn't done a deploy before. Follow this when CI/CD is broken or you
need to deploy out-of-band.

The `z_creds/` folder is gitignored — every file in this doc must be
recreated on the new machine. Nothing about secrets ever lives in the repo.

---

## Prerequisites

| Tool | Why | Install on macOS |
|------|-----|------------------|
| `aws` CLI v2 | Assume role + read/write secrets | `brew install awscli` |
| `terraform` ≥ 1.6 | Apply infra | `brew install terraform` |
| `python3` | Used by the assume-role one-liner | Built-in or `brew install python3` |
| `openssl` | Generate the OIDC RSA keypair | Built-in |
| `gh` (optional) | PR / repo-secret cleanup | `brew install gh` |

You also need:

- The `nsuberi` IAM user's access key + secret (run `aws configure`)
- That user's policy must allow `sts:AssumeRole` on the
  `terraform-cooking-up-ideas` role (already configured)
- The GitHub OAuth client secret for the `research-workspace` OAuth App
  (github.com/settings/developers → OAuth Apps → research-workspace)

---

## Step 1 — Create the `z_creds/` folder

The repo's `.gitignore` already excludes `z_creds/`. Anything you put here
won't commit.

```bash
cd /path/to/clone/of/ai-prototype-hub
mkdir -p z_creds
cd z_creds
```

---

## Step 2 — Recreate the bootstrap files

Save these three files exactly as shown.

### `z_creds/secrets.env.example`

```bash
# z_creds/secrets.env — values that bootstrap.sh writes into AWS Secrets Manager.
#
# 1. Copy this file:    cp secrets.env.example secrets.env
# 2. Fill in the values.
# 3. Run:               bash bootstrap.sh
#
# This file is gitignored (the entire z_creds/ folder is). Do not move it.

# --- Anthropic API key (shared across ai-evals + shared API Lambda) ----------
# Single key used by both consumers. Leave blank to let bootstrap.sh import the
# existing value from ai-testing-resource-prod/anthropic-api-key in AWS Secrets
# Manager (populated by past terraform applies).
#
# Note: the research-workspace ECS task uses a SEPARATE, scoped secret
# (research-workspace-prod/anthropic-api-key) sourced from
# prototypes/research-workspace/.env via scripts/research-workspace-sync-key.sh.
# This shared key below is only for ai-evals + the shared API Lambda.
ANTHROPIC_API_KEY=

# --- GitHub OAuth App (research workspace login) -----------------------------
# From github.com/settings/developers → OAuth Apps → "research-workspace" app.
# Default below is what HANDOFF.md recorded on 2026-04-11; confirm still current.
GITHUB_OAUTH_CLIENT_ID=Ov23limPUjSbaPOZ4PFW
GITHUB_OAUTH_CLIENT_SECRET=

# OIDC RSA keypair lives at private.pem / public.pem in this folder.
# bootstrap.sh generates them on first run if missing. No env values needed.
```

### `z_creds/bootstrap.sh`

```bash
#!/usr/bin/env bash
# bootstrap.sh — Create or update the 5 secrets in AWS Secrets Manager that
# the portfolio infrastructure needs. Idempotent: re-running updates values.
#
# Prerequisites:
#   1. Select the deploy profile (assumes the role automatically; no creds printed):
#        export AWS_PROFILE=deploy
#      (one-time setup of the profile is documented under "Assume the deploy role" below)
#   2. Copy secrets.env.example to secrets.env and fill in the values.
#   3. Run: bash bootstrap.sh

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/secrets.env"
PRIVATE_PEM="$SCRIPT_DIR/private.pem"
PUBLIC_PEM="$SCRIPT_DIR/public.pem"

# ----------------------------------------------------------------------------
# 1. Sanity checks
# ----------------------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found." >&2
  echo "       cp secrets.env.example secrets.env  # then fill it in" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "Verifying AWS access..."
CALLER=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null) || {
  echo "ERROR: AWS credentials not configured. Run the assume-role command (see header)." >&2
  exit 1
}
echo "  Authenticated as: $CALLER"
echo ""

# ----------------------------------------------------------------------------
# 2. Generate PEM keypair if missing
# ----------------------------------------------------------------------------
if [ ! -f "$PRIVATE_PEM" ] || [ ! -f "$PUBLIC_PEM" ]; then
  echo "Generating fresh OIDC RSA keypair (2048-bit)..."
  openssl genrsa -out "$PRIVATE_PEM" 2048 2>/dev/null
  openssl rsa -in "$PRIVATE_PEM" -pubout -out "$PUBLIC_PEM" 2>/dev/null
  chmod 600 "$PRIVATE_PEM"
  echo "  Wrote: $PRIVATE_PEM"
  echo "  Wrote: $PUBLIC_PEM"
  echo ""
fi

# ----------------------------------------------------------------------------
# 3. Inference: pull existing Anthropic key from AWS if env is empty
# ----------------------------------------------------------------------------
fetch_existing() {
  aws secretsmanager get-secret-value \
    --secret-id "$1" \
    --region "$REGION" \
    --query SecretString \
    --output text 2>/dev/null || echo ""
}

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "Importing ANTHROPIC_API_KEY from existing AWS Secrets Manager..."
  ANTHROPIC_API_KEY="$(fetch_existing "ai-testing-resource-prod/anthropic-api-key")"
  if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "  Imported (existing value preserved)"
  else
    echo "  No existing value found — paste a value into secrets.env"
  fi
  echo ""
fi

# ----------------------------------------------------------------------------
# 4. Validation
# ----------------------------------------------------------------------------
require() {
  if [ -z "${!1:-}" ]; then
    echo "ERROR: $1 is empty after env file load and AWS import." >&2
    echo "       Edit $ENV_FILE and re-run." >&2
    exit 1
  fi
}

require ANTHROPIC_API_KEY
require GITHUB_OAUTH_CLIENT_ID
require GITHUB_OAUTH_CLIENT_SECRET

# ----------------------------------------------------------------------------
# 5. Upsert helper
# ----------------------------------------------------------------------------
upsert() {
  local name="$1"
  local value="$2"
  local description="$3"

  if aws secretsmanager describe-secret --secret-id "$name" --region "$REGION" >/dev/null 2>&1; then
    echo "  ↻  $name"
    aws secretsmanager put-secret-value \
      --secret-id "$name" \
      --secret-string "$value" \
      --region "$REGION" \
      >/dev/null
  else
    echo "  +  $name"
    aws secretsmanager create-secret \
      --name "$name" \
      --description "$description" \
      --secret-string "$value" \
      --region "$REGION" \
      >/dev/null
  fi
}

# ----------------------------------------------------------------------------
# 6. Provision the 5 secrets
# ----------------------------------------------------------------------------
echo "Provisioning AWS Secrets Manager secrets in $REGION:"
echo "  +  = create   ↻  = update existing"
echo ""

upsert "research-workspace-prod/oidc-private-key" \
       "$(cat "$PRIVATE_PEM")" \
       "RSA private key — OIDC proxy Lambda signs id_tokens with this"

upsert "research-workspace-prod/oidc-public-key" \
       "$(cat "$PUBLIC_PEM")" \
       "RSA public key — published at JWKS endpoint for Cognito to verify id_tokens"

upsert "research-workspace-prod/github-oauth-client-id" \
       "$GITHUB_OAUTH_CLIENT_ID" \
       "GitHub OAuth App client ID — Cognito IDP + OIDC proxy Lambda"

upsert "research-workspace-prod/github-oauth-client-secret" \
       "$GITHUB_OAUTH_CLIENT_SECRET" \
       "GitHub OAuth App client secret — Cognito IDP + OIDC proxy Lambda"

upsert "portfolio-prod/anthropic-api-key" \
       "$ANTHROPIC_API_KEY" \
       "Anthropic API key — shared between ai-evals ECS task and shared API Lambda"

echo ""
echo "✓  All 5 secrets provisioned in AWS Secrets Manager (region: $REGION)."
```

Make the script executable:

```bash
chmod +x z_creds/bootstrap.sh
```

---

## Step 3 — Fill in `secrets.env`

```bash
cd z_creds
cp secrets.env.example secrets.env
$EDITOR secrets.env
```

Required: paste `GITHUB_OAUTH_CLIENT_SECRET` (from the GitHub OAuth app
settings page).

Optional (will auto-import from existing AWS state if blank):

- `ANTHROPIC_API_KEY` — bootstrap reads
  `ai-testing-resource-prod/anthropic-api-key` from Secrets Manager and
  re-uses that value, since past terraform applies populated it.

If the previous secret has been deleted (e.g., on a fresh AWS account) you
must paste a value yourself.

---

## Step 4 — Assume the deploy role (via a named profile)

You need `nsuberi` IAM user credentials configured first (`aws configure` → stored in `~/.aws/credentials`
under the `default` profile). Then create a `deploy` profile **once**; the CLI assumes the role
automatically on every call, so **no credential values are ever printed to stdout** (nothing leaks into
shell history or agent transcripts):

```bash
aws configure set role_arn       arn:aws:iam::671388079324:role/terraform-cooking-up-ideas --profile deploy
aws configure set source_profile default      --profile deploy
aws configure set region         us-east-1     --profile deploy
```

Per session, just select the profile:

```bash
export AWS_PROFILE=deploy
```

> ⚠️ Do **not** use `eval $(aws sts assume-role ... | python3 -c "print('export AWS_SECRET_ACCESS_KEY=...')")`.
> That echoes the live secret into the transcript. The profile approach keeps it out of process output
> entirely and re-assumes the role automatically on each command (so credentials "persist" across shells).

Verify:

```bash
aws sts get-caller-identity
# Arn should end in: assumed-role/terraform-cooking-up-ideas/<your-session>
```

The shell with the `AWS_*` env vars stays good for ~1 hour.

---

## Step 5 — Run the bootstrap

```bash
bash bootstrap.sh
```

Output should show `+` (create) or `↻` (update) for 5 secrets, then a
success line. Verify:

```bash
aws secretsmanager list-secrets --region us-east-1 \
  --query 'SecretList[?starts_with(Name, `research-workspace-prod/`) || starts_with(Name, `portfolio-prod/`)].[Name,LastChangedDate]' \
  --output table
```

---

## Step 6 — Run terraform apply

```bash
cd ../terraform
terraform init
terraform plan -out=tfplan
```

**Review the plan carefully.** Expected high-impact changes on a first
post-migration apply:

| Change | Why |
|--------|-----|
| `aws_cognito_identity_provider.github` (re)created | Past applies destroyed it; restoring auth |
| `aws_lambda_function.github_oidc_proxy` env vars updated | Now sourced from Secrets Manager data sources |
| `aws_lambda_function.ai_api` env vars updated | Drop `JWT_SECRET`/`API_KEY_SALT`, point `CLAUDE_SECRET_NAME` at `portfolio-prod/anthropic-api-key` |
| `aws_iam_role.terraform_role` trust policy updated | Repo renamed to `ai-prototype-hub` |
| `aws_iam_role.github_actions_anthropic_reader` created | New narrow-scope role for Claude Code workflows |
| Multiple `aws_secretsmanager_secret` destroyed | `ai-testing-resource-prod/anthropic-api-key`, `research-workspace-prod/anthropic-api-key`, all 5 code-dojo secrets |
| All `module.code_dojo.*` destroyed | ECS service, ECR repo, log group, ALB rule, target group, IAM roles, etc. |
| Various `aws_api_gateway_*` & `aws_cloudfront_distribution` updated | Removing the `/code-dojo/*` cache behavior; CloudFront invalidation may take 5–15 min |

If the plan shows additional unexpected changes, stop and inspect. Run with
`-detailed-exitcode` or `terraform show -json tfplan | jq` for closer
review.

Apply:

```bash
terraform apply tfplan
```

The apply takes 10–20 minutes (most of that is CloudFront propagation
from the code-dojo cache-behavior removal).

---

## Step 7 — Verify auth works

Open the deployed research workspace in a fresh incognito window:

```
https://portfolio.cookinupideas.com/prototypes/research-workspace/vault/
```

Click "Sign in with GitHub". You should be redirected to GitHub's OAuth
prompt, then back through the OIDC proxy, then into the workspace. If
something fails, check:

```bash
aws logs tail /aws/lambda/github-oidc-proxy --follow --region us-east-1
```

Common failure modes and remedies are documented in
`prototypes/research-workspace/HANDOFF.md`.

---

## Step 8 — Confirm CI works

Push any small change to `main` (or trigger `Deploy AI Portfolio` workflow
via `workflow_dispatch`) and confirm it succeeds. The trust policy is now
correct, so OIDC should grant temporary credentials and the deploy should
run end-to-end.

---

## Step 9 — Cleanup (optional)

Once everything works:

```bash
# Remove redundant GitHub repo secrets
for s in ANTHROPIC_API_KEY CLAUDE_API_KEY JWT_SECRET API_KEY_SALT \
         API_GATEWAY_API_KEY TSR_API_TOKEN TSR_API_URL \
         AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY ; do
  gh secret delete "$s" 2>/dev/null
done

# Shred local secret files (or leave for next time — z_creds/ is gitignored)
shred -u z_creds/private.pem z_creds/public.pem z_creds/secrets.env
```

---

## Reference: the 5 secrets the bootstrap creates

| Secret name | Consumer |
|-------------|----------|
| `portfolio-prod/anthropic-api-key` | ai-evals ECS task + shared API Lambda |
| `research-workspace-prod/oidc-private-key` | OIDC proxy Lambda |
| `research-workspace-prod/oidc-public-key` | OIDC proxy Lambda |
| `research-workspace-prod/github-oauth-client-id` | Cognito IDP + OIDC proxy Lambda |
| `research-workspace-prod/github-oauth-client-secret` | Cognito IDP + OIDC proxy Lambda |

### Separate: research-workspace agent key

The research-workspace ECS task reads its own Anthropic key from
`research-workspace-prod/anthropic-api-key`. It is **not** created by
`bootstrap.sh` — it's sourced from `prototypes/research-workspace/.env` and
synced with a dedicated script (so the key lives in one place for both local dev
and deploy):

```bash
export AWS_PROFILE=deploy
./scripts/research-workspace-sync-key.sh      # reads prototypes/research-workspace/.env
```

Run this **before** `terraform plan/apply` (the module reads the secret via a
data source) and again whenever you rotate the key, followed by an ECS
force-deploy (Layer 3 in `prototypes/research-workspace/AGENTS.md`).
