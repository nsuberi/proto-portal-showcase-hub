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

# API Gateway for Lambda (commented out - requires additional IAM permissions)
# resource "aws_api_gateway_rest_api" "ai_api_gateway" {
#   name = "${var.bucket_name}-ai-api"
#   description = "AI Analysis API Gateway"
#
#   endpoint_configuration {
#     types = ["EDGE"]
#   }
# }

# Lambda Function URL (requires lambda:CreateFunctionUrlConfig permission)
resource "aws_lambda_function_url" "ai_api" {
  function_name      = aws_lambda_function.ai_api.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = ["https://${aws_cloudfront_distribution.website.domain_name}"]
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