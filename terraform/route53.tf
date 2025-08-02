# Use existing Route 53 Hosted Zone for cookinupideas.com
data "aws_route53_zone" "main" {
  zone_id = "Z0990573XMA6PHFKL82S"
}

# ACM Certificate for portfolio.cookinupideas.com
resource "aws_acm_certificate" "portfolio" {
  domain_name       = "portfolio.cookinupideas.com"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "portfolio-cookinupideas-com"
    Environment = var.environment
  }
}

# DNS validation records for ACM certificate
resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.portfolio.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Wait for certificate validation
resource "aws_acm_certificate_validation" "portfolio" {
  certificate_arn         = aws_acm_certificate.portfolio.arn
  validation_record_fqdns = [for record in aws_route53_record.acm_validation : record.fqdn]
}

# A record for portfolio.cookinupideas.com pointing to CloudFront
resource "aws_route53_record" "portfolio" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "portfolio.cookinupideas.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

# AAAA record for IPv6 support
resource "aws_route53_record" "portfolio_ipv6" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "portfolio.cookinupideas.com"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}