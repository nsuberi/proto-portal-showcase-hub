# API Overview

Secure backend for AI analysis supporting local development and cloud deployment.

- Local: Express server on `http://localhost:3003`
- Production: API Gateway + Lambda behind CloudFront
- Auth: API key (HMAC-SHA256) via `X-API-Key`
- Security: helmet, rate limiting, CORS, payload limits, structured logging

Endpoints and setup details are implemented in `api/`.

Related docs:
- Security and secrets: `./SECURITY.md`
- Development & Deployment: `./DEVELOPMENT_AND_DEPLOYMENT.md`
