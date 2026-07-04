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

# Quota / agent auth
variable "quota_table_name" {
  description = "DynamoDB table name used for per-user agent quota tracking"
  type        = string
}

variable "quota_table_arn" {
  description = "DynamoDB table ARN for quota IAM grants"
  type        = string
}

variable "anthropic_api_key_secret_arn" {
  description = "Secrets Manager ARN holding the operator ANTHROPIC_API_KEY (injected into the task)"
  type        = string
}

variable "allowlist" {
  description = "Comma-separated Cognito subs allowed to run agents. Empty = allow all (open)."
  type        = string
  default     = ""
}

variable "enable_scheduler" {
  description = "Set to \"1\" to enable autonomous recurring runs (quota-gated). Off by default."
  type        = string
  default     = "0"
}

# Container configuration
variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8080
}

# Right-sized for cost: the Node server is light; the weight is the spawned agent
# engine. 0.5 vCPU / 1 GB is the smallest valid Fargate combo here. If agent runs
# OOM or throttle under load, bump back toward 1024/2048.
variable "container_cpu" {
  description = "CPU units for the container (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Memory for the container in MB"
  type        = number
  default     = 1024
}

# Security & monitoring
variable "idle_minutes" {
  description = "Minutes of no activity (no heartbeat) before the reaper scales the service to 0"
  type        = number
  default     = 15
}

variable "scheduled_stop_cron" {
  description = "EventBridge cron for the nightly hard scale-to-zero backstop (UTC)"
  type        = string
  default     = "cron(0 7 * * ? *)"
}

variable "alert_email" {
  description = "Email for CloudWatch alarm and budget notifications"
  type        = string
  default     = "nsuberi@gmail.com"
}

variable "max_vault_size_bytes" {
  description = "EFS storage alarm threshold in bytes (default 5 GB)"
  type        = number
  default     = 5368709120
}
