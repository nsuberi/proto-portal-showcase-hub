# Deploying AI Portfolio Website to AWS with Terraform

This guide explains how to deploy your AI portfolio website to AWS using Terraform for infrastructure as code.

## Architecture Overview

The deployment uses a serverless architecture optimized for static websites:

- **S3 Bucket**: Hosts the built static files
- **CloudFront**: CDN for global content delivery and HTTPS
- **Route53**: DNS management (optional, for custom domains)
- **ACM**: SSL certificate management (optional, for custom domains)

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** installed (version 1.0+)
3. **Node.js and npm** for building the React application
4. **AWS Account** with programmatic access

### AWS Permissions Required

Your AWS user/role needs the following permissions:
- S3 full access
- CloudFront full access
- Route53 full access (if using custom domain)
- ACM full access (if using custom domain)
- IAM read access

## Project Structure

```
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
├── scripts/
│   └── deploy.sh
└── dist/ (generated after build)
```

## Terraform Configuration

### 1. Create Terraform Files

Create a `terraform/` directory with the following files:

#### `terraform/main.tf`

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 bucket for hosting
resource "aws_s3_bucket" "website" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # SPA routing
  }
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      },
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${var.bucket_name}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # SPA routing - redirect 404s to index.html
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "AI Portfolio Website"
    Environment = var.environment
  }
}
```

#### `terraform/variables.tf`

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 bucket name for website hosting"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
```

#### `terraform/outputs.tf`

```hcl
output "website_url" {
  description = "Website URL"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.website.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.website.id
}
```

### 2. Configure Variables

Create `terraform/terraform.tfvars`:

```hcl
bucket_name = "your-ai-portfolio-website-unique-name"
aws_region  = "us-east-1"
environment = "production"
```

## Deployment Steps

### 1. Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### 2. Initialize and Deploy Infrastructure

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the infrastructure
terraform apply
```

### 3. Upload Website Files

```bash
# Sync built files to S3
aws s3 sync ../dist/ s3://your-ai-portfolio-website-unique-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

## Automation Script

Create `scripts/deploy.sh` for automated deployment:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying AI Portfolio Website..."

# Build the application
echo "📦 Building application..."
npm run build

# Deploy infrastructure
echo "🏗️ Deploying infrastructure..."
cd terraform
terraform apply -auto-approve

# Get outputs
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
WEBSITE_URL=$(terraform output -raw website_url)

# Upload files
echo "📤 Uploading files to S3..."
cd ..
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Website URL: $WEBSITE_URL"
```

Make it executable:
```bash
chmod +x scripts/deploy.sh
```

## Custom Domain Setup (Optional)

To use a custom domain, add these resources to your `main.tf`:

```hcl
# ACM certificate (must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "website" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Route53 hosted zone
resource "aws_route53_zone" "website" {
  name = var.domain_name
}

# Route53 record for domain validation
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.website.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.website.zone_id
}

# Route53 record pointing to CloudFront
resource "aws_route53_record" "website" {
  zone_id = aws_route53_zone.website.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}
```

## Monitoring and Maintenance

### CloudWatch Monitoring

CloudFront automatically provides metrics in CloudWatch:
- Requests
- Data transfer
- Error rates
- Cache hit ratio

### Cost Optimization

- S3 costs are minimal for static websites
- CloudFront has a generous free tier
- Consider enabling S3 lifecycle policies for old versions

### Security Best Practices

1. Enable AWS Config for compliance monitoring
2. Use AWS WAF with CloudFront for DDoS protection
3. Enable CloudTrail for audit logging
4. Regularly update Terraform and AWS provider versions

## Troubleshooting

### Common Issues

1. **S3 bucket name conflicts**: Bucket names must be globally unique
2. **CloudFront propagation**: Changes can take 5-15 minutes to propagate
3. **SPA routing**: Ensure custom error responses are configured for 404 → index.html

### Useful Commands

```bash
# Check Terraform state
terraform show

# View CloudFront logs
aws logs describe-log-groups --log-group-name-prefix /aws/cloudfront

# Test website
curl -I https://your-cloudfront-domain.amazonaws.com
```

## Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

## Estimated Costs

For a typical portfolio website:
- S3: ~$1-5/month
- CloudFront: Free tier covers most personal websites
- Route53: ~$0.50/month per hosted zone (if using custom domain)

Total: ~$1-10/month depending on traffic and custom domain usage.