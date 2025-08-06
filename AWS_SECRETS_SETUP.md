# AWS Secrets Manager Setup for Claude API Key

This document describes how to securely store and use the Claude API key using AWS Secrets Manager for the proto-portal-showcase-hub application.

## Overview

The application has been configured to use server-side API key management instead of client-provided API keys. This approach provides better security by:

- Keeping API keys server-side only
- Using AWS Secrets Manager for secure storage
- Preventing API key exposure in client-side code
- Centralized key management and rotation

## Prerequisites

- AWS CLI configured with appropriate permissions
- Access to AWS Secrets Manager in your target region
- A valid Anthropic Claude API key

## Setup Instructions

### 1. Create the Secret in AWS Secrets Manager

#### Option A: Using AWS CLI

```bash
# Create the secret with the recommended name
aws secretsmanager create-secret \
  --name "prod/proto-portal/claude-api-key" \
  --description "Claude API key for Proto Portal Showcase Hub" \
  --secret-string '{"apiKey":"your-claude-api-key-here"}' \
  --region us-east-1
```

#### Option B: Using AWS Console

1. Navigate to AWS Secrets Manager in your AWS Console
2. Click "Store a new secret"
3. Select "Other type of secret"
4. For the key-value pairs, add:
   - Key: `apiKey`
   - Value: `your-claude-api-key-here` (your actual Claude API key starting with `sk-ant-api`)
5. Click "Next"
6. For secret name, use: `prod/proto-portal/claude-api-key`
7. Add description: "Claude API key for Proto Portal Showcase Hub"
8. Click "Next" through the remaining steps
9. Click "Store"

### 2. Environment Configuration

Set the following environment variables in your deployment:

#### Required Variables
```bash
# Enable AWS Secrets Manager integration
AWS_SECRETS_ENABLED=true

# AWS region where the secret is stored (default: us-east-1)
AWS_REGION=us-east-1

# Secret name in AWS Secrets Manager (default: prod/proto-portal/claude-api-key)
CLAUDE_SECRET_NAME=prod/proto-portal/claude-api-key
```

#### Optional Variables (with defaults)
```bash
# Claude API configuration
CLAUDE_API_URL=https://api.anthropic.com/v1/messages
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### 3. IAM Permissions

Ensure your application's IAM role/user has the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT-ID:secret:prod/proto-portal/claude-api-key*"
        }
    ]
}
```

Replace `YOUR-ACCOUNT-ID` with your actual AWS account ID.

## Secret Name Convention

The default secret name is: `prod/proto-portal/claude-api-key`

This follows the pattern: `{environment}/{application}/{key-type}`

You can customize this by setting the `CLAUDE_SECRET_NAME` environment variable.

## Secret Format

The secret must be stored as JSON with the following structure:

```json
{
  "apiKey": "sk-ant-api03-your-actual-api-key-here"
}
```

Alternative key names supported:
- `apiKey` (recommended)
- `CLAUDE_API_KEY`

## Development vs Deployed Setup

### Local Development Setup

For local development, the application uses environment variables instead of AWS Secrets Manager:

#### 1. Environment File Setup
```bash
# Copy the sample environment file
cp .env.sample .env

# Edit .env and add your Claude API key
CLAUDE_API_KEY=sk-ant-api03-your-actual-api-key-here
AWS_SECRETS_ENABLED=false
NODE_ENV=development
```

#### 2. Local Development Modes

**Option A: Use Local Environment Variable (Recommended)**
```bash
# In your .env file
AWS_SECRETS_ENABLED=false
CLAUDE_API_KEY=sk-ant-api03-your-actual-api-key-here
```

**Option B: Test AWS Secrets Manager Locally**
```bash
# In your .env file (requires AWS CLI configured)
AWS_SECRETS_ENABLED=true
AWS_REGION=us-east-1
CLAUDE_SECRET_NAME=prod/proto-portal/claude-api-key
```

**Option C: Mock Data Only**
```bash
# In your .env file
AWS_SECRETS_ENABLED=false
# Don't set CLAUDE_API_KEY - will use mock data
```

