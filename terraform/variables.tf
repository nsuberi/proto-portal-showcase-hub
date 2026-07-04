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

# Secret values (Anthropic API key, OIDC keys, GitHub OAuth credentials) live
# in AWS Secrets Manager and are read via data sources. See terraform/main.tf
# and terraform/research-workspace.tf for the data blocks; bootstrap with
# z_creds/bootstrap.sh.

variable "claude_api_url" {
  description = "Claude API endpoint URL"
  type        = string
  default     = "https://api.anthropic.com/v1/messages"
}

variable "claude_model" {
  description = "Claude model to use for AI analysis"
  type        = string
  default     = "claude-3-5-sonnet-20241022"
}

# When true, application will prefer Authorization/X-Client-Key for client key.
# Currently bypassed at runtime via TEMP_ALLOW_NO_CLIENT_KEY=true; see
# shared/api/AGENTS.md for the re-enable plan.
variable "api_gateway_enforcement" {
  description = "Enable API Gateway API key enforcement coordination with app layer"
  type        = bool
  default     = true
}

# Sandbox security monitoring
variable "sandbox_alert_email" {
  description = "Email for sandbox security alerts and budget notifications"
  type        = string
  default     = "nsuberi@gmail.com"
}

# Research workspace agent quota / access
variable "research_workspace_allowlist" {
  description = "Comma-separated Cognito subs allowed to run agents. Empty = open to any logged-in user."
  type        = string
  default     = ""
}

variable "research_workspace_enable_scheduler" {
  description = "\"1\" enables autonomous recurring runs (quota-gated); \"0\" disables them."
  type        = string
  default     = "0"
}