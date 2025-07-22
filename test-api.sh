#!/bin/bash

# Test API endpoints with curl
# Usage: ./test-api.sh [API_URL] [CLAUDE_API_KEY]

API_URL=${1:-"http://localhost:3003"}
CLAUDE_API_KEY=${2:-"your-claude-api-key-here"}

echo "🧪 Testing AI Analysis API"
echo "📍 URL: $API_URL"
echo "🔑 API Key: ${CLAUDE_API_KEY:0:10}..."
echo ""

# Health check
echo "🏥 Health check..."
curl -s -w "\nStatus: %{http_code}\n" "$API_URL/health" | head -20
echo ""

# AI Analysis request
echo "🧠 Testing AI Analysis endpoint..."
curl -X POST "$API_URL/api/v1/ai-analysis/skill-recommendations" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -d "{
    \"apiKey\": \"$CLAUDE_API_KEY\",
    \"character\": {
      \"name\": \"Rikku\",
      \"role\": \"Thief\", 
      \"currentXP\": 1500,
      \"level\": 15,
      \"masteredSkills\": [\"steal\", \"use\", \"pilfer-gil\"]
    },
    \"availableSkills\": [
      {
        \"id\": \"mug\",
        \"name\": \"Mug\",
        \"description\": \"Steal gil and items while attacking\",
        \"category\": \"Thief\",
        \"level\": 2,
        \"xp_required\": 200,
        \"prerequisites\": [\"steal\"]
      },
      {
        \"id\": \"flee\",
        \"name\": \"Flee\",
        \"description\": \"Escape from battle\",
        \"category\": \"Thief\", 
        \"level\": 1,
        \"xp_required\": 100,
        \"prerequisites\": []
      }
    ],
    \"allSkills\": [
      {
        \"id\": \"steal\",
        \"name\": \"Steal\",
        \"description\": \"Take items from enemies\",
        \"category\": \"Thief\",
        \"level\": 1,
        \"xp_required\": 50,
        \"prerequisites\": []
      },
      {
        \"id\": \"use\",
        \"name\": \"Use\",
        \"description\": \"Use items in battle\",
        \"category\": \"Item\",
        \"level\": 1,
        \"xp_required\": 30,
        \"prerequisites\": []
      },
      {
        \"id\": \"pilfer-gil\",
        \"name\": \"Pilfer Gil\",
        \"description\": \"Steal money from enemies\",
        \"category\": \"Thief\",
        \"level\": 1,
        \"xp_required\": 80,
        \"prerequisites\": []
      },
      {
        \"id\": \"mug\",
        \"name\": \"Mug\",
        \"description\": \"Steal gil and items while attacking\",
        \"category\": \"Thief\",
        \"level\": 2,
        \"xp_required\": 200,
        \"prerequisites\": [\"steal\"]
      },
      {
        \"id\": \"flee\",
        \"name\": \"Flee\",
        \"description\": \"Escape from battle\",
        \"category\": \"Thief\",
        \"level\": 1,
        \"xp_required\": 100,
        \"prerequisites\": []
      }
    ],
    \"context\": {
      \"goalSkill\": \"Master Thief\"
    }
  }"