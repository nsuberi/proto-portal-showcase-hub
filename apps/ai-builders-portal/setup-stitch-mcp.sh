#!/usr/bin/env bash
# Setup Stitch MCP server with fresh Google Cloud OAuth credentials
set -euo pipefail

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo "Error: No gcloud project configured. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Using Google Cloud project: $PROJECT_ID"
echo "Fetching access token..."

ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)
if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Could not get access token. Run: gcloud auth login"
  exit 1
fi

echo "Removing existing stitch MCP server (if any)..."
claude mcp remove stitch -s user 2>/dev/null || true

echo "Adding stitch MCP server with fresh credentials..."
claude mcp add \
  --transport http \
  -s user \
  stitch \
  https://stitch.googleapis.com/mcp \
  --header "Authorization: Bearer ${ACCESS_TOKEN}" \
  --header "X-Goog-User-Project: ${PROJECT_ID}"

echo ""
echo "Stitch MCP configured. Verifying..."
claude mcp get stitch
