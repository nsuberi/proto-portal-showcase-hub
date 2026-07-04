# ECS Module - Shared Fargate cluster
#
# NOTE: The AI Evals Flask app (ECR repo, task definition, service, Cloud Map
# discovery, app IAM roles, and log group) was retired on 2026-06-28 to stop
# hosting costs while the prototype is reimagined as an eval-trace workspace.
# Only the cluster + capacity providers remain — they are SHARED with the
# Research Workspace service (consumed via cluster_arn). Do not remove them.

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = var.name_prefix

  setting {
    name  = "containerInsights"
    value = "disabled" # Disable for cost savings
  }

  tags = {
    Name = "${var.name_prefix}-cluster"
  }
}

# ECS Cluster Capacity Providers (Fargate Spot)
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE_SPOT", "FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
    base              = 0
  }
}
