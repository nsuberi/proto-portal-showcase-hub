# Research Workspace - code-server on ECS Fargate with EFS vault storage
# Co-hosted on ai-evals cluster, Cognito-authenticated at ALB

locals {
  application_root  = "/prototypes/research-workspace/vault"
  # Express backend serves /healthz
  health_check_path = "/healthz"
  cluster_name      = split("/", var.ecs_cluster_arn)[1]
}

# --- ECR Repository ---

resource "aws_ecr_repository" "main" {
  name                 = var.name_prefix
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.name_prefix}-ecr"
  }
}

resource "aws_ecr_lifecycle_policy" "main" {
  repository = aws_ecr_repository.main.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only last 5 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# --- CloudWatch Log Group ---

resource "aws_cloudwatch_log_group" "main" {
  name              = "/ecs/${var.name_prefix}"
  retention_in_days = 30

  tags = {
    Name = "${var.name_prefix}-logs"
  }
}

# --- ALB Target Group + Listener Rules ---

resource "aws_lb_target_group" "main" {
  name        = var.name_prefix
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200,302"
    path                = local.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = {
    Name = "${var.name_prefix}-tg"
  }
}

# Public route: published gallery content (no auth required)
# Higher priority than the authenticated rule so gallery visitors
# can read published insights without Cognito login.
resource "aws_lb_listener_rule" "vault_published_public" {
  listener_arn = var.alb_https_listener_arn
  priority     = 89

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  condition {
    path_pattern {
      values = [
        "/prototypes/research-workspace/vault/api/vault/published",
        "/prototypes/research-workspace/vault/api/vault/published/*",
      ]
    }
  }
}

# Authenticated route: /prototypes/research-workspace/vault/*
# ALB authenticates via Cognito before forwarding to code-server
resource "aws_lb_listener_rule" "vault_authenticated" {
  listener_arn = var.alb_https_listener_arn
  priority     = 90

  action {
    type = "authenticate-cognito"

    authenticate_cognito {
      user_pool_arn       = var.cognito_user_pool_arn
      user_pool_client_id = var.cognito_user_pool_client_id
      user_pool_domain    = var.cognito_domain

      on_unauthenticated_request = "authenticate"
      scope                      = "openid email profile"
      session_timeout            = 43200

      # Skip the Cognito hosted UI — redirect directly to GitHub OAuth
      authentication_request_extra_params = {
        identity_provider = "GitHub"
      }
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  condition {
    path_pattern {
      values = ["/prototypes/research-workspace/vault", "/prototypes/research-workspace/vault/*"]
    }
  }
}

# Allow ALB to reach code-server containers
resource "aws_security_group_rule" "ecs_from_alb" {
  type                     = "ingress"
  from_port                = var.container_port
  to_port                  = var.container_port
  protocol                 = "tcp"
  source_security_group_id = var.alb_security_group_id
  security_group_id        = var.ecs_security_group_id
  description              = "Allow traffic from ALB to Research Workspace ECS tasks"
}

# --- IAM Roles ---

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.name_prefix}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.name_prefix}-secrets-access"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.anthropic_api_key.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.name_prefix}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Grant the task role permission to mount EFS with IAM auth
resource "aws_iam_role_policy" "ecs_task_efs" {
  name = "${var.name_prefix}-efs-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite"
        ]
        Resource = "arn:aws:elasticfilesystem:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:file-system/${var.efs_file_system_id}"
        Condition = {
          StringEquals = {
            "elasticfilesystem:AccessPointArn" = "arn:aws:elasticfilesystem:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:access-point/${var.efs_access_point_id}"
          }
        }
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

# Explicit deny for cost-generating AWS actions.
# Defense in depth: even if the task role gains new permissions via future changes,
# high-cost actions are permanently blocked to prevent accidental or malicious spend.
resource "aws_iam_role_policy" "ecs_task_deny_cost_generating" {
  name = "${var.name_prefix}-deny-cost-generating"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyCostGeneratingActions"
        Effect = "Deny"
        Action = [
          "ec2:RunInstances",
          "ec2:RequestSpotInstances",
          "ec2:RequestSpotFleet",
          "ec2:StartInstances",
          "lambda:CreateFunction",
          "lambda:InvokeFunction",
          "lambda:InvokeAsync",
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "sagemaker:Create*",
          "sagemaker:Start*",
          "ecs:RunTask",
          "ecs:CreateService",
          "ecs:UpdateService",
          "rds:CreateDB*",
          "rds:StartDB*",
          "s3:CreateBucket",
          "glue:*",
          "emr:*",
          "batch:*",
          "comprehend:*",
          "rekognition:*",
          "textract:*",
          "translate:*",
          "polly:*",
          "transcribe:*",
          "kinesis:*",
          "firehose:*",
          "redshift:*",
          "elasticmapreduce:*",
          "es:*",
          "opensearch:*",
          "lightsail:*",
          "gamelift:*",
          "mediaconvert:*",
          "mediapackage:*",
          "medialive:*",
          "eks:Create*",
          "elasticache:Create*",
          "dax:Create*",
          "neptune:Create*",
          "kafka:Create*",
          "kinesisanalytics:Create*",
          "athena:StartQueryExecution"
        ]
        Resource = "*"
      }
    ]
  })
}

# --- Secrets Manager for Anthropic API Key ---