### Deployed/Production Setup

For deployed environments (staging, production), the application uses AWS Secrets Manager:

#### 1. Environment Variables
```bash
AWS_SECRETS_ENABLED=true
AWS_REGION=us-east-1
CLAUDE_SECRET_NAME=prod/proto-portal/claude-api-key
NODE_ENV=production
```

#### 2. Required AWS Resources
- **Secret**: `prod/proto-portal/claude-api-key` in AWS Secrets Manager
- **IAM Permissions**: Lambda execution role must have `secretsmanager:GetSecretValue` permission
- **Terraform**: Automatically provisions the required IAM policies (see terraform/lambda-api.tf)

#### 3. Terraform Configuration
The Terraform configuration automatically includes:
```hcl
# IAM policy allowing access to the Claude API key secret
{
  Effect = "Allow"
  Action = [
    "secretsmanager:GetSecretValue"
  ]
  Resource = "arn:aws:secretsmanager:us-east-1:ACCOUNT-ID:secret:prod/proto-portal/claude-api-key*"
}

# Environment variables for AWS Secrets Manager
AWS_SECRETS_ENABLED=true
AWS_REGION=us-east-1
CLAUDE_SECRET_NAME=prod/proto-portal/claude-api-key
```

## Verification

### Local Development Testing

#### Test Local .env Setup
```bash
# 1. Start the API server (in the /api directory)
cd api
npm run dev

# 2. In another terminal, test the health endpoint
curl -X GET http://localhost:3003/api/v1/ai-analysis/health

# 3. Start your frontend applications
# For FFX Skill Map (port 3001): 
cd prototypes/ffx-skill-map && npm run dev

# For Home Lending Learning:
cd prototypes/home-lending-learning && npm run dev
```

Expected response for working local setup:
```json
{
  "status": "healthy",
  "aiService": {
    "status": "healthy",
    "model": "claude-3-5-sonnet-20241022"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Production/Deployed Testing

You can verify the deployed setup by calling the health endpoint:

```bash
curl -X GET http://your-api-url/api/v1/ai-analysis/health
```

Expected response:
```json
{
  "status": "healthy",
  "aiService": {
    "status": "healthy",
    "model": "claude-3-5-sonnet-20241022"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error States

If the API key is not configured properly, you'll see:

1. **Widget Display**: "Server Side API key not configured"
2. **API Response**: HTTP 503 with error message about service unavailability
3. **Logs**: Error messages about AWS Secrets Manager access

## Security Best Practices

1. **Least Privilege**: Grant only the minimum required IAM permissions
2. **Secret Rotation**: Regularly rotate your Claude API key
3. **Monitoring**: Monitor access to the secret using CloudTrail
4. **Network Security**: Use VPC endpoints for Secrets Manager if possible
5. **Environment Separation**: Use different secrets for different environments

## Troubleshooting

### Common Issues

1. **"Server Side API key not configured"**
   - Check AWS credentials and IAM permissions
   - Verify secret name matches `CLAUDE_SECRET_NAME`
   - Ensure secret exists in the correct region

2. **"Access Denied" errors**
   - Review IAM permissions
   - Check if the secret ARN in permissions matches your actual secret

3. **"Secret not found"**
   - Verify the secret name and region
   - Check if `CLAUDE_SECRET_NAME` environment variable is set correctly

4. **API key format errors**
   - Ensure your Claude API key starts with `sk-ant-api`
   - Verify the JSON structure in the secret

### Debug Commands

```bash
# List secrets (requires list permissions)
aws secretsmanager list-secrets --region us-east-1

# Get secret value (requires read permissions)
aws secretsmanager get-secret-value \
  --secret-id prod/proto-portal/claude-api-key \
  --region us-east-1
```

## Cost Considerations

- AWS Secrets Manager charges $0.40 per secret per month
- Additional charges for API calls (first 10,000 calls free per month)
- This is typically much more cost-effective than potential API key exposure risks

## Support

For issues with:
- AWS Secrets Manager: Consult AWS documentation
- Claude API keys: Contact Anthropic support
- Application integration: Check application logs and error messages