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

# Go back to root directory
cd ..

# Step 2: Build frontend with the real API URL
echo ""
echo "📋 Step 2: Building frontend with API Gateway URL..."
cd prototypes/ffx-skill-map

echo "📦 Installing dependencies..."
npm ci

echo "🔧 Replacing placeholder with API Gateway URL: $API_GATEWAY_URL"
# Replace the placeholder in the source code before building
sed -i.bak "s|PLACEHOLDER_API_GATEWAY_URL|$API_GATEWAY_URL|g" src/components/SecureAIAnalysisWidget.tsx

echo "🔧 Building with API Gateway URL: $API_GATEWAY_URL"
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

# Upload the main site files
if [ -d "dist" ]; then
    echo "📤 Uploading main site files..."
    aws s3 sync dist/ s3://$S3_BUCKET/ --delete
fi

# Upload the ffx-skill-map prototype
echo "📤 Uploading ffx-skill-map prototype..."
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
echo "🧪 Test the AI skill recommendations at:"
echo "   $WEBSITE_URL/prototypes/ffx-skill-map/"