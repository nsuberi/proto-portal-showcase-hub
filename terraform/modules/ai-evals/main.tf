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

# Database: RDS PostgreSQL with Secrets Manager
module "database" {
  source = "./modules/database"

  name_prefix          = local.name_prefix
  vpc_id               = module.networking.vpc_id
  private_subnet_ids   = module.networking.private_subnet_ids
  db_security_group_id = module.networking.db_security_group_id

  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_name              = var.db_name
  db_username          = var.db_username
}

# ALB: Application Load Balancer
module "alb" {
  source = "./modules/alb"

  name_prefix           = local.name_prefix
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  container_port        = var.container_port
  certificate_arn       = var.certificate_arn
  ecs_security_group_id = module.networking.ecs_security_group_id
}

# ECS: Cluster, task definition, service
module "ecs" {
  source = "./modules/ecs"

  name_prefix           = local.name_prefix
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id

  container_cpu    = var.container_cpu
  container_memory = var.container_memory
  container_port   = var.container_port

  db_host                = module.database.db_endpoint
  db_port                = module.database.db_port
  db_name                = var.db_name
  db_username            = var.db_username
  db_password_secret_arn = module.database.db_password_secret_arn

  anthropic_api_key_secret_arn = var.anthropic_api_key_secret_arn

  target_group_arn = module.alb.target_group_arn
}

# API Gateway: HTTP API with VPC Link to ECS
module "api_gateway" {
  source = "./modules/api_gateway"

  name_prefix           = local.name_prefix
  vpc_id                = module.networking.vpc_id
  vpc_link_subnet_ids   = module.networking.public_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  cloud_map_service_arn = module.ecs.cloud_map_service_arn
  container_port        = var.container_port
}
