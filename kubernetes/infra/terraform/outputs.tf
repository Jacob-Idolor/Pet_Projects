output "cloudfront_url" {
  description = "Public HTTPS URL (use this until custom domain is enabled)"
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "For cache invalidation after deploy"
  value       = aws_cloudfront_distribution.site.id
}

output "s3_bucket_name" {
  description = "Bucket for site uploads"
  value       = aws_s3_bucket.site.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.site.arn
}
