#!/usr/bin/env bash
# Sync the research workspace's ANTHROPIC_API_KEY from its local .env into AWS
# Secrets Manager, where the ECS task reads it at launch (injected as
# ANTHROPIC_API_KEY via the task definition's `secrets` block).
#
# Run this BEFORE `terraform plan/apply` (the module reads the secret via a data
# source) and before forcing an ECS redeploy. The key value is never printed.
#
# Usage:
#   export AWS_PROFILE=deploy        # assumes terraform-cooking-up-ideas role
#   ./scripts/research-workspace-sync-key.sh
#   # or: cd apps/research-workspace && npm run sync-key
#
# Env overrides: RW_ENV_FILE (path to .env), AWS_REGION (default us-east-1).

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
SECRET_NAME="research-workspace-prod/anthropic-api-key"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${RW_ENV_FILE:-$SCRIPT_DIR/../prototypes/research-workspace/.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: env file not found: $ENV_FILE" >&2
  echo "       Set RW_ENV_FILE or create prototypes/research-workspace/.env with ANTHROPIC_API_KEY=..." >&2
  exit 1
fi

# Extract ANTHROPIC_API_KEY without sourcing the whole file or echoing the value.
# Handles optional `export `, surrounding single/double quotes, and CRLF endings.
KEY="$(grep -E '^[[:space:]]*(export[[:space:]]+)?ANTHROPIC_API_KEY=' "$ENV_FILE" \
  | tail -n1 \
  | sed -E 's/^[[:space:]]*(export[[:space:]]+)?ANTHROPIC_API_KEY=//' \
  | tr -d '\r' \
  | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/')"

if [ -z "${KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY is empty or missing in $ENV_FILE" >&2
  exit 1
fi

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "ERROR: AWS credentials not configured. Run: export AWS_PROFILE=deploy" >&2
  exit 1
fi

if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "↻  Updating $SECRET_NAME ..."
  aws secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --secret-string "$KEY" \
    --region "$REGION" >/dev/null
else
  echo "+  Creating $SECRET_NAME ..."
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "Operator Anthropic API key for the research workspace agent (sourced from prototypes/research-workspace/.env)" \
    --secret-string "$KEY" \
    --region "$REGION" >/dev/null
fi

echo "✓  Synced ANTHROPIC_API_KEY → $SECRET_NAME ($REGION). Key length: ${#KEY} chars."
