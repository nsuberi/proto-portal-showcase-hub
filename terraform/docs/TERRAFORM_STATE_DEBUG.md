# Terraform State Debugging Report

**Date:** 2026-03-26
**Error:** `Backend configuration changed` during `terraform init`

---

## Root Cause Analysis

The error occurs because the **local Terraform backend metadata is stale** relative to the current Terraform version. Specifically:

| Factor | Value |
|--------|-------|
| Installed Terraform version | **v1.12.2** |
| Remote state's `terraform_version` | **v1.5.7** |
| Local `.terraform/terraform.tfstate` last modified | **July 12, 2025** |
| Remote state last modified | **Feb 4, 2026** |

Between Terraform v1.5.7 and v1.12.2, the S3 backend internal schema changed (new config fields, different hash computation). Even though `backend.tf` itself hasn't been modified, Terraform detects a schema-level change in how it represents the backend configuration and asks you to re-initialize.

Additionally, the **lineage values don't match**:
- Local `.terraform/terraform.tfstate` lineage: `0c15c3d0-06e5-43d9-6114-f609faec3e1c`
- Remote S3 state lineage: `01154cdb-8920-8e8c-9736-fc16d93015bf`

This suggests the local `.terraform/` directory was initialized against a different state instance (possibly before the current remote state was established, or from a different machine).

---

## Current State of AWS Resources

All deployed resources are **healthy and consistent** with what's tracked in the remote state (41 resources, serial 128):

### Infrastructure Status

| Resource | Status | Details |
|----------|--------|---------|
| S3 Bucket (`portfolio-portal-code`) | Exists | us-east-1 |
| CloudFront (`E25WB0ZPQ7JJFT`) | **Deployed** | Aliases: `portfolio.cookinupideas.com`, `learningpath.cookinupideas.com` |
| Lambda (`portfolio-portal-code-ai-api`) | **Active** | Node.js 18.x, 256MB, last modified 2026-02-04 |
| API Gateway (`zsr0t3qe2g`) | Exists | `portfolio-portal-code-ai-api` |
| ACM Certificate | **ISSUED** | `portfolio.cookinupideas.com` (2 certs) |
| Route53 Zone | Exists | `cookinupideas.com` (Z0990573XMA6PHFKL82S) |
| DynamoDB Lock Table (`terraform-state-locks`) | **ACTIVE** | 2 items (MD5 digests only, no active locks) |
| S3 State Bucket (`portfolio-portal-terraform-state`) | Exists | 2 state files |

### State Files in S3

| Key | Last Modified |
|-----|---------------|
| `environments/prod/terraform.tfstate` | 2026-02-04 (this project) |
| `ai-evals/environments/prod/terraform.tfstate` | 2026-02-03 (separate project) |

### No Stale Locks

The DynamoDB table contains only MD5 digest entries (checksum records), **not** active operation locks. No lock cleanup is needed.

---

## Secondary Issue: IAM Role Assumption

The `nsuberi` IAM user does not have direct permissions to most AWS services (CloudFront, DynamoDB, Lambda, etc.). The deploy script (`scripts/deploy.sh`) runs `terraform init` and `terraform apply` **without assuming the `terraform-cooking-up-ideas` role** first. Terraform itself handles this via its AWS provider configuration, but if there's any issue with the role assumption within Terraform's provider config, this could compound the problem.

The role that grants permissions: `arn:aws:iam::671388079324:role/terraform-cooking-up-ideas`

---

## Options for Resolution

### Option A: `terraform init -reconfigure` (Recommended for this case)

**What it does:** Reinitializes the local `.terraform/` directory with the current backend configuration, updating the local metadata to match the current Terraform version's schema. It does **not** move or migrate any state data — it simply refreshes the local pointer to the existing remote state.

**When to use:** When the backend configuration (bucket, key, region, etc.) hasn't actually changed — only the Terraform version or local metadata is stale.

**Risk:** Low. The remote state in S3 is untouched. This just rebuilds the local `.terraform/terraform.tfstate` metadata file.

**Command:**
```bash
cd terraform
terraform init -reconfigure
```

**After running:** Verify with `terraform plan` that it correctly reads the existing 41 resources from remote state and doesn't propose destroying/recreating anything unexpected.

---

### Option B: `terraform init -migrate-state`

**What it does:** Attempts to migrate state from the old backend configuration to the new one. Since the bucket/key/region haven't actually changed, this would effectively just re-read and re-write the state through the new schema.

**When to use:** When you've intentionally changed the backend (e.g., moved to a different S3 bucket or changed the state key path).

