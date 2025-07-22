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