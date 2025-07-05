#!/bin/bash
set -e

echo "🏗️ Deploying AWS infrastructure with Terraform..."

# Check required environment variables
if [ -z "$TF_VAR_bucket_name" ]; then
    echo "❌ Error: TF_VAR_bucket_name environment variable is required"
    exit 1
fi

# Navigate to terraform directory
cd terraform

# Initialize Terraform
echo "🔧 Initializing Terraform..."
terraform init

# Validate configuration
echo "🔍 Validating Terraform configuration..."
terraform validate

# Plan deployment
echo "📋 Planning Terraform deployment..."
terraform plan -out=tfplan

# Apply deployment
echo "🚀 Applying Terraform configuration..."
terraform apply tfplan

# Output important values
echo "📊 Deployment outputs:"
terraform output

echo "✅ Infrastructure deployment completed!"