output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = module.api_gateway.api_endpoint
}

output "api_gateway_domain" {
  description = "API Gateway domain name (for CloudFront origin configuration)"
  value       = module.api_gateway.api_domain
}

output "ecr_repository_url" {
  description = "ECR repository URL for Docker images"
  value       = module.ecs.ecr_repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.database.db_endpoint
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for ECS tasks"
  value       = module.ecs.log_group_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name (for CloudFront origin)"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID for Route 53 alias records"
  value       = module.alb.alb_zone_id
}

output "alb_https_listener_arn" {
  description = "HTTPS listener ARN for adding path-based rules"
  value       = module.alb.alb_https_listener_arn
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = module.alb.alb_security_group_id
}

# Shared infrastructure outputs for co-hosted apps
output "ecs_cluster_arn" {
  description = "ECS cluster ARN for running additional services"
  value       = module.ecs.cluster_arn
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = module.networking.ecs_security_group_id
}

output "db_port" {
  description = "RDS database port"
  value       = module.database.db_port
}

output "db_password_secret_arn" {
  description = "ARN of Secrets Manager secret for DB password"
  value       = module.database.db_password_secret_arn
}
