#!/bin/bash
set -e

echo "🏗️ Deploying AWS infrastructure with Terraform..."

# Note: AWS credentials are provided by the CI/CD environment
# No need to assume role here as it's handled by the GitHub Actions workflow

# Setup environment
echo "🔧 Initializing Terraform..."
cd terraform
terraform init

echo "📋 Planning infrastructure changes..."
terraform plan

echo "🚀 Applying infrastructure changes..."
terraform apply -auto-approve

echo "📊 Deployment outputs:"
terraform output

cd ..
echo "✅ Infrastructure deployment completed!"