# AI Analysis API Lambda Infrastructure

# IAM role for Lambda execution
resource "aws_iam_role" "ai_api_lambda_role" {
  name = "${var.bucket_name}-ai-api-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Lambda execution
resource "aws_iam_role_policy" "ai_api_lambda_policy" {
  name = "${var.bucket_name}-ai-api-lambda-policy"
  role = aws_iam_role.ai_api_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:*:parameter/${var.environment}/ai-api/*"
        ]
      }
    ]
  })
}

# Build the Lambda deployment package
data "archive_file" "ai_api_lambda_zip" {
  type        = "zip"
  output_path = "ai-api-lambda.zip"
  source_dir  = "../api"
  
  excludes = [
    "node_modules",
    ".env",
    ".env.example",
    "README.md",
    "*.test.js"
  ]
}

# Lambda function
resource "aws_lambda_function" "ai_api" {
  filename         = data.archive_file.ai_api_lambda_zip.output_path
  function_name    = "${var.bucket_name}-ai-api"
  role            = aws_iam_role.ai_api_lambda_role.arn
  handler         = "lambda.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  source_code_hash = data.archive_file.ai_api_lambda_zip.output_base64sha256

  # Note: For production, consider using Lambda layers for node_modules

  environment {
    variables = {
      NODE_ENV           = var.environment
      CLAUDE_API_KEY     = var.claude_api_key
      JWT_SECRET         = var.jwt_secret
      API_KEY_SALT       = var.api_key_salt
      LOG_LEVEL         = var.environment == "production" ? "info" : "debug"
      CORS_ORIGIN       = "https://${aws_cloudfront_distribution.website.domain_name}"
    }
  }

  depends_on = [
    aws_iam_role_policy.ai_api_lambda_policy,
    aws_cloudwatch_log_group.ai_api_lambda_logs,
  ]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ai_api_lambda_logs" {
  name              = "/aws/lambda/${var.bucket_name}-ai-api"
  retention_in_days = 14
}

# API Gateway for Lambda
resource "aws_api_gateway_rest_api" "ai_api_gateway" {
  name = "${var.bucket_name}-ai-api"
  description = "AI Analysis API Gateway"

  endpoint_configuration {
    types = ["EDGE"]
  }
}

# API Gateway Resource (catch all)
resource "aws_api_gateway_resource" "ai_api_proxy" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  parent_id   = aws_api_gateway_rest_api.ai_api_gateway.root_resource_id
  path_part   = "{proxy+}"
}

# API Gateway Method
resource "aws_api_gateway_method" "ai_api_proxy" {
  rest_api_id   = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id   = aws_api_gateway_resource.ai_api_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

# API Gateway Integration
resource "aws_api_gateway_integration" "ai_api_lambda" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id = aws_api_gateway_method.ai_api_proxy.resource_id
  http_method = aws_api_gateway_method.ai_api_proxy.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.ai_api.invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "ai_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_api.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.ai_api_gateway.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "ai_api" {
  depends_on = [
    aws_api_gateway_method.ai_api_proxy,
    aws_api_gateway_integration.ai_api_lambda,
  ]

  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }

  # Force redeployment on changes
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.ai_api_proxy.id,
      aws_api_gateway_method.ai_api_proxy.id,
      aws_api_gateway_integration.ai_api_lambda.id,
    ]))
  }
}

# CORS for API Gateway (OPTIONS method)
resource "aws_api_gateway_method" "ai_api_options" {
  rest_api_id   = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id   = aws_api_gateway_resource.ai_api_proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "ai_api_options" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id = aws_api_gateway_resource.ai_api_proxy.id
  http_method = aws_api_gateway_method.ai_api_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "ai_api_options" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id = aws_api_gateway_resource.ai_api_proxy.id
  http_method = aws_api_gateway_method.ai_api_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_integration_response" "ai_api_options" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id = aws_api_gateway_resource.ai_api_proxy.id
  http_method = aws_api_gateway_method.ai_api_options.http_method
  status_code = aws_api_gateway_method_response.ai_api_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# SSM Parameters for secure configuration
resource "aws_ssm_parameter" "claude_api_key" {
  name  = "/${var.environment}/ai-api/claude-api-key"
  type  = "SecureString"
  value = var.claude_api_key

  description = "Claude API key for AI analysis service"

  tags = {
    Environment = var.environment
    Service     = "ai-analysis-api"
  }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.environment}/ai-api/jwt-secret"
  type  = "SecureString"
  value = var.jwt_secret

  description = "JWT secret for API authentication"

  tags = {
    Environment = var.environment
    Service     = "ai-analysis-api"
  }
}

resource "aws_ssm_parameter" "api_key_salt" {
  name  = "/${var.environment}/ai-api/api-key-salt"
  type  = "SecureString"
  value = var.api_key_salt

  description = "Salt for API key generation"

  tags = {
    Environment = var.environment
    Service     = "ai-analysis-api"
  }
}