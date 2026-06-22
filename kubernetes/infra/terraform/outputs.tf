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

output "aws_account_id" {
  description = "Account this stack was applied to (verify matches your intent)"
  value       = data.aws_caller_identity.current.account_id
}

output "safeguards" {
  description = "Summary of cost/scope safeguards active in this stack"
  value       = local.safeguard_summary
}

output "teardown_hint" {
  description = "How to destroy without prevent_destroy errors"
  value       = "Edit main.tf: set prevent_destroy = false on aws_s3_bucket.site and aws_cloudfront_distribution.site, then terraform apply && terraform destroy"
}
