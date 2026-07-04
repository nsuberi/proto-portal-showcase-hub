# Scale-to-zero control plane
#
# Idle cost → $0. The ECS service runs at desired_count=0 by default; a tiny
# Lambda wakes it on demand (browser splash screen), polls readiness, and reaps
# it back to zero when the per-activity DynamoDB heartbeat goes stale. A nightly
# EventBridge cron is a hard backstop in case the reaper ever fails.
#
# The /_control/* route is intentionally UNauthenticated: the blast radius of an
# anonymous wake is one tiny Spot task that the reaper kills after `idle_minutes`
# — no agent runs are possible without the Cognito JWT + per-user quota, and the
# $100 AWS budget is the hard ceiling.

locals {
  service_arn = "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/${local.cluster_name}/${aws_ecs_service.main.name}"
}

# --- Lambda packaging ---

data "archive_file" "scaler" {
  type        = "zip"
  source_dir  = "${path.module}/scaler-lambda"
  output_path = "${path.module}/scaler-lambda.zip"
}

resource "aws_cloudwatch_log_group" "scaler" {
  name              = "/aws/lambda/${var.name_prefix}-scaler"
  retention_in_days = 30

  tags = {
    Name = "${var.name_prefix}-scaler-logs"
  }
}

# --- IAM ---

resource "aws_iam_role" "scaler" {
  name = "${var.name_prefix}-scaler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "scaler_logs" {
  role       = aws_iam_role.scaler.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "scaler" {
  name = "${var.name_prefix}-scaler"
  role = aws_iam_role.scaler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DescribeService"
        Effect   = "Allow"
        Action   = ["ecs:DescribeServices"]
        Resource = "*"
      },
      {
        Sid      = "ScaleService"
        Effect   = "Allow"
        Action   = ["ecs:UpdateService"]
        Resource = local.service_arn
      },
      {
        Sid      = "ReadTargetHealth"
        Effect   = "Allow"
        Action   = ["elasticloadbalancing:DescribeTargetHealth"]
        Resource = "*"
      },
      {
        Sid      = "Heartbeat"
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:UpdateItem"]
        Resource = var.quota_table_arn
      }
    ]
  })
}

# --- Lambda ---

resource "aws_lambda_function" "scaler" {
  filename         = data.archive_file.scaler.output_path
  source_code_hash = data.archive_file.scaler.output_base64sha256
  function_name    = "${var.name_prefix}-scaler"
  role             = aws_iam_role.scaler.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  timeout          = 15
  memory_size      = 128

  environment {
    variables = {
      CLUSTER          = local.cluster_name
      SERVICE          = aws_ecs_service.main.name
      TARGET_GROUP_ARN = aws_lb_target_group.main.arn
      TABLE            = var.quota_table_name
      IDLE_MINUTES     = tostring(var.idle_minutes)
    }
  }

  depends_on = [aws_cloudwatch_log_group.scaler]

  tags = {
    Name = "${var.name_prefix}-scaler"
  }
}

# --- ALB → Lambda (the /_control/* control plane, no Cognito) ---

resource "aws_lb_target_group" "scaler" {
  name        = "${var.name_prefix}-scaler"
  target_type = "lambda"

  tags = {
    Name = "${var.name_prefix}-scaler-tg"
  }
}

resource "aws_lambda_permission" "alb" {
  statement_id  = "AllowALBInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scaler.function_name
  principal     = "elasticloadbalancing.amazonaws.com"
  source_arn    = aws_lb_target_group.scaler.arn
}

resource "aws_lb_target_group_attachment" "scaler" {
  target_group_arn = aws_lb_target_group.scaler.arn
  target_id        = aws_lambda_function.scaler.arn
  depends_on       = [aws_lambda_permission.alb]
}

# Priority 88 — evaluated before the authenticated (90) and published (89) rules
# so wake/status polling is never bounced through the Cognito OAuth redirect.
resource "aws_lb_listener_rule" "vault_control" {
  listener_arn = var.alb_https_listener_arn
  priority     = 88

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.scaler.arn
  }

  condition {
    path_pattern {
      values = ["/prototypes/research-workspace/vault/_control/*"]
    }
  }
}

# --- EventBridge: idle reaper + nightly backstop ---

resource "aws_cloudwatch_event_rule" "reap" {
  name                = "${var.name_prefix}-reap"
  description         = "Scale research workspace to 0 when the activity heartbeat goes stale"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "reap" {
  rule      = aws_cloudwatch_event_rule.reap.name
  target_id = "scaler"
  arn       = aws_lambda_function.scaler.arn
  input     = jsonencode({ action = "reap" })
}

resource "aws_lambda_permission" "reap" {
  statement_id  = "AllowReapInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scaler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.reap.arn
}

resource "aws_cloudwatch_event_rule" "scheduled_stop" {
  name                = "${var.name_prefix}-scheduled-stop"
  description         = "Nightly hard scale-to-zero backstop for research workspace"
  schedule_expression = var.scheduled_stop_cron
}

resource "aws_cloudwatch_event_target" "scheduled_stop" {
  rule      = aws_cloudwatch_event_rule.scheduled_stop.name
  target_id = "scaler"
  arn       = aws_lambda_function.scaler.arn
  input     = jsonencode({ action = "scheduled-stop" })
}

resource "aws_lambda_permission" "scheduled_stop" {
  statement_id  = "AllowScheduledStopInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scaler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.scheduled_stop.arn
}
