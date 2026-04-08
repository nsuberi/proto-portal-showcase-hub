# Stage 1: Build React frontend
FROM node:20-slim AS frontend-builder

WORKDIR /build

# Copy workspace root files needed for dependency resolution
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/
COPY shared/design-tokens/package.json shared/design-tokens/
COPY shared/ui-components/package.json shared/ui-components/
COPY apps/code-dojo/frontend/package.json apps/code-dojo/frontend/

# Install dependencies
RUN corepack enable && yarn install

# Copy source files needed for build
COPY shared/design-tokens/ shared/design-tokens/
COPY shared/ui-components/ shared/ui-components/
COPY apps/code-dojo/frontend/ apps/code-dojo/frontend/

# Build the React app
RUN cd apps/code-dojo/frontend && npx vite build

# Stage 2: Python application
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY apps/code-dojo/requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Install test dependencies
COPY apps/code-dojo/requirements-test.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements-test.txt

# Copy application code
COPY apps/code-dojo/ .

# Copy React build output from frontend stage
COPY --from=frontend-builder /build/apps/code-dojo/frontend/dist /app/frontend_dist

# Create directories for data persistence
RUN mkdir -p /app/instance

# Expose Flask port
EXPOSE 5002

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:5002/health || exit 1

# Use entrypoint script for runtime initialization
RUN chmod +x /app/scripts/entrypoint.sh

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
