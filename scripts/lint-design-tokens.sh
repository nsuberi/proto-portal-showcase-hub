#!/usr/bin/env bash
# Design Token Lint — checks for hardcoded color values in prototype source code
# Run: ./scripts/lint-design-tokens.sh
# Exit code: 0 = clean, 1 = violations found
#
# Ignore mechanisms:
#   Per-line:  // design-token-lint-ignore
#   Per-file:  Add "design-token-lint-ignore" anywhere in the file (e.g. top comment)

set -euo pipefail

VIOLATIONS=0
WARNINGS=0
SCAN_DIRS="prototypes/*/src shared/*/src"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "=== Design Token Lint ==="
echo ""

# Build a list of files that have a file-level ignore comment
IGNORED_FILES=$(grep -rl 'design-token-lint-ignore' $SCAN_DIRS 2>/dev/null \
  --include="*.ts" --include="*.tsx" || true)

# Helper: filter out ignored files and lines from grep results
filter_ignored() {
  local input="$1"
  if [ -z "$input" ]; then
    echo ""
    return
  fi

  # Filter out per-line ignores
  local result
  result=$(echo "$input" | grep -v '// design-token-lint-ignore' || true)

  # Filter out file-level ignores
  if [ -n "$IGNORED_FILES" ]; then
    for f in $IGNORED_FILES; do
      result=$(echo "$result" | grep -v "^${f}:" || true)
    done
  fi

  echo "$result"
}

# 1. Hardcoded hex colors in TS/TSX files
echo "Checking for hardcoded hex colors in TypeScript..."
RAW_HEX=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "'#[0-9a-fA-F]{3,8}'|\"#[0-9a-fA-F]{3,8}\"" \
  $SCAN_DIRS 2>/dev/null \
  | grep -v 'hslToHex' \
  | grep -v 'cssVar(' \
  | grep -v '\.test\.' \
  | grep -v '__tests__' \
  | grep -v 'node_modules' \
  || true)

HEX_MATCHES=$(filter_ignored "$RAW_HEX")

if [ -n "$HEX_MATCHES" ]; then
  echo -e "${YELLOW}WARNING: Hardcoded hex colors found (use design tokens or hslToHex):${NC}"
  echo "$HEX_MATCHES" | while IFS= read -r line; do
    [ -n "$line" ] && echo -e "  ${RED}$line${NC}"
  done
  COUNT=$(echo "$HEX_MATCHES" | grep -c '.' || true)
  VIOLATIONS=$((VIOLATIONS + COUNT))
  echo ""
fi

# 2. Hardcoded rgb/rgba in TS/TSX files
echo "Checking for hardcoded rgb/rgba colors in TypeScript..."
RAW_RGB=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "rgba?\([0-9]" \
  $SCAN_DIRS 2>/dev/null \
  | grep -v 'hslToHex\|hexToRgba' \
  | grep -v '\.test\.' \
  | grep -v '__tests__' \
  | grep -v 'node_modules' \
  || true)

RGB_MATCHES=$(filter_ignored "$RAW_RGB")

if [ -n "$RGB_MATCHES" ]; then
  echo -e "${YELLOW}WARNING: Hardcoded rgb/rgba colors found:${NC}"
  echo "$RGB_MATCHES" | while IFS= read -r line; do
    [ -n "$line" ] && echo -e "  ${RED}$line${NC}"
  done
  COUNT=$(echo "$RGB_MATCHES" | grep -c '.' || true)
  VIOLATIONS=$((VIOLATIONS + COUNT))
  echo ""
fi

# 3. Non-semantic Tailwind color utilities (bg-gray-*, text-blue-*, etc.)
echo "Checking for non-semantic Tailwind color classes..."
RAW_TW=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "(bg|text|border|ring)-(gray|blue|red|green|yellow|purple|pink|orange|indigo|cyan|emerald|rose|amber|lime|teal|sky|violet|fuchsia)-[0-9]" \
  $SCAN_DIRS 2>/dev/null \
  | grep -v '\.test\.' \
  | grep -v '__tests__' \
  | grep -v 'node_modules' \
  || true)

TW_MATCHES=$(filter_ignored "$RAW_TW")

if [ -n "$TW_MATCHES" ]; then
  COUNT=$(echo "$TW_MATCHES" | grep -c '.' || true)
  echo -e "${YELLOW}WARNING: $COUNT non-semantic Tailwind color classes found (prefer bg-primary, text-muted-foreground, etc.)${NC}"
  echo -e "${YELLOW}  Run with --verbose to see details. These are warnings, not blocking errors.${NC}"
  if [ "${1:-}" = "--verbose" ]; then
    echo "$TW_MATCHES" | while IFS= read -r line; do
      [ -n "$line" ] && echo -e "  ${YELLOW}$line${NC}"
    done
  fi
  WARNINGS=$((WARNINGS + COUNT))
  echo ""
fi

# 4. Check that each prototype has a tokens file — shared baseline OR prototype-local.
#    Accepted patterns (any one satisfies):
#      - @proto-portal/design-tokens/css/tokens.css     (opt-in shared baseline)
#      - design-system/theme.css                         (ffx-skill-map-style local theme)
#      - any CSS file named tokens.css or theme.css      (prototype-local tokens)
#      - :root { --... } CSS custom property declarations (prototype defines tokens inline)
echo "Checking prototype CSS imports..."
for proto_dir in prototypes/*/; do
  proto_name=$(basename "$proto_dir")
  CSS_FILES=$(find "$proto_dir/src" -name "*.css" -not -path "*/node_modules/*" 2>/dev/null || true)

  if [ -n "$CSS_FILES" ]; then
    # Accept shared or local tokens/theme imports
    HAS_TOKENS_IMPORT=$(grep -rlE "design-tokens/css/tokens\.css|design-system/theme\.css|tokens\.css|theme\.css" $CSS_FILES 2>/dev/null || true)

    # Also accept a file that defines CSS custom properties directly (:root { --... })
    HAS_INLINE_TOKENS=$(grep -rlE ":root\s*\{[^}]*--" $CSS_FILES 2>/dev/null || true)

    # Or a file that is itself named tokens.css or theme.css
    HAS_LOCAL_TOKENS_FILE=$(echo "$CSS_FILES" | grep -E "(tokens|theme)\.css$" || true)

    if [ -z "$HAS_TOKENS_IMPORT" ] && [ -z "$HAS_INLINE_TOKENS" ] && [ -z "$HAS_LOCAL_TOKENS_FILE" ]; then
      echo -e "  ${RED}$proto_name: No tokens file found. Define tokens.css/theme.css with CSS custom properties, or import @proto-portal/design-tokens/css/tokens.css${NC}"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
done

echo ""

# Summary
if [ "$VIOLATIONS" -gt 0 ]; then
  echo -e "${RED}Found $VIOLATIONS design token error(s).${NC}"
  [ "$WARNINGS" -gt 0 ] && echo -e "${YELLOW}Also found $WARNINGS non-semantic Tailwind class warnings.${NC}"
  echo "Fix with design tokens, or add '// design-token-lint-ignore' to intentional exceptions."
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "${GREEN}No blocking errors.${NC}"
  echo -e "${YELLOW}$WARNINGS non-semantic Tailwind class warnings (non-blocking).${NC}"
  exit 0
else
  echo -e "${GREEN}No design token violations found.${NC}"
  exit 0
fi
