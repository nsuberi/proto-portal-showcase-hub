#!/usr/bin/env bash
# Install git hooks for the proto-portal monorepo
# Run once after cloning: ./scripts/setup-hooks.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.git/hooks"

echo "Installing git hooks..."

# Install pre-commit hook
cp "$ROOT_DIR/scripts/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"
echo "  Installed pre-commit hook"

echo "Done. Lint checks will run before each commit."
echo "To skip (emergency): git commit --no-verify"
