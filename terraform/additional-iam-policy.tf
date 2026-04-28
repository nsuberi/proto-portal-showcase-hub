# Terraform CI/CD IAM role — manages its own trust policy and permissions
# This role is used by GitHub Actions (via OIDC) and local CLI (via IAM user).

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "terraform_role" {
  name = "terraform-cooking-up-ideas"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLocalUserAssume"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/nsuberi"
        }
        Action = ["sts:AssumeRole", "sts:TagSession"]
      },
      {
        Sid    = "AllowECSTasksAssume"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
      {
        Sid    = "AllowEC2Assume"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
      {
        Sid    = "AllowGitHubOIDCProductionOnly"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:nsuberi/proto-portal-showcase-hub:environment:production"
          }
        }
      }
    ]
  })
}

# Inline policy with all required permissions
resource "aws_iam_role_policy" "comprehensive_permissions" {
  name = "comprehensive-terraform-permissions"
  role = aws_iam_role.terraform_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "LambdaPermissions"
        Effect = "Allow"
        Action = [
          "lambda:CreateFunction",
          "lambda:DeleteFunction",
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:ListVersionsByFunction",
          "lambda:PublishVersion",
          "lambda:CreateFunctionUrlConfig",
          "lambda:DeleteFunctionUrlConfig",
          "lambda:GetFunctionUrlConfig",
          "lambda:UpdateFunctionUrlConfig",
          "lambda:TagResource",
          "lambda:UntagResource",
          "lambda:ListTags"
        ]
        Resource = "arn:aws:lambda:*:${data.aws_caller_identity.current.account_id}:function:*"
      },
      {
        Sid    = "APIGatewayPermissions"
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
        Sid    = "LambdaInvokePermissions"
        Effect = "Allow"
        Action = [
          "lambda:AddPermission",
          "lambda:RemovePermission",
          "lambda:GetPolicy"
        ]
        Resource = "arn:aws:lambda:*:${data.aws_caller_identity.current.account_id}:function:*"
      },
      {
        Sid    = "SSMParameterStorePermissions"
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
      },
      {
        Sid    = "RDSPermissions"
        Effect = "Allow"
        Action = [
          "rds:DescribeDBSubnetGroups",
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters",
          "rds:ListTagsForResource",
          "rds:CreateDBSubnetGroup",
          "rds:DeleteDBSubnetGroup",
          "rds:ModifyDBSubnetGroup",
          "rds:CreateDBInstance",
          "rds:DeleteDBInstance",
          "rds:ModifyDBInstance",
          "rds:AddTagsToResource",
          "rds:RemoveTagsFromResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "ServiceDiscoveryPermissions"
        Effect = "Allow"
        Action = [
          "servicediscovery:CreatePrivateDnsNamespace",
          "servicediscovery:DeleteNamespace",
          "servicediscovery:GetNamespace",
          "servicediscovery:ListNamespaces",
          "servicediscovery:CreateService",
          "servicediscovery:DeleteService",
          "servicediscovery:GetService",
          "servicediscovery:ListServices",
          "servicediscovery:ListTagsForResource",
          "servicediscovery:TagResource",
          "servicediscovery:UntagResource",
          "servicediscovery:GetOperation",
          "servicediscovery:UpdateService"
        ]
        Resource = "*"
      },
      {
        Sid    = "ECSPermissions"
        Effect = "Allow"
        Action = [
          "ecs:CreateCluster",
          "ecs:DeleteCluster",
          "ecs:DescribeClusters",
          "ecs:CreateService",
          "ecs:DeleteService",
          "ecs:DescribeServices",
          "ecs:UpdateService",
          "ecs:RegisterTaskDefinition",
          "ecs:DeregisterTaskDefinition",
          "ecs:DescribeTaskDefinition",
          "ecs:ListTaskDefinitions",
          "ecs:ListTasks",
          "ecs:DescribeTasks",
          "ecs:PutClusterCapacityProviders",
          "ecs:TagResource",
          "ecs:UntagResource",
          "ecs:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "ECRPermissions"
        Effect = "Allow"
        Action = [
          "ecr:CreateRepository",
          "ecr:DeleteRepository",
          "ecr:DescribeRepositories",
          "ecr:GetRepositoryPolicy",
          "ecr:SetRepositoryPolicy",
          "ecr:DeleteRepositoryPolicy",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:GetLifecyclePolicy",
          "ecr:PutLifecyclePolicy",
          "ecr:DeleteLifecyclePolicy",
          "ecr:ListTagsForResource",
          "ecr:TagResource",
          "ecr:UntagResource"
        ]
        Resource = "arn:aws:ecr:*:${data.aws_caller_identity.current.account_id}:repository/*"
      },
      {
        Sid    = "ELBPermissions"
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeLoadBalancerAttributes",
          "elasticloadbalancing:ModifyLoadBalancerAttributes",
          "elasticloadbalancing:CreateTargetGroup",
          "elasticloadbalancing:DeleteTargetGroup",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeTargetGroupAttributes",
          "elasticloadbalancing:ModifyTargetGroupAttributes",
          "elasticloadbalancing:DescribeTargetHealth",
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags",
          "elasticloadbalancing:DescribeTags",
          "elasticloadbalancing:SetSecurityGroups",
          "elasticloadbalancing:SetSubnets"
        ]
        Resource = "*"
      },
      {
        Sid    = "VPCAndNetworkingPermissions"
        Effect = "Allow"
        Action = [
          "ec2:CreateVpc",
          "ec2:DeleteVpc",
          "ec2:DescribeVpcs",
          "ec2:ModifyVpcAttribute",
          "ec2:CreateSubnet",
          "ec2:DeleteSubnet",
          "ec2:DescribeSubnets",
          "ec2:CreateInternetGateway",
          "ec2:DeleteInternetGateway",
          "ec2:DescribeInternetGateways",
          "ec2:AttachInternetGateway",
          "ec2:DetachInternetGateway",
          "ec2:CreateRouteTable",
          "ec2:DeleteRouteTable",
          "ec2:DescribeRouteTables",
          "ec2:CreateRoute",
          "ec2:DeleteRoute",
          "ec2:AssociateRouteTable",
          "ec2:DisassociateRouteTable",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSecurityGroupRules",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:CreateTags",
          "ec2:DeleteTags",
          "ec2:DescribeTags",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeAccountAttributes"
        ]
        Resource = "*"
      },
      {
        Sid    = "SecretsManagerPermissions"
        Effect = "Allow"
        Action = [
          "secretsmanager:CreateSecret",
          "secretsmanager:DeleteSecret",
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecret",
          "secretsmanager:TagResource",
          "secretsmanager:UntagResource",
          "secretsmanager:GetResourcePolicy"
        ]
        Resource = "arn:aws:secretsmanager:*:${data.aws_caller_identity.current.account_id}:secret:*"
      },
      {
        Sid    = "APIGatewayV2Permissions"
        Effect = "Allow"
        Action = [
          "apigateway:POST",
          "apigateway:GET",
          "apigateway:PUT",
          "apigateway:PATCH",
          "apigateway:DELETE"
        ]
        Resource = [
          "arn:aws:apigateway:*::/apis*",
          "arn:aws:apigateway:*::/vpclinks*",
          "arn:aws:apigateway:*::/tags*"
        ]
      }
    ]
  })
}

