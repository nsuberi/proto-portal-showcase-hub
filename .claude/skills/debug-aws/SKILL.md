---
name: debug-aws
description: "Diagnose and fix AWS service errors for the portfolio infrastructure: S3, CloudFront, ECS Fargate, RDS, Lambda, API Gateway, Secrets Manager, ACM, and Route53. Use when: (1) The site is down or returning errors, (2) ECS tasks are failing or not starting, (3) API responses are broken, (4) Database connectivity issues, (5) DNS or certificate problems. Triggers include phrases like 'site is down', 'ECS error', '502 bad gateway', 'Lambda timeout', 'API not responding', 'database error', 'CloudFront error', 'task stopped', 'container crash', or any reference to AWS console errors."
---

# Debug AWS Services Skill

Systematic approach to diagnosing AWS service issues for the portfolio infrastructure deployed via Terraform.

## Infrastructure Map

```
Route53 (*.cookinupideas.com)
  └── ACM Certificate (*.cookinupideas.com)
        └── CloudFront Distribution
              ├── Default origin: S3 (static site)
              │     └── CloudFront Function (SPA router)
              ├── /ai-evals/* → ALB → ECS Fargate (Flask app)
              └── /api/v1/*   → API Gateway → Lambda (Node.js proxy)

ECS Fargate Cluster (ARM64/Graviton)
  ├── Task Definition (Flask container, port 5000)
  ├── ECR Repository (container images)
  ├── ALB (public subnets)
  └── Service Discovery (Cloud Map)

RDS PostgreSQL (db.t4g.micro)
  └── Secrets Manager (credentials)

Lambda Function (Node.js 18)
  └── Secrets Manager (Claude API key)
```

**Terraform state**: S3 bucket `portfolio-portal-terraform-state`, key `environments/prod/terraform.tfstate`, DynamoDB lock table `terraform-state-locks`.

**Terraform modules**: `terraform/main.tf` (root), `terraform/modules/ai-evals/` (networking, database, ecs, alb, api_gateway submodules).

## Step 1: Identify Which Service Is Affected

Ask the user what they're seeing, then map to a service:

| Symptom | Likely Service | Section |
|---------|---------------|---------|
| Site returns 403/404 | S3 + CloudFront | A |
| Site shows stale content | CloudFront cache | A |
| `/ai-evals/*` returns 502/503 | ECS / ALB | B |
| `/api/v1/*` returns 500 | Lambda / API Gateway | C |
| ECS task keeps stopping | ECS + container | B |
| Database connection refused | RDS / networking | D |
| Certificate warnings | ACM / Route53 | E |
| DNS not resolving | Route53 | E |
| Secrets not available | Secrets Manager | F |
| Terraform drift / errors | State management | G |

## Category A: S3 + CloudFront (Static Site)

**Architecture**: S3 bucket hosts built static files. CloudFront serves them with a CloudFront Function that handles SPA routing for prototype paths.

### A1: 403 Forbidden / Access Denied

**Diagnosis**:
```bash
# Check S3 bucket contents
aws s3 ls s3://<BUCKET_NAME>/ --recursive | head -20

# Check CloudFront distribution status
aws cloudfront list-distributions --query "DistributionList.Items[].{Id:Id,Status:Status,Domain:DomainName}" --output table

# Verify bucket policy allows CloudFront OAI/OAC
aws s3api get-bucket-policy --bucket <BUCKET_NAME>
```

**Common causes**:
- S3 bucket policy doesn't grant CloudFront access
- Object ACLs blocking access (should use OAC, not public access)
- Wrong S3 key — check that `scripts/deploy-site.sh` synced to the right prefix

### A2: Stale Content After Deploy

**Diagnosis**:
```bash
# Check if CloudFront invalidation completed
aws cloudfront list-invalidations --distribution-id <DIST_ID> --query "InvalidationList.Items[0]"

# Create a new invalidation
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

**Common causes**:
- `scripts/deploy-site.sh` invalidation failed or wasn't awaited
- Browser cache (try incognito)
- CloudFront edge caches take 1-2 minutes to propagate globally

### A3: SPA Routing Broken (404 on refresh)

The CloudFront Function in `terraform/main.tf` handles SPA routing. It rewrites requests like `/prototypes/ffx-skill-map/some/path` to `/prototypes/ffx-skill-map/index.html`.

**Diagnosis**:
```bash
# Test the URL directly
curl -I https://portfolio.cookinupideas.com/prototypes/ffx-skill-map/some-route

