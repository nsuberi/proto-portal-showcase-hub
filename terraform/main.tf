terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Lambda@Edge functions must be in us-east-1
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

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

# Create the Lambda deployment package
data "archive_file" "spa_routing_zip" {
  type        = "zip"
  output_path = "spa-routing.zip"
  source {
    content = <<-EOT
exports.handler = async (event, context) => {
    const request = event.Records[0].cf.request;
    const uri = request.uri;
    
    // Handle prototype directory access
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
        return request;
    }
    
    // Handle SPA routing within prototypes
    if (uri.startsWith('/prototypes/')) {
        const pathParts = uri.split('/');
        if (pathParts.length >= 3 && !uri.includes('.')) {
            const prototypeName = pathParts[2];
            request.uri = `/prototypes/$${prototypeName}/index.html`;
        }
    }
    
    return request;
};
EOT
    filename = "index.js"
  }
}

# IAM role for Lambda@Edge
resource "aws_iam_role" "lambda_edge_role" {
  name = "${var.bucket_name}-lambda-edge-role"
  provider = aws.us-east-1

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
}

# IAM policy for Lambda@Edge
resource "aws_iam_role_policy" "lambda_edge_policy" {
  name = "${var.bucket_name}-lambda-edge-policy"
  role = aws_iam_role.lambda_edge_role.id
  provider = aws.us-east-1

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
      }
    ]
  })
}

# Lambda@Edge function for SPA routing
resource "aws_lambda_function" "spa_routing" {
  filename         = data.archive_file.spa_routing_zip.output_path
  function_name    = "${var.bucket_name}-spa-routing"
  role            = aws_iam_role.lambda_edge_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  publish         = true
  timeout         = 5
  source_code_hash = data.archive_file.spa_routing_zip.output_base64sha256

  # Lambda@Edge functions must be in us-east-1
  provider = aws.us-east-1
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${var.bucket_name}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # Custom cache behavior for prototypes subdirectories
  ordered_cache_behavior {
    path_pattern           = "/prototypes/*"
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

    # Use Lambda@Edge for origin-request processing
    lambda_function_association {
      event_type   = "origin-request"
      lambda_arn   = aws_lambda_function.spa_routing.qualified_arn
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

  # Main SPA routing - redirect 404s to index.html
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Prototype SPA routing fallback - redirect 403s to prototype index.html
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/prototypes/ffx-skill-map/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "AI Portfolio Website"
    Environment = var.environment
  }
}