# Managed policy for research-workspace services (Cognito, EFS, DynamoDB, ELB rules)
# Separate from inline policy to stay under the 10KB inline policy size limit.
resource "aws_iam_policy" "research_workspace_permissions" {
  name = "research-workspace-terraform-permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CognitoPermissions"
        Effect = "Allow"
        Action = [
          "cognito-idp:CreateUserPool",
          "cognito-idp:DeleteUserPool",
          "cognito-idp:DescribeUserPool",
          "cognito-idp:UpdateUserPool",
          "cognito-idp:CreateUserPoolClient",
          "cognito-idp:DeleteUserPoolClient",
          "cognito-idp:DescribeUserPoolClient",
          "cognito-idp:UpdateUserPoolClient",
          "cognito-idp:CreateUserPoolDomain",
          "cognito-idp:DeleteUserPoolDomain",
          "cognito-idp:DescribeUserPoolDomain",
          "cognito-idp:CreateIdentityProvider",
          "cognito-idp:DeleteIdentityProvider",
          "cognito-idp:DescribeIdentityProvider",
          "cognito-idp:UpdateIdentityProvider",
          "cognito-idp:GetUserPoolMfaConfig",
          "cognito-idp:SetUserPoolMfaConfig",
          "cognito-idp:ListUserPoolClients",
          "cognito-idp:ListIdentityProviders",
          "cognito-idp:TagResource",
          "cognito-idp:UntagResource",
          "cognito-idp:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "EFSPermissions"
        Effect = "Allow"
        Action = [
          "elasticfilesystem:CreateFileSystem",
          "elasticfilesystem:DeleteFileSystem",
          "elasticfilesystem:DescribeFileSystems",
          "elasticfilesystem:CreateMountTarget",
          "elasticfilesystem:DeleteMountTarget",
          "elasticfilesystem:DescribeMountTargets",
          "elasticfilesystem:DescribeMountTargetSecurityGroups",
          "elasticfilesystem:CreateAccessPoint",
          "elasticfilesystem:DeleteAccessPoint",
          "elasticfilesystem:DescribeAccessPoints",
          "elasticfilesystem:PutLifecycleConfiguration",
          "elasticfilesystem:DescribeLifecycleConfiguration",
          "elasticfilesystem:TagResource",
          "elasticfilesystem:UntagResource",
          "elasticfilesystem:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "DynamoDBPermissions"
        Effect = "Allow"
        Action = [
          "dynamodb:CreateTable",
          "dynamodb:DeleteTable",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeContinuousBackups",
          "dynamodb:DescribeTimeToLive",
          "dynamodb:UpdateTable",
          "dynamodb:UpdateContinuousBackups",
          "dynamodb:UpdateTimeToLive",
          "dynamodb:TagResource",
          "dynamodb:UntagResource",
          "dynamodb:ListTagsOfResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "ELBListenerRulePermissions"
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:CreateRule",
          "elasticloadbalancing:DeleteRule",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:ModifyRule"
        ]
        Resource = "*"
      },
      {
        Sid    = "SNSPermissions"
        Effect = "Allow"
        Action = [
          "sns:CreateTopic",
          "sns:DeleteTopic",
          "sns:GetTopicAttributes",
          "sns:SetTopicAttributes",
          "sns:Subscribe",
          "sns:Unsubscribe",
          "sns:GetSubscriptionAttributes",
          "sns:ListSubscriptionsByTopic",
          "sns:TagResource",
          "sns:UntagResource",
          "sns:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchAlarmsPermissions"
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricAlarm",
          "cloudwatch:DeleteAlarms",
          "cloudwatch:DescribeAlarms",
          "cloudwatch:ListTagsForResource",
          "cloudwatch:TagResource",
          "cloudwatch:UntagResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "BudgetsPermissions"
        Effect = "Allow"
        Action = [
          "budgets:CreateBudget",
          "budgets:ModifyBudget",
          "budgets:DeleteBudget",
          "budgets:ViewBudget",
          "budgets:DescribeBudget",
          "budgets:ListTagsForResource",
          "budgets:TagResource",
          "budgets:UntagResource"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "research_workspace_permissions" {
  role       = aws_iam_role.terraform_role.name
  policy_arn = aws_iam_policy.research_workspace_permissions.arn
}
# ----------------------------------------------------------------------------
# GitHub Actions: Anthropic key reader (PR/issue context, not just main)
# ----------------------------------------------------------------------------
# Smaller-scope role for the Claude Code Review and @claude action workflows,
# which need to fetch the Anthropic API key but run on PR/issue events that
# don't carry the `environment:production` OIDC subject claim.

resource "aws_iam_role" "github_actions_anthropic_reader" {
  name = "github-actions-anthropic-reader"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowGitHubOIDCAnyContext"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Any workflow in this repo. The IAM policy below is the only thing
            # this role can do, so a wider trust subject is acceptable.
            "token.actions.githubusercontent.com:sub" = "repo:nsuberi/proto-portal-showcase-hub:*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "github_actions_anthropic_reader" {
  name = "read-anthropic-key-only"
  role = aws_iam_role.github_actions_anthropic_reader.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = "arn:aws:secretsmanager:us-east-1:${data.aws_caller_identity.current.account_id}:secret:portfolio-prod/anthropic-api-key*"
      }
    ]
  })
}
