# Plan: Inference Insights — Cloud Scheduled Task with S3/DynamoDB Backend

## Context

The inference-insights research loop (4x/day arXiv content generation) is broken locally due to macOS TCC permissions. We're migrating to a Claude Code Cloud Scheduled Task that uses the Max plan ($0 extra), reads the repo for reference files only, and writes generated content to S3 + DynamoDB — no git push.

Before building, this plan includes a security review of the cloud credential posture.

---

## Security Review: Cloud Task Credential Handling

### How Anthropic Cloud VMs Handle Credentials

| Aspect | Finding | Risk Level |
|--------|---------|------------|
| **Env var storage** | Stored in environment config; visible to anyone who can edit the environment. No dedicated secrets store. | High |
| **Encryption at rest** | Not confirmed in docs. Conservative assumption: not encrypted beyond standard infrastructure. | Medium |
| **Autonomous execution** | Cloud tasks run without permission prompts — agent can run any command without human approval. | High |
| **VM isolation** | Each run gets a fresh, dedicated VM. Terminated after completion. | Good |
| **Network access** | Goes through Anthropic's security proxy. Trusted mode allows `*.amazonaws.com`. | Medium |
| **Session logging** | All operations logged. Session output visible in your account, potentially to Anthropic staff during support. | Medium |
| **Prompt injection** | External data (arXiv, DynamoDB) could contain adversarial instructions. Agent has no approval gate. | High |
| **Multi-tenancy** | Isolated VMs per task, not shared. | Good |
| **Credential rotation** | No built-in rotation. Same env vars across all runs. | Medium |

### Key Risk: Credential Exfiltration

The autonomous agent could — via prompt injection or unintended behavior — print credentials to logs, use them for unintended API calls, or send them to external hosts (if network access allows). There is no human-in-the-loop gate for cloud task commands.

### Mitigation Architecture: Assume-Role Chain

Instead of putting powerful credentials directly in env vars, we use a **two-tier credential architecture**:

```
Tier 1: IAM User (in env vars)
  └─ Can ONLY do: sts:AssumeRole on one specific role
  └─ Cannot access S3, DynamoDB, CloudFront, or any other service

Tier 2: IAM Role (assumed at runtime via setup script)
  └─ Append-only permissions: S3 PutObject, DynamoDB PutItem/UpdateItem, CloudFront CreateInvalidation
  └─ No delete permissions anywhere
  └─ Session duration: 1 hour (expires if leaked)
  └─ Trust policy: only the Tier 1 IAM user can assume it
```

**Why this helps:**
- If the Tier 1 access keys leak, the attacker can only assume a role with append-only access to one S3 prefix and one DynamoDB table — for at most 1 hour
- The role cannot delete content, drop tables, or modify infrastructure
- CloudTrail logs every AssumeRole call and every subsequent API call
- Keys can be rotated independently of the role permissions

