# Unified AWS Infrastructure Management Plan

**Date:** 2026-03-26
**Problem:** Two independent Terraform projects modify the same CloudFront distribution, causing state drift and deployment conflicts.

---

## Current Situation

### Two Projects, One CloudFront Distribution

| | **proto-portal-showcase-hub** | **ai-evals-in-context** |
|---|---|---|
| **Location** | `~/GitHub/proto-portal-showcase-hub` | `~/GitHub/ai-evals-in-context` |
| **State key** | `environments/prod/terraform.tfstate` | `ai-evals/environments/prod/terraform.tfstate` |
| **Resources** | S3 static site, CloudFront, Route53, ACM, Lambda API, API Gateway (REST) | VPC, ECS Fargate, RDS Postgres, ALB, API Gateway (HTTP), Secrets Manager |
| **TF version** | v1.5.7 (in state) | Unknown |
| **State bucket** | `portfolio-portal-terraform-state` (shared) | `portfolio-portal-terraform-state` (shared) |
| **Lock table** | `terraform-state-locks` (shared) | `terraform-state-locks` (shared) |

### The Conflict

The **CloudFront distribution** (`E25WB0ZPQ7JJFT`) is defined in proto-portal's Terraform, but the live resource has an additional origin and cache behavior for ai-evals that was added outside of proto-portal's config:

**In proto-portal's Terraform config (main.tf):**
- 1 origin: `S3-portfolio-portal-code`
- 4 cache behaviors: `/prototypes/ffx-skill-map/*`, `/prototypes/home-lending-learning/*`, `/prototypes/documentation-explorer/*`, `/prototypes/learning-path/*`

**In the live CloudFront distribution:**
- 2 origins: `S3-portfolio-portal-code` + `ai-evals-api` (pointing to ALB `ai-testing-resource-prod-*.us-east-1.elb.amazonaws.com`)
- 5 cache behaviors: the 4 above + `/ai-evals/*`

**Result:** Running `terraform plan` from proto-portal wants to **delete the ai-evals origin and cache behavior**, because it doesn't know about them.

### Shared vs. Separate Resources

```
                    ┌─────────────────────────────────────────┐
                    │          Shared Resources                │
                    │  • Route53 Zone (cookinupideas.com)      │
                    │  • ACM Certificate (*.cookinupideas.com) │
                    │  • CloudFront Distribution (E25WB...)    │
                    │  • S3 State Bucket                       │
                    │  • DynamoDB Lock Table                   │
                    └────────────┬────────────┬───────────────┘
                                 │            │
              ┌──────────────────┘            └──────────────────┐
              │                                                   │
    ┌─────────▼──────────┐                          ┌─────────────▼────────┐
    │   proto-portal      │                          │   ai-evals           │
    │  • S3 website bucket│                          │  • VPC + subnets     │
    │  • Lambda (Node.js) │                          │  • ECS Fargate       │
    │  • REST API Gateway │                          │  • RDS PostgreSQL    │
    │  • CloudFront Func  │                          │  • ALB               │
    │  • Route53 A/AAAA   │                          │  • HTTP API Gateway  │
    └─────────────────────┘                          │  • ECR               │
                                                     │  • Secrets Manager   │
                                                     └──────────────────────┘
```

---

## Options

### Option A: Cross-State References (Recommended)

**Approach:** Keep both projects' Terraform configs separate, but have proto-portal read ai-evals' state outputs to dynamically include the ai-evals origin in the CloudFront distribution.

**How it works:**

1. ai-evals exports its ALB domain name as a Terraform output (it already does: `alb_dns_name`)
2. proto-portal adds a `terraform_remote_state` data source pointing to ai-evals' state:
   ```hcl
   data "terraform_remote_state" "ai_evals" {
     backend = "s3"
     config = {
       bucket = "portfolio-portal-terraform-state"
       key    = "ai-evals/environments/prod/terraform.tfstate"
       region = "us-east-1"
     }
   }
   ```
3. proto-portal's CloudFront resource adds a dynamic origin + cache behavior using the ai-evals ALB domain from the remote state

**Pros:**
- Each project keeps its own state and lifecycle
- Proto-portal is the single owner of CloudFront (no drift)
- ai-evals just needs to be deployed first; proto-portal reads its outputs
- No new repos or restructuring needed
- Minimal changes to existing configs

**Cons:**
- Deploy ordering matters: ai-evals infra must exist before proto-portal can reference it
- Adding a new project that needs CloudFront routing requires editing proto-portal's config
- Proto-portal needs a `terraform plan/apply` after ai-evals ALB changes

**Changes required:**
- proto-portal `main.tf`: Add `terraform_remote_state` data source + ai-evals origin + `/ai-evals/*` cache behavior
- ai-evals: No changes needed (already exports `alb_dns_name`)

---

### Option B: Shared Infrastructure Layer

**Approach:** Extract all shared resources (CloudFront, Route53, ACM) into a third Terraform configuration that both projects reference.

**Directory structure:**
```
terraform-shared-infra/
├── backend.tf          # key = "shared/terraform.tfstate"
├── cloudfront.tf       # Owns the distribution
├── route53.tf          # Owns the zone + records
├── acm.tf              # Owns the certificate
├── variables.tf        # Takes origins as input
└── outputs.tf          # Exports distribution ID, zone ID, cert ARN
```

