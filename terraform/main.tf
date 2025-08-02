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
resource "aws_cloudfront_function" "prototype_router" {
  name    = "${var.bucket_name}-prototype-router"
  runtime = "cloudfront-js-1.0"
  code    = <<-EOT
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Handle prototype directory access - add index.html if missing
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
        return request;
    }
    
    // Handle SPA routing within prototypes
    if (uri.startsWith('/prototypes/')) {
        var pathParts = uri.split('/');
        
        // If accessing a prototype subdirectory without file extension, serve the prototype's index.html
        if (pathParts.length >= 3 && !uri.includes('.')) {
            var prototypeName = pathParts[2];
            // Only handle known prototypes
            if (prototypeName === 'ffx-skill-map' || prototypeName === 'home-lending-learning') {
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

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${var.bucket_name}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

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
  }

  # Main SPA routing - redirect 404s to index.html (for main site only)
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  aliases = ["portfolio.cookinupideas.com"]

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate_validation.portfolio.certificate_arn
    ssl_support_method  = "sni-only"
  }

  tags = {
    Name        = "AI Portfolio Website"
    Environment = var.environment
  }
}