# Domain Setup Instructions

This guide explains how to deploy your website to portfolio.cookinupideas.com using your existing Route 53 hosted zone.

## Prerequisites

1. You already have the domain `cookinupideas.com` with Route 53 hosted zone ID: `Z0990573XMA6PHFKL82S`
2. Your domain's nameservers are already pointing to AWS Route 53

## Setup Process

### Step 1: Deploy the Terraform Infrastructure

Deploy the Terraform configuration to create the certificate, CloudFront distribution, and DNS records:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

This will:
- Create an ACM certificate for portfolio.cookinupideas.com
- Configure CloudFront with the custom domain
- Create DNS records in your existing Route 53 zone
- Set up proper HTTPS configuration

### Step 2: Wait for Certificate Validation

The ACM certificate will be automatically validated through DNS. This usually takes 5-30 minutes.

You can check the certificate status in the AWS Console:
1. Go to AWS Certificate Manager
2. Look for the certificate for portfolio.cookinupideas.com
3. Wait until the status shows "Issued"

### Step 3: Verify the Setup

Once the deployment is complete and the certificate is issued, verify the setup:

```bash
# Check if the domain resolves to CloudFront
dig portfolio.cookinupideas.com

# Or use nslookup
nslookup portfolio.cookinupideas.com
```

You should see the domain resolving to CloudFront's servers.

### Step 6: Access Your Website

Once everything is set up, you can access your website at:
- https://portfolio.cookinupideas.com

## Troubleshooting

### Certificate Validation Issues
- The ACM certificate should validate automatically through DNS
- Check the AWS Console > Certificate Manager to ensure the certificate is "Issued"

### Domain Not Resolving
- Ensure the name servers are correctly set at your registrar
- Wait for full DNS propagation (up to 48 hours)
- Use `dig @8.8.8.8 portfolio.cookinupideas.com` to check DNS resolution

### 403 Forbidden Errors
- Ensure your S3 bucket has the correct public access policies
- Check that CloudFront is properly configured to serve from the S3 bucket

## Important Notes

- The Route 53 hosted zone costs $0.50 per month
- Data transfer and request costs apply based on usage
- Always use HTTPS (https://) when accessing the site
- The certificate is automatically renewed by AWS