### IAM Role Policy: `inference-insights-append-only`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3AppendContent",
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::portfolio-portal-code/prototypes/inference-insights/*"
    },
    {
      "Sid": "S3ReadState",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::portfolio-portal-code/prototypes/inference-insights/*",
        "arn:aws:s3:::portfolio-cooking-up-ideas/inference-insights/*"
      ]
    },
    {
      "Sid": "S3ListContentPrefix",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::portfolio-portal-code",
      "Condition": {
        "StringLike": {
          "s3:prefix": "prototypes/inference-insights/*"
        }
      }
    },
    {
      "Sid": "DynamoDBAppend",
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem", "dynamodb:Query"],
      "Resource": "arn:aws:dynamodb:us-east-1:671388079324:table/inference-insights"
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::671388079324:distribution/*"
    }
  ]
}
```

**Explicitly NOT included:** `s3:DeleteObject`, `s3:DeleteBucket`, `dynamodb:DeleteItem`, `dynamodb:DeleteTable`, `s3:PutBucketPolicy`, `iam:*`, `cloudfront:DeleteDistribution`.

### IAM User Policy: `inference-insights-assume-only`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::671388079324:role/inference-insights-append-only"
    }
  ]
}
```

### Role Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::671388079324:user/inference-insights-research"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "NumericLessThanEquals": {
          "aws:MaxSessionDuration": "3600"
        }
      }
    }
  ]
}
```

### Setup Script (runs once per cloud task session)

The cloud task's environment setup script assumes the role and exports temporary credentials:

```bash
# Assume the scoped role (Tier 1 keys → Tier 2 temp credentials)
CREDS=$(aws sts assume-role \
  --role-arn "arn:aws:iam::671388079324:role/inference-insights-append-only" \
  --role-session-name "insights-$(date +%s)" \
  --duration-seconds 3600 \
  --output json)

# Export temporary credentials (expire in 1 hour)
export AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $CREDS | jq -r '.Credentials.SessionToken')
export AWS_DEFAULT_REGION=us-east-1
```

### Additional Hardening

- **S3 versioning** enabled on the content prefix — even if something is overwritten, previous versions are recoverable
- **CloudTrail** already logging all API calls in the account
- **DynamoDB point-in-time recovery** enabled — can restore table to any second in the last 35 days
- **Key rotation**: Schedule quarterly rotation of the Tier 1 IAM user access keys
- **CloudWatch alarm**: Alert on unexpected API calls from the role (e.g., any action not in the allow list, or calls from unexpected IPs)

### Residual Risks (Accepted)

| Risk | Severity | Acceptance Rationale |
|------|----------|---------------------|
| Anthropic VMs clone the repo | Low | Portfolio project, no proprietary secrets |
| Agent could write adversarial content to S3 | Low | Content is append-only; reviewable; S3 versioning allows rollback |
| Temp credentials could be logged in session output | Low | 1-hour TTL, append-only scope, CloudTrail monitoring |
| Prompt injection via arXiv metadata | Low | Blast radius is appending to one S3 prefix + one DynamoDB table |

---

## Architecture

```
Claude Code Cloud Scheduled Task (Max plan, 4x/day cron)
  │
  ├─ Setup script: assume-role → temp credentials (1hr TTL)
  ├─ Clones repo (read-only — for system prompt + reference files)
  ├─ Reads research state from DynamoDB
  ├─ Reads user feedback from DynamoDB
  ├─ Queries arXiv API via WebFetch
  ├─ Generates 2-3 insights
  ├─ Writes .md + .cells.json to S3 (same CloudFront paths frontend expects)
  ├─ Writes updated insights-index.json to S3
  ├─ Updates DynamoDB (memory, session count, directions, index metadata)
  └─ Invalidates CloudFront for content paths

Frontend (unchanged):
  fetch(BASE_URL + "data/insights-index.json")       →  S3 via CloudFront
  fetch(BASE_URL + "content/insights/SLUG.md")        →  S3 via CloudFront
  fetch(BASE_URL + "content/insights/SLUG.cells.json") →  S3 via CloudFront

New API endpoint (future):
  GET /api/v1/inference-insights/index  →  DynamoDB query (filterable)
```

## Implementation Steps

### Step 1: Terraform — IAM + DynamoDB + S3 versioning

**Create:** `terraform/inference-insights-research.tf`

Resources:
- `aws_iam_role.inference_insights_append_only` — append-only role with policy above
- `aws_iam_user.inference_insights_research` — assume-only user
- `aws_iam_user_policy.inference_insights_assume` — sts:AssumeRole only
- `aws_iam_access_key.inference_insights_research` — access keys (store in Secrets Manager)
- `aws_secretsmanager_secret.inference_insights_credentials` — stores the access key pair
- `aws_dynamodb_table.inference_insights` — research state + metadata table
  - pk (String), sk (String), on-demand billing, point-in-time recovery enabled
- `aws_s3_bucket_versioning.inference_insights_content` — enable versioning on the bucket (if not already)

### Step 2: Create the cloud task prompt

**Create:** `scripts/inference-insights-cloud-prompt.md`

Instructs the cloud task to:
1. Read `scripts/inference-insights-prompt.md` for research guidelines
2. Read state from DynamoDB via `aws dynamodb get-item`
3. Query arXiv via WebFetch
4. Generate insights (markdown + cells JSON)
5. Upload to S3 via `aws s3 cp`
6. Update DynamoDB via `aws dynamodb put-item`
7. Rebuild insights-index.json from DynamoDB query and upload to S3
8. Invalidate CloudFront

### Step 3: Seed DynamoDB with existing data

**Create:** `scripts/seed-insights-dynamo.sh`

One-time migration:
- `prototypes/inference-insights/data/memory.json` → `STATE#memory` item
- `prototypes/inference-insights/data/feedback.json` → `STATE#feedback` item
- Each entry in `insights-index.json` → `INSIGHT#<id>` item

### Step 4: Create the Remote Trigger

Use `RemoteTrigger` API with:
- Schedule: `7 11,17,21,1 * * *` (4x/day UTC, maps to ~7am/1pm/5pm/9pm ET)
- Repo: `nsuberi/proto-portal-showcase-hub`
- Env vars: Tier 1 IAM user keys + `AWS_DEFAULT_REGION`
- Setup script: assume-role chain (see above)
- Network access: Trusted (needed for AWS APIs + arXiv)

### Step 5: Update API routes

**Modify:** `shared/api/src/routes/inference-insights.js`
- `GET /api/v1/inference-insights/index` — DynamoDB-backed, filterable
- Update feedback endpoints to use DynamoDB

### Step 6: Disable local LaunchAgent

Unload + rename plist. Add deprecation notice to local script.

### Step 7: Documentation

Update README.md and AGENTS.md with new architecture and security model.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `terraform/inference-insights-research.tf` | **Create** | IAM role, IAM user, DynamoDB table, S3 versioning |
| `scripts/inference-insights-cloud-prompt.md` | **Create** | Cloud task prompt |
| `scripts/seed-insights-dynamo.sh` | **Create** | One-time data migration |
| `shared/api/src/routes/inference-insights.js` | **Modify** | DynamoDB-backed index + feedback |
| `scripts/inference-insights-session.sh` | **Modify** | Deprecation notice |
| `prototypes/inference-insights/README.md` | **Modify** | New architecture docs |
| `prototypes/inference-insights/AGENTS.md` | **Modify** | Updated diagrams |

## Verification

1. `terraform apply` — creates IAM + DynamoDB + S3 versioning
2. Verify IAM: `aws sts assume-role` with the user keys → gets scoped temp credentials
3. Verify IAM: temp credentials CANNOT `s3:DeleteObject` or `dynamodb:DeleteItem` (expect AccessDenied)
4. Run `scripts/seed-insights-dynamo.sh` — verify items in DynamoDB
5. Trigger cloud task via `RemoteTrigger action: run`
6. Verify new files in S3 at `prototypes/inference-insights/content/insights/`
7. Verify CloudFront serves new content at production URL
8. Verify DynamoDB has new items + updated session count
9. Check CloudTrail for the AssumeRole event and subsequent API calls
