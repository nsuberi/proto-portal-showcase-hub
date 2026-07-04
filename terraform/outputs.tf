output "website_url" {
  description = "Website URL"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "custom_domain_url" {
  description = "Custom domain URL"
  value       = "https://portfolio.cookinupideas.com"
}

output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.portfolio.arn
}

output "route53_zone_id" {
  description = "Route 53 zone ID"
  value       = data.aws_route53_zone.main.zone_id
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.website.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.website.id
}

# AI Analysis API Outputs
output "ai_api_url" {
  description = "AI Analysis API URL (Lambda Function URL)"
  value       = aws_lambda_function_url.ai_api.function_url
}

output "ai_api_gateway_url" {
  description = "AI Analysis API Gateway URL"
  value       = "https://${aws_api_gateway_rest_api.ai_api_gateway.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.ai_api_stage.stage_name}"
}

output "ai_api_gateway_api_key" {
  description = "API Gateway API key (if enabled). Prefer retrieving from state in CI, do not log publicly."
  value       = try(aws_api_gateway_api_key.approved_prototypes.value, "")
  sensitive   = true
}

output "ai_api_function_name" {
  description = "Lambda function name for AI Analysis API"
  value       = aws_lambda_function.ai_api.function_name
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.ai_api_gateway.id
}

# AI Evals in Context Outputs
# The Flask app, RDS, API Gateway, and ECR were retired on 2026-06-28. Only the
# shared ALB + ECS cluster (used by Research Workspace) remain.
output "ai_evals_alb_dns_name" {
  description = "Shared ALB DNS name (Research Workspace origin + OAuth callback)"
  value       = module.ai_evals.alb_dns_name
}

output "ai_evals_ecs_cluster_name" {
  description = "Shared ECS cluster name"
  value       = module.ai_evals.ecs_cluster_name
}

# Research Workspace Outputs
output "research_workspace_ecr_repository_url" {
  description = "Research Workspace ECR repository URL"
  value       = module.research_workspace.ecr_repository_url
}

output "research_workspace_ecs_service_name" {
  description = "Research Workspace ECS service name"
  value       = module.research_workspace.ecs_service_name
}