**Risk:** Medium. If something goes wrong during migration, state could be corrupted. Since the backend hasn't actually changed, this is overkill.

**Command:**
```bash
cd terraform
terraform init -migrate-state
```

---

### Option C: Delete `.terraform/` and reinitialize from scratch

**What it does:** Completely removes the local Terraform working directory and reinitializes, downloading providers fresh and connecting to the remote backend.

**When to use:** If `-reconfigure` doesn't work, or if the `.terraform/` directory is suspected to be corrupted.

**Risk:** Low (remote state is safe in S3). You'll need to re-download provider plugins (~100MB for AWS provider).

**Commands:**
```bash
cd terraform
rm -rf .terraform
terraform init
```

---

### Option D: Pin Terraform version to match remote state

**What it does:** Downgrade to Terraform v1.5.7 (the version that last wrote the remote state) to avoid the schema mismatch entirely.

**When to use:** If you want zero risk to the state and just need a quick deploy without dealing with the version upgrade.

**Risk:** None to state, but you'd be running an older Terraform version and would need to address this eventually.

**Commands:**
```bash
# Using tfenv (if installed)
tfenv install 1.5.7
tfenv use 1.5.7
cd terraform && terraform init
```

---

## Recommendation

**Option A (`-reconfigure`)** is the right choice here because:
1. The actual backend config (`backend.tf`) has not changed — same bucket, key, region, and DynamoDB table
2. The remote state is intact and healthy (41 resources, serial 128, no active locks)
3. All deployed AWS resources match what the state tracks
4. The only issue is stale local metadata from a Terraform version upgrade

After reinitializing, run `terraform plan` and carefully review the output before applying. If the plan shows 0 changes (or only expected drift), the state is correctly reconnected.

---

## Progress So Far (2026-03-26)

### Completed

1. **`terraform init -reconfigure` succeeded** — local `.terraform/` is now updated for Terraform v1.12.2
2. **Fixed missing `zone_id`** in `route53.tf` line 62 (`portfolio_ipv6` resource)
3. **`terraform plan` succeeded** with assumed role — all 41 resources read from remote state

### Key Finding: Uncommitted CloudFront Config for ai-evals

The **remote state includes the ai-evals CloudFront origin and cache behavior**, but the **git-committed `main.tf` does not**. This means:

- Someone (likely you, from another machine) edited `terraform/main.tf` locally to add:
  - Origin: `ai-evals-api` → `ai-testing-resource-prod-977104126.us-east-1.elb.amazonaws.com`
  - Cache behavior: `/ai-evals/*` → `ai-evals-api` origin
- Then ran `terraform apply` (Feb 4, 2026)
- But **never committed the changes to git**

Evidence:
- Remote state (serial 128, Feb 4 2026) has both origins and 5 cache behaviors
- Current `main.tf` on all git branches only has 1 origin (S3) and 4 cache behaviors
- No git branch in either proto-portal or ai-evals contains the CloudFront integration code
- The ai-evals Terraform (all branches: main, feature/narrative-restructure, sculptor/happy-garnet-baboon) manages only VPC/ECS/RDS/ALB/API Gateway — never touches CloudFront

### What `terraform plan` Showed

Because `main.tf` is missing the ai-evals config, `terraform plan` wants to:
- **Remove** the `ai-evals-api` origin from CloudFront
- **Remove** the `/ai-evals/*` cache behavior
- **Reorder** the remaining cache behaviors

**DO NOT run `terraform apply` until `main.tf` is updated** to include the ai-evals origin, or the live ai-evals integration will break.

### Next Steps

1. **Recover the ai-evals CloudFront config** — extract the exact origin and cache behavior configuration from the remote state file (downloaded to `/tmp/tfstate-check.json`) and add it to `main.tf`
2. **Decide on approach** — either hardcode the ALB domain or use `terraform_remote_state` to read it from ai-evals' state (see `UNIFIED_INFRA_PLAN.md` Option A)
3. **Run `terraform plan`** again — should show 0 destructive changes to CloudFront
4. **Run `terraform apply`** — updates state to Terraform v1.12.2 without breaking anything

---

## Additional Notes

- **S3 Bucket Versioning:** Not enabled on the state bucket. Consider enabling it for state recovery purposes.
- **Duplicate ACM Certificates:** There are 2 issued certificates for `portfolio.cookinupideas.com`. One may be orphaned from a previous deployment. Worth investigating after resolving the init issue.
- **Deploy Script:** `scripts/deploy.sh` does not handle AWS role assumption. If Terraform's provider config doesn't include `assume_role`, you may need to set up a credential profile or wrapper script.
