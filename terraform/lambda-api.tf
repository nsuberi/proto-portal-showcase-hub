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
    ]
  })
}

# Build the Lambda deployment package
data "archive_file" "ai_api_lambda_zip" {
  type        = "zip"
  output_path = "ai-api-lambda.zip"
  source_dir  = "../api"
  
  excludes = [
    ".env",
    ".env.example", 
    "README.md",
    "*.test.js",
    "node_modules/.cache",
    "node_modules/nodemon"
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
      JWT_SECRET         = var.jwt_secret
      API_KEY_SALT       = var.api_key_salt
      CLAUDE_API_KEY     = var.claude_api_key
      CLAUDE_API_URL     = var.claude_api_url
      CLAUDE_MODEL       = var.claude_model
      LOG_LEVEL         = var.environment == "production" ? "info" : "debug"
      CORS_ORIGIN       = "https://portfolio.cookinupideas.com"
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

# API Gateway REST API
resource "aws_api_gateway_rest_api" "ai_api_gateway" {
  name        = "${var.bucket_name}-ai-api"
  description = "AI Analysis API Gateway"

  endpoint_configuration {
    types = ["EDGE"]
  }

  tags = {
    Environment = var.environment
    Project     = "proto-portal"
  }
}

# API Gateway Resource for /api path
resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  parent_id   = aws_api_gateway_rest_api.ai_api_gateway.root_resource_id
  path_part   = "api"
}

# API Gateway Resource for /api/v1 path
resource "aws_api_gateway_resource" "v1" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "v1"
}

# API Gateway Resource for /api/v1/{proxy+} path (catch all)
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "{proxy+}"
}

# API Gateway Method for ANY /api/v1/{proxy+}
resource "aws_api_gateway_method" "proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.proxy" = true
  }
}

# API Gateway Integration with Lambda
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_method.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.ai_api.invoke_arn
}

# API Gateway Method for OPTIONS (CORS preflight)
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# API Gateway Integration for OPTIONS
resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.options_method.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# API Gateway Method Response for OPTIONS
resource "aws_api_gateway_method_response" "options_response" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# API Gateway Integration Response for OPTIONS
resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'https://portfolio.cookinupideas.com'"
  }

  depends_on = [aws_api_gateway_integration.options_integration]
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.ai_api_gateway.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "ai_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.ai_api_gateway.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.api.id,
      aws_api_gateway_resource.v1.id,
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy_method.id,
      aws_api_gateway_integration.lambda_integration.id,
      aws_api_gateway_method.options_method.id,
      aws_api_gateway_integration.options_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_method.proxy_method,
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_method.options_method,
    aws_api_gateway_integration.options_integration,
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "ai_api_stage" {
  deployment_id = aws_api_gateway_deployment.ai_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.ai_api_gateway.id
  stage_name    = "prod"

  tags = {
    Environment = var.environment
    Project     = "proto-portal"
  }
}

# Lambda Function URL (requires lambda:CreateFunctionUrlConfig permission)
resource "aws_lambda_function_url" "ai_api" {
  function_name      = aws_lambda_function.ai_api.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = ["https://portfolio.cookinupideas.com"]
    allow_methods     = ["*"]
    allow_headers     = ["date", "keep-alive", "x-forwarded-for", "x-forwarded-proto", "x-forwarded-port", "x-amzn-trace-id", "content-type", "x-api-key", "authorization"]
    max_age          = 86400
  }
}

# Note: API Gateway, Lambda Function URLs, and SSM Parameters commented out due to IAM permission requirements
# For production deployment, add the permissions from iam-permissions-needed.json to the terraform-cooking-up-ideas role
# 
# Current deployment creates only the Lambda function with environment variables
# To access the API, you would need to:
# 1. Add the IAM permissions and uncomment the Function URL resource
# 2. Or manually create a Function URL in the AWS Console
# 3. Or set up API Gateway with proper permissions