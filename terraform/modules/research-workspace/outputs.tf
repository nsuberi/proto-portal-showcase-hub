output "ecr_repository_url" {
  description = "ECR repository URL for the research workspace image"
  value       = aws_ecr_repository.main.repository_url
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.main.name
}
