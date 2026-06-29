terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Lambda@Edge provider removed (no longer needed)

# S3 bucket for hosting
resource "aws_s3_bucket" "website" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # SPA routing
  }
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      },
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}

# CloudFront Function for prototype SPA routing
# Vault path rewriter: strips /prototypes/research-workspace/vault prefix
# so code-server (which runs at root /) receives clean paths.
resource "aws_cloudfront_function" "vault_path_rewriter" {
  name    = "${var.bucket_name}-vault-path-rewriter"
  runtime = "cloudfront-js-2.0"
  code    = <<-EOT
function handler(event) {
    var request = event.request;
    var prefix = '/prototypes/research-workspace/vault';
    if (request.uri.startsWith(prefix)) {
        request.uri = request.uri.substring(prefix.length) || '/';
    }
    return request;
}
EOT
}

resource "aws_cloudfront_function" "prototype_router" {
  name    = "${var.bucket_name}-prototype-router"
  runtime = "cloudfront-js-1.0"
  code    = <<-EOT
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var headers = request.headers || {};
    var host = (headers.host && headers.host.value) ? headers.host.value : "";
    
    // Handle prototype directory access - add index.html if missing
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
        return request;
    }
    
    // Host-based subdomain routing
    if (host === 'learningpath.cookinupideas.com') {
        request.uri = '/prototypes/learning-path/index.html';
        return request;
    }
    
    // Handle SPA routing within prototypes
    if (uri.startsWith('/prototypes/')) {
        var pathParts = uri.split('/');

        // If accessing a prototype subdirectory without file extension, serve the prototype's index.html
        if (pathParts.length >= 3 && !uri.includes('.')) {
            var prototypeName = pathParts[2];
            // Only handle known prototypes
            if (prototypeName === 'ffx-skill-map' || prototypeName === 'home-lending-learning' || prototypeName === 'documentation-explorer' || prototypeName === 'learning-path' || prototypeName === 'research-workspace' || prototypeName === 'ai-builders' || prototypeName === 'ai-integration-visualizer') {
                request.uri = '/prototypes/' + prototypeName + '/index.html';
            }
        }
    }
    
    return request;
}
EOT
}

# Uncomment the following resources when ready to implement Lambda@Edge:

# # Create the Lambda deployment package
# data "archive_file" "spa_routing_zip" {
#   type        = "zip"
#   output_path = "spa-routing.zip"
#   source {
#     content = <<-EOT
# exports.handler = async (event, context) => {
#     const request = event.Records[0].cf.request;
#     const uri = request.uri;
#     
#     // Handle prototype directory access
#     if (uri.endsWith('/')) {
#         request.uri += 'index.html';
#         return request;
#     }
#     
#     // Handle SPA routing within prototypes
#     if (uri.startsWith('/prototypes/')) {
#         const pathParts = uri.split('/');
#         if (pathParts.length >= 3 && !uri.includes('.')) {
#             const prototypeName = pathParts[2];
#             request.uri = `/prototypes/$${prototypeName}/index.html`;
#         }
#     }
#     
#     return request;
# };
# EOT
#     filename = "index.js"
#   }
# }

