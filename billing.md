# AWS Billing & Cost Model

> **Standing rule:** any change to deployed infrastructure (terraform/, deploy scripts, ECS/Lambda config) must update this file's expected-cost model and the "Update log" below. See `terraform/AGENTS.md` → "Cost Impact of Changes".

Account: `671388079324` · Region: `us-east-1` · Budget guardrail: AWS Budget `research-workspace-monthly` at **$100/mo** with 50/80/100% alerts.

Last reconciled against Cost Explorer: **2026-07-03** (data through 2026-07-02).

---

## Current expected steady-state: ~$29–31/month

After the 2026-06-28 changes (AI Evals hosted demo retired, Research Workspace scaled to zero, RDS deleted), the observed run rate is **~$0.90/day**. Verified live: ECS `desiredCount=0`, zero RDS instances, no NAT gateways, no EC2.

| Line item | $/mo | Nature | Notes |
|---|---|---|---|
| ALB `ai-testing-resource-prod` | 16.60 | **Always-on** | $0.0225/hr + minimal LCU. Fronts only the scale-to-zero Research Workspace. |
| Public IPv4 ×2 (the ALB's own IPs) | 7.30 | **Always-on** | $0.005/hr each. Goes away only if the ALB does. |
| Secrets Manager (8 secrets) | 3.20 | Always-on | $0.40/secret/mo |
| Route53 hosted zones + queries | 1.55 | Always-on | |
| S3 (site bucket + tf state) | 0.50 | Grows slowly | Versioning ON with **no lifecycle rule** — 12.5k old versions and counting |
| ECR (research-workspace image) | 0.15 | Always-on | Lifecycle keeps last 5 images |
| DynamoDB / EFS / CloudWatch / SNS | ~0.15 | On-demand | DynamoDB PITR is the only standing piece; all log groups have 14–30d retention |
| CloudFront / Lambda / API GW / Cognito | ~0.00 | On-demand | Within free tier at portfolio traffic levels |
| Tax (~9–10%) | ~2.60 | | |
| **Total** | **~$30** | | Plus **$15/yr** domain renewal (hit June 2026) |

**The ALB + its two IPs = ~$24/mo, i.e. ~80% of idle spend.** Everything else is single dollars.

## Usage-driven costs (what varies)

- **Research Workspace wake events**: Fargate ARM 0.5 vCPU / 1 GB ≈ **$0.02/hr on-demand, ~$0.006/hr on Spot** (capacity strategy prefers Spot 4:1). Reaper (EventBridge every 5 min) scales back to 0 on stale heartbeat; nightly 07:00 UTC cron is the backstop. Even 100 hrs/mo of use adds only **$1–2**.
- **CloudFront traffic**: free tier covers 1 TB + 10M requests/mo. A viral day (~100k visits × ~3 MB) stays inside it. Beyond: $0.085/GB.
- **AI API Lambda / OIDC proxy Lambda**: free tier covers realistic volumes; the 5-min reaper (~8,640 invokes/mo × 128 MB × <1s) is also free-tier.

## Scenarios

| Scenario | Expected monthly total |
|---|---|
| Idle (nobody uses anything) | **~$30** |
| Normal — portfolio browsing + ~10 hrs workspace use | **~$30** |
| Heavy — 160 hrs/mo workspace use | **~$33** |
| **Failure mode** — reaper broken, 1 task pinned 24/7 | **~$45** (watch for ECS ≥ $0.50/day when you aren't using it) |
| Pre-June-28 architecture (for reference) | ~$85–90 |
| Hard ceiling | $100 budget alert |

## What actually happened (Cost Explorer, reconciled 2026-07-03)

Monthly totals: **Mar $56 → Apr $86 → May $79 → Jun $89 → Jul running at ~$0.90/day (~$29/mo pace)**.

The Apr–Jun elevation you saw was real and is **already fixed**:
- **ECS $27–31/mo**: exactly two always-on Fargate task-equivalents — the AI Evals Flask demo *plus* the Research Workspace backend, both 24/7. Daily ECS was a flat $0.95/day through June 28, then $0 from June 29 onward (scale-to-zero deploy).
- **RDS $13–14/mo**: the AI Evals Postgres (db.t4g.micro + 20 GB gp3). $0 from June 29 (deleted).
- **June also carried the one-time $15 domain renewal** (Amazon Registrar), inflating that month.
- ALB ($0.54/day), IPv4 ($0.24/day after one IP was released with the retirement), Secrets, Route53 continue unchanged — they are the current baseline.

Daily total went **$2.45/day → $0.90/day on June 29**. If a future bill looks high, the first check is `ECS > $0` on days you didn't use the workspace (reaper failure).

## Cost-reduction levers (not yet taken)

1. **Replace the ALB** (~$24/mo → biggest lever by far). It exists only for Research Workspace routing + Cognito ALB-auth + the Lambda scaler target. Moving to CloudFront → Lambda Function URL / API Gateway would cut idle cost to ~$6–7/mo, but requires reworking auth and code-server WebSocket routing. Worth it only if $24/mo matters.
2. **S3 lifecycle rule** for noncurrent versions (e.g. expire after 30 days). Costs ~$0.50/mo today but grows unbounded with every deploy.
3. **Consolidate Secrets Manager secrets** — the 6 `research-workspace-prod/*` values could live in 1–2 JSON secrets: saves ~$2/mo.
4. **CloudFront `price_class`** is unset → PriceClass_All. Set `PriceClass_100` (NA+EU) if non-free-tier traffic ever materializes; $0 impact today.

## How to reconcile (repeat this when checking)

```bash
export AWS_PROFILE=deploy
# Monthly by service
aws ce get-cost-and-usage --time-period Start=<YYYY-MM-01>,End=<today> \
  --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE
# Daily for spotting when something changed
aws ce get-cost-and-usage --time-period Start=<30d-ago>,End=<today> \
  --granularity DAILY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE
# Usage-type decomposition (what inside a service is billing)
aws ce get-cost-and-usage --time-period Start=<month>,End=<month-end> \
  --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=USAGE_TYPE
```

Cost Explorer access is granted via inline policy `cost-explorer-readonly` on role `terraform-cooking-up-ideas` (read-only `ce:Get*`, added 2026-07-03).

## Update log

| Date | Change | Expected impact |
|---|---|---|
| 2026-07-03 | Initial cost model; reconciled vs Cost Explorer Mar–Jul. Added `cost-explorer-readonly` inline policy to deploy role. | Baseline ~$30/mo idle |
| 2026-06-28 | (retroactive) AI Evals demo retired: ECS service, RDS, API GW origin removed. Research Workspace scale-to-zero with wake-on-request + 5-min reaper. | −$55/mo (from ~$85 to ~$30) — confirmed in daily data |
