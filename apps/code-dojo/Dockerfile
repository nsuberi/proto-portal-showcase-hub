FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Install test dependencies
COPY requirements-test.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements-test.txt

# Copy application code
COPY . .

# Create directories for data persistence
RUN mkdir -p /app/instance

# Expose Flask port
EXPOSE 5002

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:5002/health || exit 1

# Use entrypoint script for runtime initialization
COPY scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
