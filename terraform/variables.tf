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

# AI Analysis API Configuration
variable "jwt_secret" {
  description = "JWT secret for API authentication"
  type        = string
  sensitive   = true
  default     = ""
}

variable "api_key_salt" {
  description = "Salt for API key generation"
  type        = string
  sensitive   = true
  default     = ""
}

# NOTE: Claude API key is now stored in AWS Secrets Manager
# Secret name: prod/proto-portal/claude-api-key
# No longer passed as Terraform variable for security

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

# When true, application will prefer Authorization/X-Client-Key for client key
variable "api_gateway_enforcement" {
  description = "Enable API Gateway API key enforcement coordination with app layer"
  type        = bool
  default     = true
}

variable "api_gateway_api_key_value" {
  description = "Optional explicit API Gateway API key value (otherwise generated randomly)"
  type        = string
  sensitive   = true
  default     = ""
}

# AI Evals in Context Configuration
variable "ai_evals_anthropic_api_key" {
  description = "Anthropic API key for AI Evals application"
  type        = string
  sensitive   = true
  default     = ""
}

# Research Workspace Configuration
variable "research_workspace_anthropic_api_key" {
  description = "Anthropic API key for Research Workspace Claude chat"
  type        = string
  sensitive   = true
  default     = ""
}

# Code Dojo Configuration
variable "code_dojo_anthropic_api_key" {
  description = "Anthropic API key for Code Dojo"
  type        = string
  sensitive   = true
  default     = ""
}

variable "code_dojo_github_token" {
  description = "GitHub token for Code Dojo PR analysis"
  type        = string
  sensitive   = true
  default     = ""
}

variable "code_dojo_openai_api_key" {
  description = "OpenAI API key for Code Dojo Whisper transcription"
  type        = string
  sensitive   = true
  default     = ""
}

variable "code_dojo_langsmith_api_key" {
  description = "LangSmith API key for Code Dojo tracing"
  type        = string
  sensitive   = true
  default     = ""
}

variable "code_dojo_flask_secret_key" {
  description = "Flask secret key for Code Dojo sessions"
  type        = string
  sensitive   = true
  default     = ""
}