# # IAM role for Lambda@Edge
# resource "aws_iam_role" "lambda_edge_role" {
#   name = "${var.bucket_name}-lambda-edge-role"
#   provider = aws.us-east-1

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = [
#             "lambda.amazonaws.com",
#             "edgelambda.amazonaws.com"
#           ]
#         }
#       }
#     ]
#   })
# }

# # IAM policy for Lambda@Edge
# resource "aws_iam_role_policy" "lambda_edge_policy" {
#   name = "${var.bucket_name}-lambda-edge-policy"
#   role = aws_iam_role.lambda_edge_role.id
#   provider = aws.us-east-1

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "logs:CreateLogGroup",
#           "logs:CreateLogStream",
#           "logs:PutLogEvents"
#         ]
#         Resource = "arn:aws:logs:*:*:*"
#       },
#       {
#         Effect = "Allow"
#         Action = [
#           "lambda:EnableReplication*",
#           "lambda:GetFunction",
#           "lambda:GetFunctionConfiguration",
#           "lambda:PublishVersion"
#         ]
#         Resource = [
#           "arn:aws:lambda:us-east-1:671388079324:function:${var.bucket_name}-spa-routing",
#           "arn:aws:lambda:us-east-1:671388079324:function:${var.bucket_name}-spa-routing:*"
#         ]
#       },
#       {
#         Effect = "Allow"
#         Action = [
#           "iam:CreateServiceLinkedRole"
#         ]
#         Resource = "arn:aws:iam::*:role/aws-service-role/replicator.lambda.amazonaws.com/AWSServiceRoleForLambdaReplicator"
#       },
#       {
#         Effect = "Allow"
#         Action = [
#           "iam:CreateServiceLinkedRole"
#         ]
#         Resource = "arn:aws:iam::*:role/aws-service-role/logger.cloudfront.amazonaws.com/AWSServiceRoleForCloudFrontLogger"
#       }
#     ]
#   })
# }

# # Lambda@Edge function for SPA routing
# resource "aws_lambda_function" "spa_routing" {
#   filename         = data.archive_file.spa_routing_zip.output_path
#   function_name    = "${var.bucket_name}-spa-routing"
#   role            = aws_iam_role.lambda_edge_role.arn
#   handler         = "index.handler"
#   runtime         = "nodejs18.x"
#   publish         = true
#   timeout         = 5
#   source_code_hash = data.archive_file.spa_routing_zip.output_base64sha256

#   # Lambda@Edge functions must be in us-east-1
#   provider = aws.us-east-1
# }

# AI Evals in Context module
# Shared Anthropic API key — single source of truth in Secrets Manager.
# Bootstrapped via z_creds/bootstrap.sh, consumed by both ai-evals ECS task and
# the shared API Lambda (which fetches by name at runtime via AWS_SECRETS_ENABLED).
data "aws_secretsmanager_secret" "anthropic_api_key" {
  name = "portfolio-prod/anthropic-api-key"
}

module "ai_evals" {
  source = "./modules/ai-evals"

  environment                  = "prod"
  app_name                     = "ai-testing-resource"
  anthropic_api_key_secret_arn = data.aws_secretsmanager_secret.anthropic_api_key.arn
  certificate_arn              = aws_acm_certificate.portfolio.arn
}

# Research Workspace module — code-server on ECS, co-hosted on ai-evals cluster
module "research_workspace" {
  source = "./modules/research-workspace"

  # Shared infrastructure from ai-evals
  vpc_id                 = module.ai_evals.vpc_id
  public_subnet_ids      = module.ai_evals.public_subnet_ids
  ecs_cluster_arn        = module.ai_evals.ecs_cluster_arn
  ecs_security_group_id  = module.ai_evals.ecs_security_group_id
  alb_https_listener_arn = module.ai_evals.alb_https_listener_arn
  alb_security_group_id  = module.ai_evals.alb_security_group_id

  # EFS
  efs_file_system_id  = aws_efs_file_system.research_workspace.id
  efs_access_point_id = aws_efs_access_point.nathan.id

  # Cognito
  cognito_user_pool_arn       = aws_cognito_user_pool.research_workspace.arn
  cognito_user_pool_client_id = aws_cognito_user_pool_client.research_workspace.id
  cognito_domain              = aws_cognito_user_pool_domain.research_workspace.domain

  # Agent auth + quota: single operator ANTHROPIC_API_KEY (commercial API),
  # injected from Secrets Manager; per-user budget tracked in the DynamoDB table.
  quota_table_name             = aws_dynamodb_table.research_workspace.name
  quota_table_arn              = aws_dynamodb_table.research_workspace.arn
  anthropic_api_key_secret_arn = data.aws_secretsmanager_secret.research_workspace_anthropic_api_key.arn
  allowlist                    = var.research_workspace_allowlist
  enable_scheduler             = var.research_workspace_enable_scheduler

  # Security monitoring
  alert_email = var.sandbox_alert_email
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${var.bucket_name}"
  }

  origin {
    domain_name = module.ai_evals.alb_dns_name
    origin_id   = "ai-evals-api"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # ALB OAuth callback — Cognito's auth redirect must reach the ALB, not S3
  ordered_cache_behavior {
    path_pattern           = "/oauth2/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ai-evals-api"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"
  }

  # NOTE: The AI Evals app (path /prototypes/ai-evals/*) was retired on
  # 2026-06-28; its CloudFront behavior was removed. The "ai-evals-api" ALB
  # origin and the /oauth2/* behavior above are retained because the Research
  # Workspace Cognito OAuth callback routes through the same ALB.

  # FFX Skill Map cache behavior
  ordered_cache_behavior {
    path_pattern           = "/prototypes/ffx-skill-map/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.prototype_router.arn
    }
  }

  # Home Lending Learning cache behavior
  ordered_cache_behavior {
    path_pattern           = "/prototypes/home-lending-learning/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.prototype_router.arn
    }
  }

  # Documentation Explorer cache behavior
  ordered_cache_behavior {
    path_pattern           = "/prototypes/documentation-explorer/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.prototype_router.arn
    }
  }

  # Learning Path cache behavior
  ordered_cache_behavior {
    path_pattern           = "/prototypes/learning-path/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.prototype_router.arn
    }
  }

  # Research Workspace vault — authenticated via ALB/Cognito
  # Full path passes through to ALB (no rewriting) — Express backend handles all vault paths
  ordered_cache_behavior {
    path_pattern           = "/prototypes/research-workspace/vault*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ai-evals-api"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"
  }

  # Research Workspace public gallery — static S3
  ordered_cache_behavior {
    path_pattern           = "/prototypes/research-workspace/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.prototype_router.arn
    }
  }

  # AI Integration Visualizer cache behavior
  ordered_cache_behavior {
    path_pattern           = "/prototypes/ai-integration-visualizer/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.prototype_router.arn
    }
  }

  # AI Builders cache behavior
  ordered_cache_behavior {
    path_pattern           = "/prototypes/ai-builders/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.prototype_router.arn
    }
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    # Prototype router function handles:
    # - trailing slash → append index.html
    # - /prototypes/{name} (no slash) → rewrite to /prototypes/{name}/index.html
    # - SPA deep-link routing within prototypes
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.prototype_router.arn
    }
  }

  # Main SPA routing - redirect 404s to index.html (for main site only)
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  # S3 returns 403 for directory-like paths (e.g. /prototypes/research-workspace)
  # The CloudFront function handles rewriting these, but as a safety net:
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  aliases = ["portfolio.cookinupideas.com", "learningpath.cookinupideas.com"]

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate_validation.portfolio.certificate_arn
    ssl_support_method  = "sni-only"
  }

  tags = {
    Name        = "AI Portfolio Website"
    Environment = var.environment
  }
}