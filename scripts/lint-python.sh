#!/usr/bin/env bash
# Python Lint — runs black (check), flake8, and mypy on the AI Evals Flask app
# Run: ./scripts/lint-python.sh [--fix]
#   --fix  Auto-format with black instead of just checking

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EVALS_DIR="$ROOT_DIR/apps/ai-evals-in-context/ai-testing-resource"
LINT_VENV="$ROOT_DIR/.lint-venv"
FIX_MODE=false
ERRORS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

for arg in "$@"; do
  case "$arg" in
    --fix) FIX_MODE=true ;;
  esac
done

echo "=== Python Lint ==="
echo ""

# Locate Python environment
# Priority: app venv > dedicated lint venv > create lint venv
if [ -f "$EVALS_DIR/.venv/bin/python3" ]; then
  PYTHON="$EVALS_DIR/.venv/bin/python3"
  PIP="$EVALS_DIR/.venv/bin/pip"
  echo "Using app virtualenv: $EVALS_DIR/.venv"
elif [ -f "$LINT_VENV/bin/python3" ]; then
  PYTHON="$LINT_VENV/bin/python3"
  PIP="$LINT_VENV/bin/pip"
  echo "Using lint virtualenv: $LINT_VENV"
elif command -v python3 &>/dev/null; then
  echo "Creating lint virtualenv at $LINT_VENV..."
  python3 -m venv "$LINT_VENV"
  PYTHON="$LINT_VENV/bin/python3"
  PIP="$LINT_VENV/bin/pip"
  "$PIP" install -q black flake8 mypy
  echo "  Installed black, flake8, mypy"
else
  echo -e "${RED}No python3 found. Skipping Python linting.${NC}"
  exit 0
fi

# Ensure lint tools are available
ensure_tool() {
  local tool="$1"
  if ! "$PYTHON" -m "$tool" --version &>/dev/null 2>&1; then
    echo "  Installing $tool..."
    "$PIP" install -q "$tool"
  fi
}

ensure_tool black
ensure_tool flake8

HAVE_MYPY=true
if ! "$PYTHON" -m mypy --version &>/dev/null 2>&1; then
  HAVE_MYPY=false
fi

# Build array of directories/files to lint (only those that exist)
DOJO_DIR="$ROOT_DIR/apps/code-dojo"

LINT_TARGETS=()
for d in \
  "$EVALS_DIR/app" \
  "$EVALS_DIR/viewer" \
  "$EVALS_DIR/tsr" \
  "$EVALS_DIR/monitoring" \
  "$EVALS_DIR/scripts" \
  "$EVALS_DIR/config.py" \
  "$EVALS_DIR/run.py" \
  "$DOJO_DIR/app.py" \
  "$DOJO_DIR/config.py" \
  "$DOJO_DIR/seed_data.py" \
  "$DOJO_DIR/models" \
  "$DOJO_DIR/routes" \
  "$DOJO_DIR/services" \
  "$DOJO_DIR/middleware" \
  "$DOJO_DIR/tests"; do
  [ -e "$d" ] && LINT_TARGETS+=("$d")
done

if [ ${#LINT_TARGETS[@]} -eq 0 ]; then
  echo -e "${YELLOW}No Python source directories found. Skipping.${NC}"
  exit 0
fi

echo "Linting ${#LINT_TARGETS[@]} targets..."

# 1. Black — formatting check (or fix)
echo ""
if [ "$FIX_MODE" = true ]; then
  echo "Running black (auto-format)..."
  "$PYTHON" -m black "${LINT_TARGETS[@]}" 2>&1 || true
else
  echo "Running black --check..."
  BLACK_OUTPUT=$("$PYTHON" -m black --check "${LINT_TARGETS[@]}" 2>&1 || true)
  REFORMAT_COUNT=$(echo "$BLACK_OUTPUT" | grep -c "would reformat" || true)
  if [ "$REFORMAT_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}  $REFORMAT_COUNT file(s) need formatting. Run 'yarn lint:python --fix' to auto-format.${NC}"
    ERRORS=$((ERRORS + 1))
  fi
fi

# 2. Flake8 — style and error checking
#    Errors (blocking): F811 redefined, F821 undefined name, F841 unused variable, E999 syntax error
#    Warnings (non-blocking): F401 unused import, E302/E305 spacing, E402 import order
echo ""
echo "Running flake8..."
FLAKE8_OUTPUT=$("$PYTHON" -m flake8 \
  --exclude .venv,__pycache__,node_modules \
  --max-line-length 120 \
  --extend-ignore E501,W503 \
  "${LINT_TARGETS[@]}" 2>&1 || true)

if [ -n "$FLAKE8_OUTPUT" ]; then
  # Check for blocking errors (syntax errors, undefined names, redefined names)
  BLOCKING=$(echo "$FLAKE8_OUTPUT" | grep -E "F811|F821|E999" || true)
  if [ -n "$BLOCKING" ]; then
    echo -e "${RED}Blocking flake8 errors:${NC}"
    echo "$BLOCKING"
    ERRORS=$((ERRORS + 1))
  fi
  # Show all issues as informational
  ISSUE_COUNT=$(echo "$FLAKE8_OUTPUT" | grep -c '.' || true)
  echo -e "${YELLOW}  flake8: $ISSUE_COUNT issues found (F811/F821/E999 are blocking, others are warnings).${NC}"
fi

# 3. Mypy — type checking (non-blocking, treated as warnings)
if [ "$HAVE_MYPY" = true ]; then
  echo ""
  echo "Running mypy (warnings only)..."
  "$PYTHON" -m mypy \
    --ignore-missing-imports \
    --exclude '.venv|__pycache__' \
    "${LINT_TARGETS[@]}" 2>&1 || echo -e "${YELLOW}  mypy reported issues (non-blocking).${NC}"
fi

# Summary
echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}Python linting found errors.${NC}"
  echo "Run 'yarn lint:python --fix' to auto-format, then fix remaining flake8 issues."
  exit 1
else
  echo -e "${GREEN}Python linting passed.${NC}"
  exit 0
fi
