#!/bin/bash
set -e

echo "📤 Deploying website to AWS S3..."

# Get Terraform outputs
cd terraform
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
cd ..

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