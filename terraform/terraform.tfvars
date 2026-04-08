bucket_name = "portfolio-portal-code"
aws_region  = "us-east-1"
environment = "production"

# AI Evals Anthropic key is passed via TF_VAR_ai_evals_anthropic_api_key in CI
# or -var flag locally. Do not commit the actual key here.