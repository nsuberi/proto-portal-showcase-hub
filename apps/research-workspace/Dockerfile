FROM node:20-slim

# Install build tools for node-pty + CLI tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    curl \
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

# Create non-root user
RUN groupadd -g 1000 coder && useradd -u 1000 -g coder -m coder
RUN chown coder:coder /workspace

# App directory
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev

COPY src/ src/

# Bake in a vault README
COPY vault-readme.md /workspace/README.md
RUN chown coder:coder /workspace/README.md

# Run as non-root user
USER coder

ENV PORT=8080
ENV VAULT_ROOT=/workspace
EXPOSE 8080

CMD ["node", "src/server.js"]
