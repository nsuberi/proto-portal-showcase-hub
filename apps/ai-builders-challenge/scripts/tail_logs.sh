#!/usr/bin/env bash
# Pretty-prints stdout JSONL from a running challenge app or a file.
# Usage:
#   ./scripts/tail_logs.sh               # tail localhost:5100/logs
#   ./scripts/tail_logs.sh path/to.jsonl # pretty-print a file
set -euo pipefail

if [ $# -eq 0 ]; then
  curl -s "http://localhost:${PORT:-5100}/logs?limit=50" \
    | python -c 'import sys, json; [print(json.dumps(e)) for e in json.load(sys.stdin)["entries"]]' \
    | python -m json.tool --no-ensure-ascii 2>/dev/null || cat
else
  cat "$1"
fi
