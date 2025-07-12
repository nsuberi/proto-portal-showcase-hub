#!/bin/bash
set -e

echo "🏗️ Deploying AWS infrastructure with Terraform..."

# Setup environment
echo "🔧 Initializing Terraform..."
cd terraform
terraform init

echo "📋 Planning infrastructure changes..."
terraform plan

echo "🚀 Applying infrastructure changes..."

# Apply with targeted approach to handle CloudFront Function dependency
echo "📦 Updating CloudFront distribution first to handle function dependencies..."
terraform apply -target=aws_cloudfront_distribution.website -auto-approve || true

echo "🔄 Applying full configuration..."
terraform apply -auto-approve

echo "📊 Deployment outputs:"
terraform output

cd ..
echo "✅ Infrastructure deployment completed!"