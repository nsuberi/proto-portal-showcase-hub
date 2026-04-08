#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
# dev-start.sh — Start the full local development stack
#
# Usage:
#   ./scripts/dev-start.sh              # All services (AI Evals + AI Builders Portal)
#   ./scripts/dev-start.sh --no-evals   # Skip AI Evals
#   ./scripts/dev-start.sh --neo4j      # Also start Neo4j for FFX
#   ./scripts/dev-start.sh --evals-docker # Run AI Evals via Docker instead of direct Flask
# ──────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EVALS_DIR="$ROOT_DIR/apps/ai-evals-in-context/ai-testing-resource"
FFX_DIR="$ROOT_DIR/prototypes/ffx-skill-map"
START_EVALS=true
EVALS_MODE="local"    # "local" or "docker"
START_NEO4J=false
PIDS=()

# Parse flags
for arg in "$@"; do
  case "$arg" in
    --no-evals)     START_EVALS=false ;;
    --neo4j)        START_NEO4J=true ;;
    --evals-docker) EVALS_MODE="docker" ;;
    -h|--help)
      echo "Usage: ./scripts/dev-start.sh [--no-evals] [--neo4j] [--evals-docker]"
      echo ""
      echo "  --no-evals      Skip AI Evals app entirely"
      echo "  --neo4j         Start Neo4j for FFX (default: skip, uses mock data)"
      echo "  --evals-docker  Run AI Evals via Docker instead of direct Flask"
      exit 0
      ;;
  esac
done

# ── Cleanup on exit ──────────────────────────────────────

cleanup() {
  echo ""
  echo "Shutting down..."

  # Kill background processes
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done

  # Stop Docker services
  if [ "$START_EVALS" = true ] && [ "$EVALS_MODE" = "docker" ]; then
    echo "Stopping AI Evals Docker stack..."
    (cd "$EVALS_DIR" && docker compose down) 2>/dev/null || true
  fi

  if [ "$START_NEO4J" = true ]; then
    echo "Stopping Neo4j..."
    (cd "$FFX_DIR" && docker compose down) 2>/dev/null || true
  fi

  # Wait for all children
  wait 2>/dev/null || true
  echo "Done."
}

trap cleanup EXIT INT TERM

# ── Docker services ──────────────────────────────────────

if [ "$START_NEO4J" = true ]; then
  echo "Starting Neo4j..."
  (cd "$FFX_DIR" && docker compose up -d)
  echo "  Neo4j: http://localhost:7474 (neo4j/password)"
fi

if [ "$START_EVALS" = true ]; then
  # Check for .env file
  if [ ! -f "$EVALS_DIR/.env" ]; then
    if [ -f "$EVALS_DIR/.env.example" ]; then
      echo "  Warning: No .env found. Copying .env.example (add your ANTHROPIC_API_KEY)"
      cp "$EVALS_DIR/.env.example" "$EVALS_DIR/.env"
    fi
  fi

  if [ "$EVALS_MODE" = "local" ]; then
    echo "Starting AI Evals Flask app..."

    if [ ! -d "$EVALS_DIR/.venv" ]; then
      echo "  Creating virtualenv..."
      (cd "$EVALS_DIR" && python3 -m venv .venv)
      (cd "$EVALS_DIR" && .venv/bin/pip install -r requirements.txt)
    fi

    (cd "$EVALS_DIR" && .venv/bin/python3 run.py) &
    PIDS+=($!)
    echo "  AI Evals: http://localhost:8082/ai-evals/ (via proxy)"

  elif [ "$EVALS_MODE" = "docker" ]; then
    echo "Starting AI Evals Docker stack (PostgreSQL + Redis + Flask)..."
    (cd "$EVALS_DIR" && docker compose up -d --build)
    echo "  AI Evals: http://localhost:8082/ai-evals/ (via proxy)"

    # Tell the proxy to use port 5001 (Docker maps 5000→5001)
    export AI_EVALS_PORT=5001
  fi
fi

# ── Node services (portfolio, prototypes, API, proxy) ────

echo "Starting Node services..."
cd "$ROOT_DIR"
yarn dev:all &
PIDS+=($!)

echo ""
echo "================================================"
echo "  All services starting."
echo "  Open http://localhost:8082 for the full stack."
echo "================================================"
echo ""

# Wait for all background jobs
wait
