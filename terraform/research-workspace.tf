# Research Workspace Platform
# Cognito (GitHub OAuth), DynamoDB, EFS, IAM for the research workspace

# --- Variables ---

variable "github_oauth_client_id" {
  description = "GitHub OAuth App client ID for Cognito"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_oauth_client_secret" {
  description = "GitHub OAuth App client secret for Cognito"
  type        = string
  sensitive   = true
  default     = ""
}

# --- Cognito User Pool ---

resource "aws_cognito_user_pool" "research_workspace" {
  name = "research-workspace"

  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = {
    Name        = "research-workspace-users"
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_domain" "research_workspace" {
  domain       = "cookinupideas"
  user_pool_id = aws_cognito_user_pool.research_workspace.id
}

# --- GitHub OIDC Proxy Lambda ---
# GitHub OAuth is not OIDC-compliant (no `openid` scope, no discovery endpoint, no JWTs).
# This Lambda wraps GitHub OAuth in OIDC-standard endpoints so Cognito can use it.

resource "aws_iam_role" "github_oidc_proxy" {
  name = "github-oidc-proxy-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "github_oidc_proxy_logs" {
  role       = aws_iam_role.github_oidc_proxy.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "github_oidc_proxy" {
  name              = "/aws/lambda/github-oidc-proxy"
  retention_in_days = 30
}

data "archive_file" "github_oidc_proxy" {
  type        = "zip"
  source_dir  = "${path.module}/../infrastructure/github-oidc-proxy"
  output_path = "${path.module}/github-oidc-proxy.zip"
}

resource "aws_lambda_function" "github_oidc_proxy" {
  filename         = data.archive_file.github_oidc_proxy.output_path
  source_code_hash = data.archive_file.github_oidc_proxy.output_base64sha256
  function_name    = "github-oidc-proxy"
  role             = aws_iam_role.github_oidc_proxy.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 15
  memory_size      = 128

  environment {
    variables = {
      GITHUB_CLIENT_ID     = var.github_oauth_client_id
      GITHUB_CLIENT_SECRET = var.github_oauth_client_secret
      OIDC_PRIVATE_KEY     = file("${path.module}/../infrastructure/github-oidc-proxy/private.pem")
      OIDC_PUBLIC_KEY      = file("${path.module}/../infrastructure/github-oidc-proxy/public.pem")
      # ISSUER_URL derived at runtime from event.requestContext.domainName
      # This avoids a circular dependency (Lambda -> Function URL -> Lambda env var)
      ISSUER_URL           = "placeholder"
    }
  }

  depends_on = [aws_cloudwatch_log_group.github_oidc_proxy]
}

resource "aws_lambda_function_url" "github_oidc_proxy" {
  function_name      = aws_lambda_function.github_oidc_proxy.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST"]
    allow_headers = ["*"]
  }
}

# GitHub as OIDC Identity Provider via the proxy
resource "aws_cognito_identity_provider" "github" {
  count         = var.github_oauth_client_id != "" ? 1 : 0
  user_pool_id  = aws_cognito_user_pool.research_workspace.id
  provider_name = "GitHub"
  provider_type = "OIDC"

  provider_details = {
    client_id                     = var.github_oauth_client_id
    client_secret                 = var.github_oauth_client_secret
    authorize_scopes              = "openid email profile"
    oidc_issuer                   = trimsuffix(aws_lambda_function_url.github_oidc_proxy.function_url, "/")
    attributes_url_add_attributes = "false"
    attributes_request_method     = "GET"
  }

  attribute_mapping = {
    email              = "email"
    username           = "sub"
    name               = "name"
    preferred_username = "preferred_username"
    picture            = "picture"
  }

  lifecycle {
    ignore_changes = [provider_details["authorize_scopes"]]
  }
}

# Cognito User Pool Client for ALB integration
resource "aws_cognito_user_pool_client" "research_workspace" {
  name         = "research-workspace-alb"
  user_pool_id = aws_cognito_user_pool.research_workspace.id

  generate_secret                      = true
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  callback_urls = [
    "https://portfolio.cookinupideas.com/oauth2/idpresponse",
    "https://${module.ai_evals.alb_dns_name}/oauth2/idpresponse"
  ]

  logout_urls = [
    "https://portfolio.cookinupideas.com/prototypes/research-workspace/"
  ]

  supported_identity_providers = var.github_oauth_client_id != "" ? ["GitHub", "COGNITO"] : ["COGNITO"]

  depends_on = [aws_cognito_identity_provider.github]
}

# --- DynamoDB Table ---

resource "aws_dynamodb_table" "research_workspace" {
  name         = "research-workspace"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "contentType"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  # GSI for gallery queries: "Show all syntheses, newest first"
  global_secondary_index {
    name            = "by-type"
    hash_key        = "contentType"
    range_key       = "date"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "research-workspace"
    Environment = var.environment
  }
}

# --- EFS File System ---

resource "aws_efs_file_system" "research_workspace" {
  creation_token = "research-workspace-vaults"
  encrypted      = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = {
    Name        = "research-workspace-vaults"
    Environment = var.environment
  }
}

# Mount targets in each public subnet (same subnets as ECS tasks)
resource "aws_efs_mount_target" "research_workspace" {
  count           = length(module.ai_evals.public_subnet_ids)
  file_system_id  = aws_efs_file_system.research_workspace.id
  subnet_id       = module.ai_evals.public_subnet_ids[count.index]
  security_groups = [aws_security_group.efs_research_workspace.id]
}

# Security group for EFS — allow NFS from ECS tasks
resource "aws_security_group" "efs_research_workspace" {
  name        = "research-workspace-efs"
  description = "Allow NFS access from ECS tasks to research workspace EFS"
  vpc_id      = module.ai_evals.vpc_id

  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [module.ai_evals.ecs_security_group_id]
    description     = "NFS from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "research-workspace-efs-sg"
  }
}

