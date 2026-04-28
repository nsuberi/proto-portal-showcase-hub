bucket_name = "portfolio-portal-code"
aws_region  = "us-east-1"
environment = "production"

# All sensitive values (Anthropic key, OIDC keypair, GitHub OAuth credentials)
# are read from AWS Secrets Manager via terraform data sources. Bootstrap with
# z_creds/bootstrap.sh. No secret values are passed via TF_VAR_*.