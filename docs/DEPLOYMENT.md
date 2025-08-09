# Deployment Guide

Deploy static frontends behind a CDN with Infrastructure-as-Code and automate via CI/CD.

## Strategy
- Immutable build artifacts uploaded to object storage/CDN
- CDN cache invalidation on release
- Reproducible infrastructure managed by IaC (e.g., Terraform)
- Centralized configuration and secrets via a managed secrets store

## CI/CD (GitHub Actions)
- PRs: lint, type-check, tests, build checks
- Main: build, upload artifacts, infra apply/update, CDN invalidation
- Use OIDC for temporary cloud credentials instead of long-lived keys

## Secrets in deployments
- Store production secrets in AWS Secrets Manager; never embed secrets in client bundles.
- Grant least-privilege IAM policies to workloads that need access.
- Prefer short-lived credentials sourced at deploy/runtime.

## Dev/prod consistency
- Keep base paths and SPA fallback behavior identical to local.
- Test the production build locally before release.

Related docs:
- Security and secrets: `./SECURITY.md`
- Development workflow: `./DEVELOPMENT.md`
- Design tokens & responsive: `./DESIGN_TOKENS.md`