# Allow NFS from the research workspace sandbox SG (replaces shared ECS SG for these tasks)
resource "aws_security_group_rule" "efs_from_sandbox" {
  type                     = "ingress"
  from_port                = 2049
  to_port                  = 2049
  protocol                 = "tcp"
  source_security_group_id = module.research_workspace.sandbox_security_group_id
  security_group_id        = aws_security_group.efs_research_workspace.id
  description              = "NFS from research workspace sandbox tasks"
}

# Initial EFS access point for Nathan (per-user isolation)
resource "aws_efs_access_point" "nathan" {
  file_system_id = aws_efs_file_system.research_workspace.id

  posix_user {
    uid = 1000
    gid = 1000
  }

  root_directory {
    path = "/users/nathan"
    creation_info {
      owner_uid   = 1000
      owner_gid   = 1000
      permissions = "755"
    }
  }

  tags = {
    Name = "research-workspace-nathan"
    User = "nathan"
  }
}

# --- IAM: Two-Tier Credential Chain ---

# Tier 2: Append-only role (assumed by cloud task)
resource "aws_iam_role" "research_workspace_append_only" {
  name = "research-workspace-append-only"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_user.research_workspace_deploy.arn
        }
        Action = "sts:AssumeRole"
        Condition = {
          NumericLessThanEquals = {
            "aws:MaxSessionDuration" = "3600"
          }
        }
      }
    ]
  })

  max_session_duration = 3600

  tags = {
    Name = "research-workspace-append-only"
  }
}

resource "aws_iam_role_policy" "research_workspace_append_only" {
  name = "research-workspace-append-only"
  role = aws_iam_role.research_workspace_append_only.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3AppendContent"
        Effect = "Allow"
        Action = ["s3:PutObject"]
        Resource = "arn:aws:s3:::${var.bucket_name}/prototypes/research-workspace/*"
      },
      {
        Sid    = "S3ReadContent"
        Effect = "Allow"
        Action = ["s3:GetObject"]
        Resource = [
          "arn:aws:s3:::${var.bucket_name}/prototypes/research-workspace/*",
          "arn:aws:s3:::portfolio-cooking-up-ideas/inference-insights/*"
        ]
      },
      {
        Sid    = "S3ListContentPrefix"
        Effect = "Allow"
        Action = ["s3:ListBucket"]
        Resource = "arn:aws:s3:::${var.bucket_name}"
        Condition = {
          StringLike = {
            "s3:prefix" = "prototypes/research-workspace/*"
          }
        }
      },
      {
        Sid    = "DynamoDBAppend"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.research_workspace.arn,
          "${aws_dynamodb_table.research_workspace.arn}/index/*"
        ]
      },
      {
        Sid    = "CloudFrontInvalidate"
        Effect = "Allow"
        Action = ["cloudfront:CreateInvalidation"]
        Resource = aws_cloudfront_distribution.website.arn
      }
    ]
  })
}

