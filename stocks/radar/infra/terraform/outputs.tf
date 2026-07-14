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
  description = "How to tear down after friend feedback"
  value       = "Empty the bucket if needed (aws s3 rm s3://$(terraform output -raw s3_bucket_name) --recursive), then: terraform destroy"
}

output "daily_digest_topic_arn" {
  description = "SNS topic ARN for daily viewer/mood emails (set as GitHub secret STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN)"
  value       = try(aws_sns_topic.daily_digest[0].arn, null)
}

output "daily_digest_email" {
  description = "Inbox that must Confirm subscription from AWS SNS before digests arrive"
  value       = try(local.digest_email_effective, null)
  sensitive   = true
}

output "estimated_monthly_cost_usd" {
  description = "Rough low-traffic cost band (no custom domain, PriceClass_100)"
  value       = "About 0.50–3.00 USD/mo for friend-scale traffic; destroy when done to go to ~0"
}