resource "aws_secretsmanager_secret" "anthropic_api_key" {
  name                    = "${var.name_prefix}/anthropic-api-key"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "anthropic_api_key" {
  count         = var.anthropic_api_key != "" ? 1 : 0
  secret_id     = aws_secretsmanager_secret.anthropic_api_key.id
  secret_string = var.anthropic_api_key
}

# --- Sandbox Security Group (restrictive egress) ---
# Replaces the shared ECS SG for research-workspace tasks.
# Only allows HTTPS, DNS, and NFS egress — blocks arbitrary outbound ports
# to prevent reverse shells, C2 channels, and non-standard protocol abuse.

resource "aws_security_group" "sandbox" {
  name        = "${var.name_prefix}-sandbox-sg"
  description = "Restrictive egress for research workspace sandbox"
  vpc_id      = var.vpc_id

  # Ingress: ALB to container on service port
  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
    description     = "Allow traffic from ALB to research workspace"
  }

  # Egress: HTTPS only — covers npm, PyPI, GitHub, Anthropic API, AWS endpoints
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for package registries and APIs"
  }

  # Egress: DNS (TCP)
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS resolution (TCP)"
  }

  # Egress: DNS (UDP)
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS resolution (UDP)"
  }

  # Egress: NFS for EFS vault storage
  egress {
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "NFS for EFS vault storage"
  }

  tags = {
    Name = "${var.name_prefix}-sandbox-sg"
  }
}

# --- ECS Task Definition (with EFS volume) ---

resource "aws_ecs_task_definition" "main" {
  family                   = var.name_prefix
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  # EFS volume for persistent vault storage
  volume {
    name = "vault-storage"

    efs_volume_configuration {
      file_system_id     = var.efs_file_system_id
      transit_encryption = "ENABLED"

      authorization_config {
        access_point_id = var.efs_access_point_id
        iam             = "ENABLED"
      }
    }
  }

  container_definitions = jsonencode([
    {
      name      = var.name_prefix
      image     = "${aws_ecr_repository.main.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      mountPoints = [
        {
          sourceVolume  = "vault-storage"
          containerPath = "/workspace"
          readOnly      = false
        }
      ]

      environment = [
        {
          name  = "VAULT_ROOT"
          value = "/workspace"
        },
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "MAX_VAULT_SIZE_MB"
          value = "1024"
        }
      ]

      # Restrict file descriptors to prevent resource exhaustion attacks
      ulimits = [
        {
          name      = "nofile"
          softLimit = 65536
          hardLimit = 65536
        }
      ]

      secrets = var.anthropic_api_key != "" ? [
        {
          name      = "ANTHROPIC_API_KEY"
          valueFrom = aws_secretsmanager_secret.anthropic_api_key.arn
        }
      ] : []

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.main.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -sf http://localhost:${var.container_port}/healthz || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 120
      }
    }
  ])

  tags = {
    Name = "${var.name_prefix}-task"
  }
}

data "aws_region" "current" {}

# --- Cloud Map Service Discovery ---

resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.name_prefix}.local"
  description = "Service discovery namespace for ${var.name_prefix}"
  vpc         = var.vpc_id
}

resource "aws_service_discovery_service" "main" {
  name = var.name_prefix

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# --- ECS Service ---

resource "aws_ecs_service" "main" {
  name            = var.name_prefix
  cluster         = var.ecs_cluster_arn
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 2
    base              = 0
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.sandbox.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = var.name_prefix
    container_port   = var.container_port
  }

  service_registries {
    registry_arn = aws_service_discovery_service.main.arn
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = {
    Name = "${var.name_prefix}-service"
  }
}

# --- CloudWatch Monitoring & Alarms ---

resource "aws_sns_topic" "sandbox_alerts" {
  name = "${var.name_prefix}-sandbox-alerts"

  tags = {
    Name = "${var.name_prefix}-sandbox-alerts"
  }
}

resource "aws_sns_topic_subscription" "sandbox_alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.sandbox_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# EFS total storage alarm — detect runaway storage growth
resource "aws_cloudwatch_metric_alarm" "efs_storage_size" {
  alarm_name          = "${var.name_prefix}-efs-storage-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "StorageBytes"
  namespace           = "AWS/EFS"
  period              = 86400
  statistic           = "Maximum"
  threshold           = var.max_vault_size_bytes
  alarm_description   = "EFS storage for research workspace exceeds threshold"
  alarm_actions       = [aws_sns_topic.sandbox_alerts.arn]

  dimensions = {
    FileSystemId = var.efs_file_system_id
    StorageClass = "Total"
  }

  tags = {
    Name = "${var.name_prefix}-efs-storage-alarm"
  }
}

# EFS write throughput spike — detect storage abuse (>100MB in 5 min)
resource "aws_cloudwatch_metric_alarm" "efs_write_throughput" {
  alarm_name          = "${var.name_prefix}-efs-write-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DataWriteIOBytes"
  namespace           = "AWS/EFS"
  period              = 300
  statistic           = "Sum"
  threshold           = 104857600
  alarm_description   = "EFS write throughput spike (>100MB/5min) — possible storage abuse"
  alarm_actions       = [aws_sns_topic.sandbox_alerts.arn]

  dimensions = {
    FileSystemId = var.efs_file_system_id
  }

  tags = {
    Name = "${var.name_prefix}-efs-write-alarm"
  }
}

# ECS CPU utilization — detect compute abuse (crypto mining, runaway processes)
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.name_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Research workspace CPU >90% for 15 minutes"
  alarm_actions       = [aws_sns_topic.sandbox_alerts.arn]

  dimensions = {
    ClusterName = local.cluster_name
    ServiceName = aws_ecs_service.main.name
  }

  tags = {
    Name = "${var.name_prefix}-cpu-alarm"
  }
}

# ECS memory utilization — detect memory exhaustion
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.name_prefix}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Research workspace memory >90% for 15 minutes"
  alarm_actions       = [aws_sns_topic.sandbox_alerts.arn]

  dimensions = {
    ClusterName = local.cluster_name
    ServiceName = aws_ecs_service.main.name
  }

  tags = {
    Name = "${var.name_prefix}-memory-alarm"
  }
}
