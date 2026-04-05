variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "code-dojo-prod"
}

# Shared infrastructure from ai-evals
variable "vpc_id" {
  description = "VPC ID (shared with ai-evals)"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs (shared with ai-evals)"
  type        = list(string)
}

variable "ecs_cluster_arn" {
  description = "ECS cluster ARN (shared with ai-evals)"
  type        = string
}

variable "ecs_security_group_id" {
  description = "ECS security group ID (shared with ai-evals)"
  type        = string
}

variable "alb_https_listener_arn" {
  description = "ALB HTTPS listener ARN (shared with ai-evals)"
  type        = string
}

variable "alb_security_group_id" {
  description = "ALB security group ID (shared with ai-evals)"
  type        = string
}

# Database (shared RDS instance)
variable "db_host" {
  description = "Database host (shared ai-evals RDS)"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "Database name on shared RDS instance"
  type        = string
  default     = "tsr_db"
}

variable "db_username" {
  description = "Database username (shared with ai-evals)"
  type        = string
  default     = "tsr_user"
}

variable "db_password_secret_arn" {
  description = "ARN of Secrets Manager secret for shared DB password"
  type        = string
}

# Container configuration
variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 5002
}

variable "container_cpu" {
  description = "CPU units for the container (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "container_memory" {
  description = "Memory for the container in MB"
  type        = number
  default     = 512
}

# Code Dojo secrets
variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "github_token" {
  description = "GitHub token for PR analysis"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API key for Whisper transcription"
  type        = string
  sensitive   = true
  default     = ""
}

variable "langsmith_api_key" {
  description = "LangSmith API key for tracing"
  type        = string
  sensitive   = true
  default     = ""
}

variable "flask_secret_key" {
  description = "Flask session secret key"
  type        = string
  sensitive   = true
  default     = ""
}