# Check the CloudFront Function code in Terraform
grep -A 30 "cloudfront_function" terraform/main.tf
```

**Common causes**:
- New prototype not added to the CloudFront Function's hardcoded list
- CloudFront Function has a JavaScript syntax error (check Terraform apply output)

### A4: PLACEHOLDER_API_GATEWAY_URL in Source

`scripts/deploy-site.sh` replaces `PLACEHOLDER_API_GATEWAY_URL` in built JS files with the real API Gateway URL from Terraform output.

**Diagnosis**:
```bash
# Check if placeholder was replaced
curl -s https://portfolio.cookinupideas.com/assets/*.js | grep -c "PLACEHOLDER"

# Check Terraform output
cd terraform && terraform output ai_api_gateway_url
```

---

## Category B: ECS Fargate (AI Evals Flask App)

**Architecture**: ECS Fargate cluster running ARM64 (Graviton) containers. Flask app on port 5000. ALB in public subnets forwards to ECS tasks. Uses Fargate Spot (2x weight) + Fargate (1x base) for cost optimization.

### B1: 502 Bad Gateway from CloudFront

CloudFront path `/ai-evals/*` routes to the ALB origin.

**Diagnosis**:
```bash
# Check ECS service status
aws ecs describe-services --cluster <CLUSTER> --services <SERVICE> --query "services[0].{status:status,running:runningCount,desired:desiredCount,events:events[:5]}"

# Check if tasks are running
aws ecs list-tasks --cluster <CLUSTER> --service-name <SERVICE>

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <TG_ARN>
```

**Common causes**:
- No healthy ECS tasks (all stopped or draining)
- ALB health check failing — the container health check is `curl -f http://localhost:5000/ai-evals/health`
- Container hasn't finished starting (entrypoint.sh does DB init before Flask starts)
- Fargate Spot capacity unavailable (tasks can be interrupted)

### B2: ECS Task Keeps Stopping

**Diagnosis**:
```bash
# Get stopped task details
aws ecs list-tasks --cluster <CLUSTER> --desired-status STOPPED
aws ecs describe-tasks --cluster <CLUSTER> --tasks <TASK_ARN> --query "tasks[0].{stopCode:stopCode,stoppedReason:stoppedReason,containers:containers[0].{exitCode:exitCode,reason:reason}}"

# Check CloudWatch logs (30-day retention)
aws logs get-log-events --log-group-name <LOG_GROUP> --log-stream-name <STREAM> --limit 100
```

**Common causes**:
- **Exit code 1**: Application error — check Flask logs for tracebacks
- **Exit code 137**: OOM killed — task needs more memory
- **Exit code 143**: SIGTERM — graceful shutdown (normal during deployments)
- **CannotPullContainerError**: ECR image doesn't exist or IAM can't pull it
- **ResourceInitializationError**: ENI setup failed (VPC/subnet/security group issue)
- **Spot interruption**: Fargate Spot task was reclaimed — check `stopCode: SpotInterruption`

### B3: Container Health Check Failing

The task definition health check: `curl -f http://localhost:5000/ai-evals/health`

**Diagnosis**:
```bash
# Exec into a running task (if possible)
aws ecs execute-command --cluster <CLUSTER> --task <TASK_ARN> --container api --interactive --command "/bin/bash"

# Inside the container:
curl -f http://localhost:5000/ai-evals/health
```

**Common causes**:
- Flask app crashed during startup (check entrypoint.sh)
- Database migration failed (RDS connectivity issue — see Category D)
- Missing environment variable (ANTHROPIC_API_KEY, database URL)
- ChromaDB initialization failure

### B4: ECR Image Issues

**Diagnosis**:
```bash
# List recent images
aws ecr describe-images --repository-name <REPO> --query "imageDetails | sort_by(@, &imagePushedAt) | [-3:]" --output table

# Check if the expected tag exists
aws ecr describe-images --repository-name <REPO> --image-ids imageTag=latest
```

**Common causes**:
- Image was never pushed (CI skipped the push step)
- Image architecture mismatch — must be ARM64, not AMD64. **Never add `--platform linux/amd64` to Docker builds.**
- ECR lifecycle policy deleted the image

### B5: Networking / Security Groups

ECS tasks run in private subnets. ALB is in public subnets.

**Diagnosis**:
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids <SG_ID> --query "SecurityGroups[0].IpPermissions"

# Verify ALB can reach ECS (ALB SG -> ECS SG on port 5000)
# Verify ECS can reach RDS (ECS SG -> RDS SG on port 5432)
# Verify ECS can reach internet (NAT Gateway for pulling images, Secrets Manager)
```

---

## Category C: Lambda + API Gateway (`/api/v1/*`)

**Architecture**: Lambda function (Node.js 18) behind API Gateway REST API. Handles Claude API proxy requests. API key + usage plan enforcement (100 RPS, 50 burst).

### C1: 500 Internal Server Error

**Diagnosis**:
```bash
# Check Lambda logs
aws logs tail /aws/lambda/<FUNCTION_NAME> --since 1h --format short

# Check Lambda configuration
aws lambda get-function-configuration --function-name <FUNCTION_NAME> --query "{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,State:State}"

# Test invocation
aws lambda invoke --function-name <FUNCTION_NAME> --payload '{"httpMethod":"GET","path":"/api/v1/health","headers":{}}' /dev/stdout
```

**Common causes**:
- Missing Secrets Manager access (Claude API key at `prod/proto-portal/claude-api-key`)
- Lambda timeout (check if Claude API is slow)
- Node.js module not found — `scripts/deploy-site.sh` runs `npm ci --omit=dev --prefix shared/api` and zips the result. Missing dependency = crash.
- CORS misconfiguration — CORS_ORIGIN is set to `https://portfolio.cookinupideas.com`

### C2: 403 Forbidden / API Key Issues

**Diagnosis**:
```bash
# Check API Gateway usage plan
aws apigateway get-usage-plans --query "items[].{name:name,throttle:throttle,quota:quota}"

# Check if API key is valid
aws apigateway get-api-keys --include-values --query "items[].{name:name,enabled:enabled}"
```

**Common causes**:
- API key not included in request headers (`x-api-key`)
- Usage plan quota exceeded
- API Gateway stage not deployed after changes

### C3: Lambda Cold Starts

**Symptoms**: First request after idle period takes 5-10+ seconds.

**Mitigation**: Not a bug — expected behavior with Lambda. If latency is critical, consider provisioned concurrency (adds cost).

---

## Category D: RDS PostgreSQL (AI Evals Database)

**Architecture**: RDS PostgreSQL in private subnets. Credentials in Secrets Manager. Database: `tsr_db`, user: `tsr_user`.

### D1: Connection Refused / Timeout

**Diagnosis**:
```bash
# Check RDS instance status
aws rds describe-db-instances --query "DBInstances[].{Id:DBInstanceIdentifier,Status:DBInstanceStatus,Endpoint:Endpoint.Address,Port:Endpoint.Port}"

# Check security groups allow ECS -> RDS on port 5432
aws ec2 describe-security-groups --group-ids <RDS_SG_ID>
```

**Common causes**:
- RDS instance stopped (db.t4g.micro can be auto-stopped if configured)
- Security group doesn't allow inbound from ECS security group on port 5432
- Subnet routing — ECS and RDS must be in the same VPC
- RDS storage full

### D2: Authentication Failures

**Diagnosis**:
```bash
# Check Secrets Manager for current credentials
aws secretsmanager get-secret-value --secret-id <SECRET_ARN> --query "SecretString"
```

**Common causes**:
- Secrets Manager secret was rotated but ECS task has old cached credentials
- Secret format changed (expected JSON with host, port, username, password, dbname)
- Force new ECS deployment to pick up rotated credentials:
  ```bash
  aws ecs update-service --cluster <CLUSTER> --service <SERVICE> --force-new-deployment
  ```

### D3: Database Performance

**Diagnosis**:
```bash
# Check RDS metrics
aws cloudwatch get-metric-statistics --namespace AWS/RDS --metric-name CPUUtilization --dimensions Name=DBInstanceIdentifier,Value=<INSTANCE_ID> --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Average

# Check connections
aws cloudwatch get-metric-statistics --namespace AWS/RDS --metric-name DatabaseConnections --dimensions Name=DBInstanceIdentifier,Value=<INSTANCE_ID> --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Maximum
```

**Common causes**:
- db.t4g.micro has limited CPU credits — sustained load will throttle
- Connection pool exhaustion — Flask app may not be releasing connections
- Missing indexes on frequently queried columns

---

## Category E: DNS + Certificates (Route53 / ACM)

**Architecture**: Route53 hosted zone for `cookinupideas.com`. Wildcard ACM certificate (`*.cookinupideas.com`). CloudFront aliases: `portfolio.cookinupideas.com`, `learningpath.cookinupideas.com`.

### E1: Certificate Errors

**Diagnosis**:
```bash
# Check ACM certificate status
aws acm list-certificates --query "CertificateSummaryList[].{Domain:DomainName,Status:Status}"

# Get certificate details
aws acm describe-certificate --certificate-arn <CERT_ARN> --query "Certificate.{Status:Status,InUseBy:InUseBy,DomainValidationOptions:DomainValidationOptions}"
```

**Common causes**:
- Certificate pending validation — DNS validation records not created
- Certificate expired — ACM auto-renews, but only if DNS validation records still exist
- Certificate not in us-east-1 — CloudFront requires certificates in us-east-1

### E2: DNS Not Resolving

**Diagnosis**:
```bash
# Check Route53 records
aws route53 list-resource-record-sets --hosted-zone-id <ZONE_ID> --query "ResourceRecordSets[?Name=='portfolio.cookinupideas.com.']"

# Test resolution
dig portfolio.cookinupideas.com
nslookup portfolio.cookinupideas.com
```

**Common causes**:
- Alias record pointing to wrong CloudFront distribution
- Terraform destroyed/recreated the distribution (new domain name)
- NS records at registrar don't match Route53 hosted zone

---

## Category F: Secrets Manager

**Architecture**: Two key secrets:
- `prod/proto-portal/claude-api-key` — used by Lambda for Claude API proxy
- RDS credentials secret — used by ECS tasks for database access
- Anthropic API key — passed to ECS as environment variable from Secrets Manager

### F1: Secret Not Found / Access Denied

**Diagnosis**:
```bash
# List secrets
aws secretsmanager list-secrets --query "SecretList[].{Name:Name,ARN:ARN}"

# Check IAM policy for the service (Lambda execution role, ECS task role)
aws iam get-role-policy --role-name <ROLE_NAME> --policy-name <POLICY_NAME>
```

**Common causes**:
- Secret ARN changed after Terraform recreated it
- IAM role doesn't have `secretsmanager:GetSecretValue` permission
- Secret is in a different region than the service accessing it

---

## Category G: Terraform State Issues

**Architecture**: S3 backend at `portfolio-portal-terraform-state`, DynamoDB lock table `terraform-state-locks`.

### G1: State Lock

See the `debug-workflow` skill, Category B (Terraform Errors) for detailed lock resolution.

### G2: State Drift

**Diagnosis**:
```bash
cd terraform
terraform init -reconfigure -input=false
terraform plan  # Shows differences between state and reality
```

**Fix**: Either `terraform apply` to reconcile, or `terraform import` for manually-created resources. For resources that were deleted outside Terraform: `terraform state rm <resource_address>`.

### G3: Module Errors

The AI Evals module (`terraform/modules/ai-evals/`) has 5 submodules: networking, database, ecs, alb, api_gateway.

**Diagnosis**:
```bash
# Target a specific module
terraform plan -target=module.ai_evals
terraform plan -target=module.ai_evals.module.ecs
```

## Quick Reference: Getting Resource Identifiers

```bash
# All from Terraform output
cd terraform
terraform output

# Key outputs:
# - website_url
# - cloudfront_distribution_id
# - s3_bucket_name
# - ai_api_gateway_url
# - ai_evals_* (ECS cluster, service, ALB, etc.)
```

## Quick Reference: Emergency Actions

| Action | Command | Risk |
|--------|---------|------|
| Force new ECS deployment | `aws ecs update-service --cluster <C> --service <S> --force-new-deployment` | Rolling — no downtime if tasks healthy |
| Invalidate CloudFront | `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"` | Takes 1-2 min to propagate |
| Restart Lambda | Publish new version or update env var | Brief cold start |
| Stop stuck Terraform | `terraform force-unlock <LOCK_ID>` | Only if no apply is running |
| Scale ECS to 0 then back | `aws ecs update-service --desired-count 0` then `--desired-count 1` | Downtime during scale-down |
