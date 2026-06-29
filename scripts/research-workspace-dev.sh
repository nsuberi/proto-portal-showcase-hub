#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Research Workspace — local dev launcher
#
# Starts the Claude Agent SDK backend (port 8080) and the React SPA (port 3011)
# and makes it VERY obvious where the logs are. All output is tee'd to files
# under apps/research-workspace/dev-logs/ AND streamed to this terminal.
#
#   Backend log : apps/research-workspace/dev-logs/backend.log
#   SPA log     : apps/research-workspace/dev-logs/spa.log
#
# Tail them anytime:
#   tail -f apps/research-workspace/dev-logs/backend.log
#   tail -f apps/research-workspace/dev-logs/spa.log
#
# Requires ANTHROPIC_API_KEY in your env for agent runs (the server starts
# without it, but runs will fail until it's set).
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT/apps/research-workspace"
SPA_DIR="$ROOT/prototypes/research-workspace"
LOG_DIR="$BACKEND_DIR/dev-logs"
BACKEND_LOG="$LOG_DIR/backend.log"
SPA_LOG="$LOG_DIR/spa.log"

mkdir -p "$LOG_DIR"

# Local vault root (the container default /workspace is not writable on macOS).
export VAULT_ROOT="${VAULT_ROOT:-$BACKEND_DIR/dev-vault}"
mkdir -p "$VAULT_ROOT"

echo "═══════════════════════════════════════════════════════════════"
echo "  Research Workspace dev — logs are written to:"
echo "    backend → $BACKEND_LOG"
echo "    spa     → $SPA_LOG"
echo "    vault   → $VAULT_ROOT"
echo "═══════════════════════════════════════════════════════════════"

ENV_FILE="$SPA_DIR/.env"
if [ -z "${ANTHROPIC_API_KEY:-}" ] && ! grep -q "ANTHROPIC_API_KEY" "$ENV_FILE" 2>/dev/null; then
  echo "  ⚠  No ANTHROPIC_API_KEY found — agent runs will fail."
  echo "     Add it to $ENV_FILE  (ANTHROPIC_API_KEY=sk-ant-...) — it's gitignored."
  echo "═══════════════════════════════════════════════════════════════"
fi

# Free the ports if something is already bound to them.
for port in 8080 3011; do
  pid="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [ -n "$pid" ]; then
    echo "  Stopping existing process on port $port (pid $pid)"
    kill "$pid" 2>/dev/null || true
  fi
done

cleanup() {
  echo ""
  echo "  Shutting down dev servers…"
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "${SPA_PID:-}" ] && kill "$SPA_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Backend (node --watch) — restarts on file change. `npm run dev` loads the
# operator key from prototypes/research-workspace/.env via --env-file-if-exists.
( cd "$BACKEND_DIR" && npm run dev ) 2>&1 | tee "$BACKEND_LOG" &
BACKEND_PID=$!

# SPA (vite).
( cd "$SPA_DIR" && npm run dev ) 2>&1 | tee "$SPA_LOG" &
SPA_PID=$!

echo "  Backend: http://localhost:8080  |  SPA: http://localhost:3011/prototypes/research-workspace/"
echo "  Press Ctrl-C to stop both."
wait
