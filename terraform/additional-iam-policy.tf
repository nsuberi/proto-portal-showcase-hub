# Additional IAM permissions needed for the terraform-cooking-up-ideas role
# This creates an inline policy with the required permissions

data "aws_caller_identity" "current" {}

# Get the existing IAM role
data "aws_iam_role" "terraform_role" {
  name = "terraform-cooking-up-ideas"
}

# Additional IAM policy for Lambda Function URLs and API Gateway
resource "aws_iam_role_policy" "comprehensive_permissions" {
  name = "comprehensive-terraform-permissions"
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
      },
      {
        Sid = "APIGatewayPermissions"
        Effect = "Allow"
        Action = [
          "apigateway:POST",
          "apigateway:GET",
          "apigateway:PUT",
          "apigateway:PATCH",
          "apigateway:DELETE",
          "apigateway:CreateRestApi",
          "apigateway:CreateResource",
          "apigateway:CreateMethod",
          "apigateway:CreateDeployment",
          "apigateway:CreateStage",
          "apigateway:UpdateRestApi",
          "apigateway:UpdateResource",
          "apigateway:UpdateMethod",
          "apigateway:UpdateDeployment",
          "apigateway:UpdateStage",
          "apigateway:DeleteRestApi",
          "apigateway:DeleteResource",
          "apigateway:DeleteMethod",
          "apigateway:DeleteDeployment",
          "apigateway:DeleteStage",
          "apigateway:PutIntegration",
          "apigateway:PutIntegrationResponse",
          "apigateway:PutMethodResponse",
          "apigateway:PutGatewayResponse",
          "apigateway:TagResource",
          "apigateway:UntagResource",
          "apigateway:GetRestApi",
          "apigateway:GetRestApis",
          "apigateway:GetResource",
          "apigateway:GetResources",
          "apigateway:GetMethod",
          "apigateway:GetIntegration",
          "apigateway:GetIntegrationResponse",
          "apigateway:GetMethodResponse",
          "apigateway:GetDeployment",
          "apigateway:GetDeployments",
          "apigateway:GetStage",
          "apigateway:GetStages"
        ]
        Resource = "*"
      },
      {
        Sid = "LambdaInvokePermissions"
        Effect = "Allow"
        Action = [
          "lambda:AddPermission",
          "lambda:RemovePermission",
          "lambda:GetPolicy"
        ]
        Resource = "arn:aws:lambda:*:${data.aws_caller_identity.current.account_id}:function:*"
      },
      {
        Sid = "SSMParameterStorePermissions"
        Effect = "Allow"
        Action = [
          "ssm:PutParameter",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "ssm:DeleteParameter",
          "ssm:DescribeParameters",
          "ssm:AddTagsToResource",
          "ssm:RemoveTagsFromResource"
        ]
        Resource = [
          "arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/*/ai-api/*",
          "arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/production/ai-api/*",
          "arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/development/ai-api/*"
        ]
      }
    ]
  })
}