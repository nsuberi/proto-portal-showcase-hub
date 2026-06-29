# AI Evals in Context - Infrastructure Module
# Composes all sub-modules for ECS Fargate deployment

locals {
  name_prefix = "${var.app_name}-${var.environment}"
}

# Networking: VPC, subnets, security groups
module "networking" {
  source = "./modules/networking"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  container_port     = var.container_port
}

# ALB: Application Load Balancer
# Retained for the Research Workspace service (shared HTTPS listener +
# security group, and the Cognito OAuth callback origin). The AI Evals app
# no longer registers a target; the listener's default action is an empty
# target group, which is harmless.
module "alb" {
  source = "./modules/alb"

  name_prefix           = local.name_prefix
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  container_port        = var.container_port
  certificate_arn       = var.certificate_arn
  ecs_security_group_id = module.networking.ecs_security_group_id
}

# ECS: Shared Fargate cluster only.
# The AI Evals Flask app (task definition, service, RDS database, API Gateway,
# ECR, Cloud Map) was retired on 2026-06-28 to stop hosting costs. The cluster
# remains because the Research Workspace service runs on it.
module "ecs" {
  source = "./modules/ecs"

  name_prefix = local.name_prefix
}
