# Deployment Overview

This project deploys static frontends and supporting services to the cloud behind a CDN for speed, reliability, and caching. Infrastructure is provisioned with Infrastructure-as-Code (IaC) so environments are reproducible and reviewable.

- Build artifacts are produced once (e.g., a production bundle) and uploaded to cloud storage/CDN.
- Cache invalidation is performed on release to ensure users receive the latest assets.
- Configuration and sensitive values are provided at runtime via managed secret stores (e.g., AWS Secrets Manager) and environment variables on the server—never embedded in client bundles.
- Continuous Deployment is automated via GitHub Actions to provide a reliable, repeatable release pipeline.

## Secrets strategy in deployments

- Use a managed secrets service (such as AWS Secrets Manager) for all production secrets.
- Grant least-privilege IAM access to only the workloads that need them.
- Prefer short-lived credentials via OIDC from GitHub Actions over long-lived keys.

## CI/CD

- On merges to the main branch, GitHub Actions runs build, tests, infrastructure updates, artifact upload, and CDN invalidation.
- Pipelines are idempotent and re-runnable to recover from transient failures.

## Dev/Prod parity

- The deployed routing, base paths, and asset handling should match local behavior to avoid deployment-only surprises. Validate production builds locally before release.

For the full development and deployment philosophy, including localhost workflows and secrets management comparisons, see the combined guide:

- [Development and Deployment Overview](./DEVELOPMENT_AND_DEPLOYMENT.md)
