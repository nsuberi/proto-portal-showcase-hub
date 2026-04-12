FROM node:20-slim

# Install build tools for node-pty + CLI tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    curl \
    ca-certificates \
    unzip \
    jq \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | sh || true

# Install AWS CLI v2
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o /tmp/awscli.zip \
    && cd /tmp && unzip -q awscli.zip && ./aws/install && rm -rf /tmp/aws*

# Create workspace directory (EFS mount point)
RUN mkdir -p /workspace

# Use existing node user (uid/gid 1000 in node:20-slim)
RUN chown node:node /workspace

# App directory
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev

COPY src/ src/

# Bake in a vault README
COPY vault-readme.md /workspace/README.md
RUN chown node:node /workspace/README.md

# Run as non-root user
USER node

ENV PORT=8080
ENV VAULT_ROOT=/workspace
EXPOSE 8080

CMD ["node", "src/server.js"]
