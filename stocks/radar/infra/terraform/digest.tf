# Optional daily email digest — SNS only (no Lambda, no always-on compute).
# GitHub Actions publishes CloudFront viewer metrics + watchlist mood to this topic.

variable "enable_daily_digest" {
  description = "Create SNS topic for daily Stocks Radar email digests (CloudFront viewers + list mood). Free tier friendly."
  type        = bool
  default     = true
}

variable "digest_email" {
  description = "Email for daily digests. Defaults to budget_alert_email when empty."
  type        = string
  default     = ""
  sensitive   = true
}

locals {
  digest_email_effective = (
    var.digest_email != "" ? var.digest_email :
    var.budget_alert_email != "" ? var.budget_alert_email :
    null
  )
}

resource "aws_sns_topic" "daily_digest" {
  count = var.enable_daily_digest ? 1 : 0

  name = "${var.project_name}-daily-digest"

  tags = {
    Purpose = "friend-feedback-daily-email"
  }
}

resource "aws_sns_topic_subscription" "daily_digest_email" {
  count = var.enable_daily_digest && local.digest_email_effective != null ? 1 : 0

  topic_arn = aws_sns_topic.daily_digest[0].arn
  protocol  = "email"
  endpoint  = local.digest_email_effective
}

check "digest_needs_email" {
  assert {
    condition = (
      !var.enable_daily_digest ||
      local.digest_email_effective != null
    )
    error_message = "enable_daily_digest=true requires digest_email or budget_alert_email so SNS can subscribe an inbox."
  }
}
