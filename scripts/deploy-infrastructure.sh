#!/bin/bash
set -e

echo "🏗️ Deploying AWS infrastructure with Terraform..."

# Assume role for AWS access
ROLE_ARN="arn:aws:iam::671388079324:role/terraform-cooking-up-ideas"
SESSION_NAME="terraform-session"

# Assume role and get credentials
CREDS=$(aws sts assume-role \
    --role-arn "$ROLE_ARN" \
    --role-session-name "$SESSION_NAME" \
    --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
    --output text)

# Export environment variables
export AWS_ACCESS_KEY_ID=$(echo $CREDS | cut -d' ' -f1)
export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | cut -d' ' -f2)
export AWS_SESSION_TOKEN=$(echo $CREDS | cut -d' ' -f3)

echo "AWS credentials exported successfully"

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