#!/bin/bash
set -e

echo "🏗️ Deploying AWS infrastructure with Terraform..."

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