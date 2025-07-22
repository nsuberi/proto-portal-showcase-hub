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

variable "claude_api_key" {
  description = "Claude API key for AI analysis"
  type        = string
  sensitive   = true
}

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