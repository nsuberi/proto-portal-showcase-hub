# Development Overview

Use localhost-based development that mirrors deployed routing and base paths to minimize deployment-only issues. Prefer a single local entry point (e.g., a simple proxy) that forwards to each SPA, matching production CDN behavior.

## Local environment variables

- Use dotenv-style files (e.g., `.env`, `.env.local`) for local-only configuration.
- Do not commit real secrets; provide non-sensitive examples instead.

## Dev/Prod parity

- Test production builds locally with a static preview server before releasing.
- Keep environment variable names consistent across environments; only values differ.

## CI/CD automation

- GitHub Actions runs checks on pull requests and deploys on merges to main.

For a complete overview—including the comparison of local `.env` usage vs. AWS Secrets Manager, and the overall deployment strategy—see:

- [Development and Deployment Overview](./DEVELOPMENT_AND_DEPLOYMENT.md)
