#!/bin/bash

# Build script that injects Lambda Function URL from Terraform output
# Usage: ./scripts/build-with-api-url.sh

set -e

echo "🚀 Building frontend with Lambda API URL..."

# Check if we're in the right directory
if [ ! -f "terraform/main.tf" ]; then
    echo "❌ Error: Must be run from the root directory of the project"
    exit 1
fi

# Get Lambda Function URL from Terraform output
cd terraform

echo "📋 Getting Lambda Function URL from Terraform output..."
if ! AI_API_URL=$(terraform output -raw ai_api_url 2>/dev/null); then
    echo "⚠️  Warning: Could not get ai_api_url from Terraform output"
    echo "   This might be because:"
    echo "   1. Terraform hasn't been applied yet"
    echo "   2. The Lambda Function URL resource isn't deployed"
    echo "   3. You need to run 'terraform apply' first"
    echo ""
    echo "🏗️  Building with localhost fallback..."
    AI_API_URL="http://localhost:3003"
fi

echo "🔧 Using API URL: $AI_API_URL"

# Go back to root and build the frontend
cd ..
cd prototypes/ffx-skill-map

echo "📦 Building ffx-skill-map frontend..."
REACT_APP_AI_API_URL="$AI_API_URL" npm run build

echo "✅ Build completed successfully!"
echo "   API URL configured: $AI_API_URL"
echo "   Build output: prototypes/ffx-skill-map/dist/"