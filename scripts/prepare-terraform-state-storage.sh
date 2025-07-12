#!/bin/bash

# Note: AWS credentials are provided by the CI/CD environment
# No need to assume role here as it's handled by the GitHub Actions workflow

echo "Preparing Terraform state storage..."

# Create S3 bucket for state
aws s3 mb s3://portfolio-portal-terraform-state

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5