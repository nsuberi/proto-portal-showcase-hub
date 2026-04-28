#!/usr/bin/env bash
# Boots the borrower-agent Flask app locally.
set -euo pipefail

cd "$(dirname "$0")/.."

# Stamp the code hash once so it appears consistently in every log line.
export CODE_HASH="$(python -m cli hash)"
export PORT="${PORT:-5100}"

cat <<EOF
-----------------------------------------------------------
  borrower-agent starting
  CODE_HASH: $CODE_HASH
  Open:      http://localhost:$PORT/
  Health:    http://localhost:$PORT/health
  Chat:      POST http://localhost:$PORT/chat
  Stop with: Ctrl-C
-----------------------------------------------------------
EOF
exec python -m app.server
