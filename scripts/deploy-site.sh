#!/bin/bash
set -e

echo "📤 Deploying website to AWS S3..."

# Get Terraform outputs
cd terraform
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
API_GATEWAY_URL=$(terraform output -raw ai_api_gateway_url)
cd ..

# Validate that we got the API Gateway URL
if [ -z "$API_GATEWAY_URL" ]; then
    echo "❌ Error: API_GATEWAY_URL is empty! Check Terraform outputs."
    exit 1
fi

echo "🔧 Rebuilding frontend with correct API Gateway URL: $API_GATEWAY_URL"

# Build all prototypes using the centralized build script
echo "🏗️ Running full build process..."
./scripts/build.sh

# Replace API Gateway URL placeholders in built files
echo "🔧 Replacing API Gateway URL placeholders..."
find dist/ -name "*.js" -type f -exec sed -i.bak "s|PLACEHOLDER_API_GATEWAY_URL|${API_GATEWAY_URL}|g" {} \;
find dist/ -name "*.html" -type f -exec sed -i.bak "s|PLACEHOLDER_API_GATEWAY_URL|${API_GATEWAY_URL}|g" {} \;

# Remove backup files
find dist/ -name "*.bak" -type f -delete

# Sync files to S3
echo "🗂️ Syncing files to S3 bucket: $BUCKET_NAME"
aws s3 sync dist/ s3://$BUCKET_NAME --delete --exclude "*.map"

# Set correct content types
echo "🏷️ Setting content types..."
aws s3 cp s3://$BUCKET_NAME s3://$BUCKET_NAME --recursive \
    --exclude "*" --include "*.html" \
    --content-type "text/html" --metadata-directive REPLACE

aws s3 cp s3://$BUCKET_NAME s3://$BUCKET_NAME --recursive \
    --exclude "*" --include "*.js" \
    --content-type "application/javascript" --metadata-directive REPLACE

aws s3 cp s3://$BUCKET_NAME s3://$BUCKET_NAME --recursive \
    --exclude "*" --include "*.css" \
    --content-type "text/css" --metadata-directive REPLACE

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"

echo "✅ Website deployment completed!"
echo "🌐 Your site will be available shortly at the CloudFront URL"