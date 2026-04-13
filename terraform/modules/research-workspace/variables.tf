# Research Workspace ECS Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "research-workspace-prod"
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

# EFS
variable "efs_file_system_id" {
  description = "EFS file system ID for vault storage"
  type        = string
}

variable "efs_access_point_id" {
  description = "EFS access point ID for initial user"
  type        = string
}

# Cognito
variable "cognito_user_pool_arn" {
  description = "Cognito user pool ARN"
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "Cognito user pool client ID"
  type        = string
}

variable "cognito_domain" {
  description = "Cognito hosted UI domain"
  type        = string
}

# Container configuration
variable "container_port" {
  description = "Port the container listens on (code-server default)"
  type        = number
  default     = 8080
}

variable "container_cpu" {
  description = "CPU units for the container (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "container_memory" {
  description = "Memory for the container in MB"
  type        = number
  default     = 2048
}

variable "anthropic_api_key" {
  description = "Anthropic API key for Claude Code chat integration"
  type        = string
  default     = ""
  sensitive   = true
}

# Security & monitoring
variable "alert_email" {
  description = "Email for CloudWatch alarm and budget notifications"
  type        = string
  default     = ""
}

variable "max_vault_size_bytes" {
  description = "EFS storage alarm threshold in bytes (default 5 GB)"
  type        = number
  default     = 5368709120
}
