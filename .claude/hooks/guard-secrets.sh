#!/usr/bin/env bash
# guard-secrets.sh — PreToolUse hook (Bash matcher).
#
# Blocks shell commands that would print live credentials to stdout, where they
# get captured into agent transcripts (~/.claude/projects/**/*.jsonl), shell
# history, and debug logs. This is the recurrence guard for the credential leak
# found in the local Claude logs (AWS keys, sk-ant keys, GitHub PAT).
#
# The approved pattern is a named AWS CLI profile (AWS_PROFILE=deploy), which
# assumes the role automatically WITHOUT ever materializing secret values in
# command output. See CLAUDE.md → "IAM Role" and terraform/AGENTS.md §3.
#
# Contract: read hook JSON on stdin. Exit 0 = allow. Exit 2 = block (stderr is
# shown to the model). Any other failure mode fails OPEN (exit 0) so a broken
# hook never wedges the session.
set -uo pipefail

input="$(cat)"

# Extract the Bash command string from the hook payload (fail open if we can't).
cmd="$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
if d.get("tool_name") != "Bash":
    sys.exit(0)
print(d.get("tool_input", {}).get("command", ""))
' 2>/dev/null)" || exit 0

[ -z "$cmd" ] && exit 0

block() {
  echo "BLOCKED by guard-secrets hook: $1" >&2
  echo "" >&2
  echo "This command would write live credential values to stdout, which get captured into" >&2
  echo "agent transcripts and shell history. Use a named AWS CLI profile instead — it assumes" >&2
  echo "the role automatically with NO secret values in any output:" >&2
  echo "    aws configure set role_arn <ROLE_ARN> --profile deploy" >&2
  echo "    aws configure set source_profile default --profile deploy   # or: credential_source Environment" >&2
  echo "    export AWS_PROFILE=deploy" >&2
  echo "See CLAUDE.md → 'IAM Role' and terraform/AGENTS.md §3." >&2
  exit 2
}

# 1. The classic leak: assume-role piped into a print of export AWS_SECRET...
if printf '%s' "$cmd" | grep -Eq 'assume-role' \
   && printf '%s' "$cmd" | grep -Eiq 'print.*(SecretAccessKey|AWS_SECRET_ACCESS_KEY|export AWS_)'; then
  block "assume-role output is being printed as 'export AWS_...' (credential leak to stdout)."
fi

# 2. Assigning the secret to a literal or command substitution (not via profile).
#    Allowed: referencing it ($AWS_SECRET_ACCESS_KEY) or unsetting it.
if printf '%s' "$cmd" | grep -Eq 'export[[:space:]]+AWS_SECRET_ACCESS_KEY=[^[:space:]$]' \
   || printf '%s' "$cmd" | grep -Eq 'export[[:space:]]+AWS_SECRET_ACCESS_KEY=\$\('; then
  block "exporting a raw AWS_SECRET_ACCESS_KEY value — use AWS_PROFILE instead."
fi

# 3. Echoing/printing a known credential variable's value.
if printf '%s' "$cmd" | grep -Eiq '(echo|printf|print)[^|;&]*\$\{?(AWS_SECRET_ACCESS_KEY|AWS_SESSION_TOKEN|ANTHROPIC_API_KEY|CLAUDE_API_KEY|GH_TOKEN|GITHUB_TOKEN|CREDS)\b'; then
  block "echoing a credential variable's value to stdout."
fi

# 4. Reading known secret-bearing files (would dump their contents into the transcript).
if printf '%s' "$cmd" | grep -Eq '(cat|less|more|bat|head|tail|nl|xxd|od)[[:space:]][^|;&]*(secrets\.env|z_creds/|\.pem\b|/\.aws/credentials|aws/credentials)'; then
  block "reading a secret-bearing file (secrets.env / z_creds/ / *.pem / ~/.aws/credentials) into stdout."
fi

exit 0
