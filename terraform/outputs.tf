output "website_url" {
  description = "Website URL"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.website.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.website.id
}

# AI Analysis API Outputs
output "ai_api_url" {
  description = "AI Analysis API URL"
  value       = aws_lambda_function_url.ai_api.function_url
}

output "ai_api_function_name" {
  description = "Lambda function name for AI Analysis API"
  value       = aws_lambda_function.ai_api.function_name
}