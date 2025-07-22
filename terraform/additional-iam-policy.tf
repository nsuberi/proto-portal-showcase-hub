# Additional IAM permissions needed for the terraform-cooking-up-ideas role
# This creates an inline policy with the required permissions

data "aws_caller_identity" "current" {}

# Get the existing IAM role
data "aws_iam_role" "terraform_role" {
  name = "terraform-cooking-up-ideas"
}

# Additional IAM policy for Lambda Function URLs
resource "aws_iam_role_policy" "lambda_function_url_permissions" {
  name = "lambda-function-url-permissions"
  role = data.aws_iam_role.terraform_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "LambdaFunctionURLPermissions"
        Effect = "Allow"
        Action = [
          "lambda:CreateFunctionUrlConfig",
          "lambda:DeleteFunctionUrlConfig", 
          "lambda:GetFunctionUrlConfig",
          "lambda:UpdateFunctionUrlConfig"
        ]
        Resource = "arn:aws:lambda:*:${data.aws_caller_identity.current.account_id}:function:*"
      }
    ]
  })
}