# Development and Deployment Overview

This guide describes the overall approach for building, testing, and deploying this multi-SPA portfolio project. It intentionally avoids references to specific file paths or implementation details and focuses on architecture, workflows, and best practices.

## Environments at a glance

- **Local development (localhost)**: Run apps on your machine to iterate quickly with hot reload and realistic API stubs or backends.
- **Deployed environment (cloud)**: Build once, deploy static artifacts and services to cloud infrastructure behind a CDN.
- **CI/CD automation**: Use GitHub Actions to build, test, and deploy on every change to the main branch.

## Local development

- Run SPAs on `http://localhost` ports so links and routing work as they will in production.
- Prefer a single entry point (e.g., a lightweight dev proxy or reverse proxy) that forwards to each SPA. This mirrors production CDN routing and reduces “works-locally-only” bugs.
- When possible, run a production build locally and serve it via a simple static server to spot base-path or asset-url issues.
- Keep routing consistent across local and prod (e.g., use the same base paths for sub-apps). Ensure navigation between SPAs works at both localhost and the deployed domain.
- The FFX Skill Map app is available at localhost on port 3001 during development.

### Environment variables in local development

- Use dotenv-style files (e.g., `.env`, `.env.local`, `.env.development`) for local-only secrets and configuration.
- Do not commit real secrets. Provide non-sensitive examples via a sample env file if needed.
- Use clearly named variables (e.g., `API_BASE_URL`, `FEATURE_FLAG_X`) and ensure defaults exist for local runs.

## Deployment strategy (cloud)

- Host static frontends behind a CDN for performance and caching.
- Store immutable build artifacts (e.g., a `/dist` bundle) and invalidate the CDN cache on release.
- Provision infrastructure with Infrastructure-as-Code (IaC) so environments are reproducible and reviewable (e.g., Terraform, CDK, Pulumi).
- Use versioned deployments and simple rollbacks.

### Secrets in the deployed environment

- Store and retrieve sensitive values from a managed secrets service (e.g., AWS Secrets Manager). Never bake real secrets into client-side bundles or commit them to the repo.
- Grant minimal IAM permissions to the workloads that need to read secrets (principle of least privilege).
- Prefer short-lived credentials (e.g., OIDC with GitHub Actions) over long-lived keys.

## Local .env files vs AWS Secrets Manager

| Concern | Local with .env | Deployed with AWS Secrets Manager |
|---|---|---|
| Distribution | Easy for developers; per-machine files | Centralized, auditable, and rotated |
| Security | Risky if committed or shared | Encrypted at rest/in transit; access via IAM |
| Rotation | Manual per developer | Automated or programmatic rotation |
| Auditability | Limited | Access logs and policies |
| Usage | Load into dev servers/tools at startup | Retrieved at runtime by server-side workloads |

Key rule: Client-side code must not contain real secrets. For any value required in the browser, use public, non-sensitive config or a server-side proxy.

## Ensuring dev/prod parity

- Match base paths and routing in local and production builds.
- Use the same environment variable names across environments; only values differ.
- Test production builds locally before releasing (build + preview server) to catch missing assets, base path, and caching issues.
- Keep API schemas and contracts consistent; mock or point to a staging API locally to mirror latency and responses.

## CI/CD with GitHub Actions

- On pull requests: run lint, type-check, unit tests, and build checks.
- On merges to main: run the full build, provision/update infrastructure with IaC, upload artifacts, and invalidate CDN.
- Use OpenID Connect (OIDC) to obtain temporary cloud credentials; avoid storing long-lived keys.
- Keep deployment workflows idempotent and re-runnable.

## High-level release flow

1. Developer runs apps locally on `localhost` and verifies inter-SPA navigation and API calls.
2. Developer runs a production build locally and smoke-tests it.
3. Merge to main triggers GitHub Actions: build, test, upload artifacts, deploy infra, and update CDN.
4. Production environment reads configuration and secrets from managed services; no secrets are embedded in client bundles.
5. Monitor, roll back, or roll forward as needed.

## Troubleshooting guidance

- If routing works in dev but not in prod, check base paths, index fallback rules, and CDN cache invalidation.
- If API calls fail only in prod, verify environment-specific URLs, CORS policies, and secret retrieval.
- If builds differ locally versus CI, align Node and package manager versions and lockfiles.

## Security and compliance

- Treat all secrets as production data; never print in logs or commit them.
- Limit blast radius with least-privilege roles and per-environment isolation.
- Review IaC changes in pull requests like application code.

By following these practices, local testing on `localhost` closely mirrors deployed artifacts, minimizing deployment-only surprises while keeping secrets safe and deploys predictable.