Both proto-portal and ai-evals then reference this shared state:
```hcl
data "terraform_remote_state" "shared" {
  backend = "s3"
  config = {
    bucket = "portfolio-portal-terraform-state"
    key    = "shared/terraform.tfstate"
    region = "us-east-1"
  }
}
```

**Pros:**
- Clean separation of concerns
- Shared resources have their own lifecycle
- Each project only manages its own resources
- Adding new projects is straightforward

**Cons:**
- Requires migrating resources out of proto-portal's state (`terraform state mv` / `terraform import`)
- Three Terraform configs to manage instead of two
- Deploy ordering becomes: shared → ai-evals → proto-portal (or shared → both in parallel)
- The shared config needs to know about all origins — either hardcoded or via input variables that still create coupling

**Changes required:**
- New terraform config repo/directory for shared infra
- `terraform state rm` CloudFront, Route53, ACM from proto-portal state
- `terraform import` those resources into the shared state
- Both projects updated to reference shared state outputs
- Deploy scripts updated for new ordering

---

### Option C: Monorepo with Modules

**Approach:** Combine both projects' Terraform into one configuration using modules.

**Directory structure:**
```
terraform/
├── main.tf              # Composes modules
├── backend.tf           # Single state file
├── modules/
│   ├── static-site/     # S3, CloudFront, Route53, ACM
│   ├── proto-portal-api/ # Lambda, REST API Gateway
│   └── ai-evals/        # VPC, ECS, RDS, ALB, HTTP API Gateway
└── outputs.tf
```

**Pros:**
- Single `terraform plan` shows all changes
- No state drift possible
- Simplest mental model

**Cons:**
- Tightly couples two independent projects
- One project's changes risk affecting the other
- Long plan/apply times (all resources evaluated every time)
- Requires physically merging or symlinking Terraform code
- Both projects lose deployment independence

---

### Option D: CloudFront Import into ai-evals

**Approach:** Have ai-evals use a `data` source to reference the existing CloudFront distribution and manage its own cache behavior via a separate mechanism (e.g., AWS CLI in deploy script).

**Pros:**
- No Terraform changes to either project
- Each project stays independent

**Cons:**
- The `/ai-evals/*` cache behavior would always be outside Terraform (permanent drift)
- Fragile — any proto-portal `terraform apply` would wipe the ai-evals additions
- Not a real solution, just formalizes the current broken state

---

## Recommendation: Option A (Cross-State References)

Option A gives the best balance of simplicity, correctness, and minimal disruption:

| Criteria | A: Cross-State | B: Shared Layer | C: Monorepo | D: CLI Hack |
|----------|:-:|:-:|:-:|:-:|
| Minimal changes | Best | Moderate | Large | None |
| No state migration needed | Yes | No | No | Yes |
| Single CloudFront owner | Yes | Yes | Yes | No |
| Projects stay independent | Mostly | Yes | No | Yes |
| No permanent drift | Yes | Yes | Yes | No |
| Simple deploy process | Yes | Moderate | Yes | Fragile |

### Implementation Steps for Option A

1. **In proto-portal `main.tf`**, add:
   - `terraform_remote_state` data source for ai-evals
   - A conditional ai-evals origin (so it gracefully handles ai-evals not being deployed)
   - The `/ai-evals/*` ordered cache behavior

2. **Run `terraform plan`** from proto-portal — should show the ai-evals origin being added properly (matching what's already live) rather than being removed

3. **Run `terraform apply`** — this reconciles the CloudFront config AND updates the remote state to Terraform v1.12.2

4. **Update `scripts/deploy.sh`** in proto-portal to assume the `terraform-cooking-up-ideas` role before running Terraform commands

5. **Future workflow:**
   - Deploying ai-evals infra (VPC, ECS, ALB): run `terraform apply` in ai-evals
   - If ALB domain changes: run `terraform apply` in proto-portal to pick up the new domain
   - Deploying ai-evals app code: just run `./scripts/deploy.sh` in ai-evals (no proto-portal change needed)
   - Deploying proto-portal site: run `./scripts/deploy.sh` in proto-portal as normal

---

## Secondary Issues to Address

### 1. Deploy Script Needs Role Assumption
`scripts/deploy.sh` runs `terraform init` and `terraform apply` as the `nsuberi` IAM user, which lacks DynamoDB, CloudFront, and other permissions. It needs to assume `terraform-cooking-up-ideas` first. Options:
- Add `assume_role` block to the AWS provider in `main.tf`
- Or wrap deploy.sh with credential export logic
- Or configure an AWS CLI profile with role assumption

### 2. Duplicate ACM Certificates
Two ISSUED certificates exist for `portfolio.cookinupideas.com`:
- `4240573d-...` — likely the original/shared one used by ai-evals ALB
- `55b836b1-...` — managed by proto-portal Terraform

Determine which one CloudFront and the ALB are actually using, and clean up the other.

### 3. S3 State Bucket Versioning
Not currently enabled. Strongly recommended for state recovery in case of corruption or accidental overwrites.
