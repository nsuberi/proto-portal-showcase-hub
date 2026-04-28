#!/bin/bash
set -e

# Seed the research-workspace DynamoDB table with existing inference-insights data
# and copy S3 content to the new path prefix.
# Run this ONCE after the initial terraform apply.

TABLE_NAME="research-workspace"
REGION="us-east-1"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Seeding Research Workspace DynamoDB ==="

# 1. Migrate insights-index.json → CONTENT# items
INDEX_FILE="$REPO_DIR/prototypes/inference-insights/data/insights-index.json"
if [ -f "$INDEX_FILE" ]; then
  echo "Migrating insights from $INDEX_FILE..."
  python3 -c "
import json, subprocess, sys

with open('$INDEX_FILE') as f:
    insights = json.load(f)

for insight in insights:
    # Remap content paths to new prefix
    content_path = insight.get('contentPath', '').replace('content/', 'content/insights/')
    cells_path = insight.get('cellsPath', '').replace('content/', 'content/insights/')

    item = {
        'pk': {'S': f'CONTENT#{insight[\"id\"]}'},
        'sk': {'S': 'META'},
        'contentType': {'S': 'insight'},
        'title': {'S': insight['title']},
        'summary': {'S': insight['summary']},
        'date': {'S': insight['date']},
        'contentPath': {'S': content_path},
        'cellsPath': {'S': cells_path},
        'tags': {'SS': insight.get('tags', ['untagged'])},
        'status': {'S': insight.get('status', 'new')},
        'sourceUrl': {'S': insight.get('sourceUrl', '')},
        'sourceTitle': {'S': insight.get('sourceTitle', '')},
        'author': {'S': 'nathan'},
    }

    # Add domains as a JSON string
    if 'domains' in insight:
        item['domains'] = {'S': json.dumps(insight['domains'])}

    cmd = [
        'aws', 'dynamodb', 'put-item',
        '--table-name', '$TABLE_NAME',
        '--item', json.dumps(item),
        '--region', '$REGION'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f'  ✓ {insight[\"id\"]}')
    else:
        print(f'  ✗ {insight[\"id\"]}: {result.stderr}', file=sys.stderr)
"
else
  echo "No insights-index.json found, skipping insights migration."
fi

# 2. Migrate memory.json → STATE#memory
MEMORY_FILE="$REPO_DIR/prototypes/inference-insights/data/memory.json"
if [ -f "$MEMORY_FILE" ]; then
  echo "Migrating research memory..."
  MEMORY_JSON=$(cat "$MEMORY_FILE")
  aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item "{
      \"pk\": {\"S\": \"STATE#memory\"},
      \"sk\": {\"S\": \"v1\"},
      \"data\": {\"S\": $(echo "$MEMORY_JSON" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}
    }" \
    --region "$REGION"
  echo "  ✓ STATE#memory"
fi

# 3. Migrate feedback.json → STATE#feedback
FEEDBACK_FILE="$REPO_DIR/prototypes/inference-insights/data/feedback.json"
if [ -f "$FEEDBACK_FILE" ]; then
  echo "Migrating feedback..."
  FEEDBACK_JSON=$(cat "$FEEDBACK_FILE")
  aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item "{
      \"pk\": {\"S\": \"STATE#feedback\"},
      \"sk\": {\"S\": \"v1\"},
      \"data\": {\"S\": $(echo "$FEEDBACK_JSON" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}
    }" \
    --region "$REGION"
  echo "  ✓ STATE#feedback"
fi

# 4. Copy S3 content to new prefix (if AWS creds are available)
if command -v aws &> /dev/null; then
  BUCKET=$(cd "$REPO_DIR/terraform" && terraform output -raw s3_bucket_name 2>/dev/null || echo "portfolio-portal-code")
  echo ""
  echo "Copying S3 content from inference-insights to research-workspace..."
  aws s3 cp "s3://$BUCKET/prototypes/inference-insights/content/" \
    "s3://$BUCKET/prototypes/research-workspace/content/insights/" \
    --recursive --region "$REGION" 2>/dev/null || echo "  (S3 copy skipped — content may not exist yet)"

  aws s3 cp "s3://$BUCKET/prototypes/inference-insights/data/" \
    "s3://$BUCKET/prototypes/research-workspace/data/" \
    --recursive --region "$REGION" 2>/dev/null || echo "  (S3 data copy skipped)"
fi

echo ""
echo "=== Seed complete ==="
