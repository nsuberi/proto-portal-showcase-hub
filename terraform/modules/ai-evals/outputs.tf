# NOTE: The AI Evals Flask app, its RDS database, API Gateway, and ECR repo
# were retired on 2026-06-28 to stop hosting costs. The outputs below are the
# shared infrastructure still consumed by the Research Workspace service.

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name (for CloudFront origin + Cognito OAuth callback)"
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