# Tier 1: IAM user that can only assume the append-only role
resource "aws_iam_user" "research_workspace_deploy" {
  name = "research-workspace-deploy"

  tags = {
    Name = "research-workspace-deploy"
  }
}

resource "aws_iam_user_policy" "research_workspace_assume_only" {
  name = "research-workspace-assume-only"
  user = aws_iam_user.research_workspace_deploy.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "sts:AssumeRole"
        Resource = aws_iam_role.research_workspace_append_only.arn
      }
    ]
  })
}

resource "aws_iam_access_key" "research_workspace_deploy" {
  user = aws_iam_user.research_workspace_deploy.name
}

# Store deploy credentials in Secrets Manager
resource "aws_secretsmanager_secret" "research_workspace_deploy_creds" {
  name                    = "research-workspace/deploy-credentials"
  recovery_window_in_days = 0

  tags = {
    Name = "research-workspace-deploy-creds"
  }
}

resource "aws_secretsmanager_secret_version" "research_workspace_deploy_creds" {
  secret_id = aws_secretsmanager_secret.research_workspace_deploy_creds.id
  secret_string = jsonencode({
    access_key_id     = aws_iam_access_key.research_workspace_deploy.id
    secret_access_key = aws_iam_access_key.research_workspace_deploy.secret
    role_arn          = aws_iam_role.research_workspace_append_only.arn
  })
}

# --- AWS Budget (cost backstop) ---

# Requires budgets:ModifyBudget on the deploy role — set enable_budget=true once permission is added
resource "aws_budgets_budget" "research_workspace" {
  count        = var.enable_budget ? 1 : 0
  name         = "research-workspace-monthly"
  budget_type  = "COST"
  limit_amount = "100"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Name$research-workspace-vaults", "user:Name$research-workspace-prod-service"]
  }

  dynamic "notification" {
    for_each = var.sandbox_alert_email != "" ? [1] : []
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = 80
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = [var.sandbox_alert_email]
    }
  }

  dynamic "notification" {
    for_each = var.sandbox_alert_email != "" ? [1] : []
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = 100
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = [var.sandbox_alert_email]
    }
  }

  dynamic "notification" {
    for_each = var.sandbox_alert_email != "" ? [1] : []
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = 50
      threshold_type             = "PERCENTAGE"
      notification_type          = "FORECASTED"
      subscriber_email_addresses = [var.sandbox_alert_email]
    }
  }
}

# --- S3 Versioning ---

resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id

  versioning_configuration {
    status = "Enabled"
  }
}

# --- Outputs ---

output "cognito_user_pool_id" {
  description = "Cognito user pool ID"
  value       = aws_cognito_user_pool.research_workspace.id
}

output "cognito_user_pool_arn" {
  description = "Cognito user pool ARN"
  value       = aws_cognito_user_pool.research_workspace.arn
}

output "cognito_domain" {
  description = "Cognito hosted UI domain"
  value       = "https://${aws_cognito_user_pool_domain.research_workspace.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "cognito_callback_url" {
  description = "Cognito OAuth callback URL — use this when registering the GitHub OAuth App"
  value       = "https://${aws_cognito_user_pool_domain.research_workspace.domain}.auth.${var.aws_region}.amazoncognito.com/oauth2/idpresponse"
}

output "cognito_client_id" {
  description = "Cognito user pool client ID"
  value       = aws_cognito_user_pool_client.research_workspace.id
}

output "research_workspace_dynamodb_table" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.research_workspace.name
}

output "research_workspace_efs_id" {
  description = "EFS file system ID"
  value       = aws_efs_file_system.research_workspace.id
}

output "research_workspace_deploy_role_arn" {
  description = "IAM role ARN for append-only access (cloud task)"
  value       = aws_iam_role.research_workspace_append_only.arn
}

output "github_oidc_proxy_url" {
  description = "GitHub OIDC proxy Lambda Function URL"
  value       = aws_lambda_function_url.github_oidc_proxy.function_url
}
