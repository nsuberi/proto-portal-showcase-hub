#!/bin/bash

# Complete deployment script for the proto-portal with AI API
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting complete deployment process..."

# Check if we're in the right directory
if [ ! -f "terraform/main.tf" ]; then
    echo "❌ Error: Must be run from the root directory of the project"
    exit 1
fi

# Step 1: Deploy infrastructure with Terraform
echo "📋 Step 1: Deploying infrastructure with Terraform..."
cd terraform

echo "🔧 Initializing Terraform..."
terraform init

echo "📋 Planning Terraform changes..."
terraform plan

echo "🏗️  Applying Terraform configuration..."
terraform apply -auto-approve

# Get the deployed URLs
AI_API_URL=$(terraform output -raw ai_api_url)
API_GATEWAY_URL=$(terraform output -raw ai_api_gateway_url)
WEBSITE_URL=$(terraform output -raw website_url)
S3_BUCKET=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)

echo "✅ Infrastructure deployed successfully!"
echo "   🔗 Lambda API URL: $AI_API_URL"
echo "   🌐 API Gateway URL: $API_GATEWAY_URL"
echo "   🌐 Website URL: $WEBSITE_URL"

# Validate that we got the API Gateway URL
if [ -z "$API_GATEWAY_URL" ]; then
    echo "❌ Error: API_GATEWAY_URL is empty! Check Terraform outputs."
    exit 1
fi

# Go back to root directory
cd ..

# Step 2: Build frontend with the real API URL
echo ""
echo "📋 Step 2: Building frontend with API Gateway URL..."

# First, build all prototypes using the centralized build script
echo "🏗️ Running full build process..."
./scripts/build.sh

# Then customize FFX with API Gateway URL for AI integration
cd prototypes/ffx-skill-map

echo "📦 Installing dependencies..."
npm ci

echo "🔧 Replacing placeholder with API Gateway URL: $API_GATEWAY_URL"
# Verify placeholder exists before replacement
if ! grep -q "PLACEHOLDER_API_GATEWAY_URL" src/components/SecureAIAnalysisWidget.tsx; then
    echo "❌ Warning: PLACEHOLDER_API_GATEWAY_URL not found in SecureAIAnalysisWidget.tsx"
fi

# Replace the placeholder in the source code before building
sed -i.bak "s|PLACEHOLDER_API_GATEWAY_URL|$API_GATEWAY_URL|g" src/components/SecureAIAnalysisWidget.tsx

# Verify replacement worked
if grep -q "PLACEHOLDER_API_GATEWAY_URL" src/components/SecureAIAnalysisWidget.tsx; then
    echo "❌ Error: Placeholder replacement failed!"
    echo "🔍 Current content around line 86:"
    sed -n '84,88p' src/components/SecureAIAnalysisWidget.tsx
    exit 1
else
    echo "✅ Placeholder successfully replaced"
    echo "🔍 New URL in file:"
    grep -n "$API_GATEWAY_URL" src/components/SecureAIAnalysisWidget.tsx || echo "URL not found in expected location"
fi

echo "🔧 Building FFX with API Gateway URL: $API_GATEWAY_URL"
VITE_API_URL="$API_GATEWAY_URL" npm run build

echo "🔧 Restoring original source file..."
# Restore the original file with placeholder
mv src/components/SecureAIAnalysisWidget.tsx.bak src/components/SecureAIAnalysisWidget.tsx

echo "✅ Frontend built successfully!"

# Go back to root directory
cd ../..

# Step 3: Upload to S3
echo ""
echo "📋 Step 3: Uploading frontend to S3..."

# Upload all files from dist directory (includes main site and both prototypes)
if [ -d "dist" ]; then
    echo "📤 Uploading all site files (main + all prototypes)..."
    aws s3 sync dist/ s3://$S3_BUCKET/ --delete
fi

# Copy the updated FFX build (with API integration) over the existing one
echo "📤 Updating FFX prototype with API integration..."
aws s3 sync prototypes/ffx-skill-map/dist/ s3://$S3_BUCKET/prototypes/ffx-skill-map/ --delete

# Step 4: Invalidate CloudFront cache
echo ""
echo "📋 Step 4: Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   🌐 Website: $WEBSITE_URL"
echo "   🔗 AI API (Lambda): $AI_API_URL" 
echo "   🔗 AI API (Gateway): $API_GATEWAY_URL"
echo "   📦 S3 Bucket: $S3_BUCKET"
echo "   ☁️  CloudFront: $CLOUDFRONT_ID"
echo ""
echo "🧪 Test the prototypes at:"
echo "   FFX Skill Map (with AI): $WEBSITE_URL/prototypes/ffx-skill-map/"
echo "   Home Lending Learning: $WEBSITE_URL/prototypes/home-lending-learning/"