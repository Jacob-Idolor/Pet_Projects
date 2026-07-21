output "cloudfront_url" {
  description = "Public HTTPS URL (use this until custom domain is enabled)"
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "preferred_site_url" {
  description = "URL to share: custom domain when enabled, otherwise CloudFront"
  value       = var.enable_custom_domain ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "cloudfront_domain_name" {
  description = "CloudFront hostname for Cloudflare CNAME target (DNS only / grey cloud)"
  value       = aws_cloudfront_distribution.site.domain_name
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

output "signal_alerts_topic_arn" {
  description = "Shared SNS topic for board-wide alerts (STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN). May equal daily digest ARN when alerts_use_digest_topic=true."
  value       = local.signal_alerts_topic_arn
}

output "personal_alert_topic_arns" {
  description = "Map of subscriberId → SNS topic ARN. Set GitHub secret STOCKS_RADAR_ALERT_TOPICS to this JSON."
  value = {
    for id, topic in aws_sns_topic.personal_alerts : id => topic.arn
  }
}

output "personal_alert_subscribers" {
  description = "Subscriber IDs with personal alert topics (emails are in tfvars only)"
  value       = keys(aws_sns_topic.personal_alerts)
}

output "alert_setup_hint" {
  description = "How to wire personal signal emails"
  value       = "1) Add alert_subscribers in tfvars 2) terraform apply 3) confirm each SNS email 4) set GitHub secret STOCKS_RADAR_ALERT_TOPICS to jsonencode(personal_alert_topic_arns) 5) edit src/data/alert-rules.json 6) see ALERTS.md"
}

output "estimated_monthly_cost_usd" {
  description = "Rough low-traffic cost band (PriceClass_100; Cloudflare DNS avoids Route53)"
  value       = "About 0.50–3.00 USD/mo + ~10–12 USD/yr domain; destroy AWS when done to go to ~0"
}

output "custom_domain" {
  description = "Primary custom domain (empty when using CloudFront URL only)"
  value       = var.enable_custom_domain ? var.domain_name : ""
}

output "custom_domain_aliases" {
  description = "All hostnames on the CloudFront distribution / ACM cert"
  value       = local.cloudfront_aliases
}

output "acm_dns_validation_records" {
  description = "Add these CNAME records in Cloudflare (DNS only) when enable_custom_domain=true and dns_management=external"
  value = var.enable_custom_domain ? [
    for dvo in aws_acm_certificate.site[0].domain_validation_options : {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  ] : []
}

output "cloudflare_site_cnames" {
  description = "After ACM is issued: one Cloudflare CNAME per hostname → CloudFront (proxy OFF / grey cloud)"
  value = var.enable_custom_domain ? [
    for host in local.cloudfront_aliases : {
      name   = host
      target = aws_cloudfront_distribution.site.domain_name
      proxy  = "DNS only (grey cloud)"
    }
  ] : []
}

output "cloudflare_site_cname" {
  description = "Deprecated alias of the primary hostname mapping — prefer cloudflare_site_cnames"
  value = var.enable_custom_domain ? {
    name   = var.domain_name
    target = aws_cloudfront_distribution.site.domain_name
    proxy  = "DNS only (grey cloud)"
  } : null
}

output "domain_setup_hint" {
  description = "Next steps for cheapest custom domain"
  value       = "Buy domain (DOMAIN.md) → set enable_custom_domain=true + domain_name → terraform apply → add acm_dns_validation_records + cloudflare_site_cnames in Cloudflare (grey cloud)"
}

output "reenable_ci_hint" {
  description = "After terraform apply + GitHub secrets"
  value       = "Run stocks/radar/infra/go-live.sh, then set repo variable STOCKS_RADAR_DEPLOY_ENABLED=true (see stocks/radar/GO_LIVE.md)"
}
