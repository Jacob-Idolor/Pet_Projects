# Optional signal-alert emails — lean buy / lean sell / near target.
# GitHub Actions publishes after quote refresh (no Lambda).

variable "enable_signal_alerts" {
  description = "Create SNS topic for radar signal emails (lean buy/sell, near target). Free-tier friendly."
  type        = bool
  default     = true
}

variable "alerts_email" {
  description = "Email for signal alerts. Defaults to digest_email, then budget_alert_email."
  type        = string
  default     = ""
  sensitive   = true
}

variable "alerts_use_digest_topic" {
  description = "If true, skip a separate alerts topic and reuse the daily digest SNS topic (one inbox confirm)."
  type        = bool
  default     = true
}

locals {
  alerts_email_effective = (
    var.alerts_email != "" ? var.alerts_email :
    local.digest_email_effective != null ? local.digest_email_effective :
    null
  )

  create_alerts_topic = var.enable_signal_alerts && !var.alerts_use_digest_topic

  signal_alerts_topic_arn = (
    local.create_alerts_topic ? try(aws_sns_topic.signal_alerts[0].arn, null) :
    var.enable_signal_alerts && var.enable_daily_digest ? try(aws_sns_topic.daily_digest[0].arn, null) :
    null
  )
}

resource "aws_sns_topic" "signal_alerts" {
  count = local.create_alerts_topic ? 1 : 0

  name = "${var.project_name}-signal-alerts"

  tags = {
    Purpose = "radar-lean-buy-sell-alerts"
  }
}

resource "aws_sns_topic_subscription" "signal_alerts_email" {
  count = local.create_alerts_topic && local.alerts_email_effective != null ? 1 : 0

  topic_arn = aws_sns_topic.signal_alerts[0].arn
  protocol  = "email"
  endpoint  = local.alerts_email_effective
}

check "alerts_need_inbox" {
  assert {
    condition = (
      !var.enable_signal_alerts ||
      var.alerts_use_digest_topic ||
      local.alerts_email_effective != null
    )
    error_message = "enable_signal_alerts with a dedicated topic requires alerts_email, digest_email, or budget_alert_email."
  }
}

check "alerts_digest_reuse_needs_digest" {
  assert {
    condition = (
      !var.enable_signal_alerts ||
      !var.alerts_use_digest_topic ||
      var.enable_daily_digest
    )
    error_message = "alerts_use_digest_topic=true requires enable_daily_digest=true (or set alerts_use_digest_topic=false for a dedicated topic)."
  }
}
