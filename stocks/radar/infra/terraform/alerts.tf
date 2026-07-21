# Signal alerts — personal (per-subscriber SNS) + optional shared broadcast topic.
# GitHub Actions evaluates alert-rules.json and publishes only to matching users (no Lambda).

variable "enable_signal_alerts" {
  description = "Create shared SNS topic for board-wide lean-buy/sell emails (optional broadcast)."
  type        = bool
  default     = true
}

variable "alerts_email" {
  description = "Email for the shared broadcast alerts topic. Defaults to digest_email, then budget_alert_email."
  type        = string
  default     = ""
  sensitive   = true
}

variable "alerts_use_digest_topic" {
  description = "If true, skip a separate shared alerts topic and reuse the daily digest SNS topic."
  type        = bool
  default     = true
}

variable "alert_subscribers" {
  description = <<-EOT
    People who can receive personal signal emails. IDs must match subscriberId in
    stocks/radar/src/data/alert-rules.json. Emails stay in terraform.tfvars (not committed).
    Creates one SNS topic + email subscription per person so only they get their rules.
  EOT
  type = list(object({
    id    = string
    email = string
  }))
  default   = []
  sensitive = true

  validation {
    condition = alltrue([
      for s in var.alert_subscribers :
      can(regex("^[a-z0-9-]{1,32}$", s.id))
    ])
    error_message = "Each alert_subscribers.id must be lowercase letters, numbers, hyphens (max 32) — matches alert-rules.json subscriberId."
  }
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

  alert_subscribers_map = {
    # IDs are not secret; unwrap so for_each is allowed. Emails remain sensitive.
    for s in var.alert_subscribers : nonsensitive(s.id) => s
  }
}

resource "aws_sns_topic" "signal_alerts" {
  count = local.create_alerts_topic ? 1 : 0

  name = "${var.project_name}-signal-alerts"

  tags = {
    Purpose = "radar-board-wide-alerts"
  }
}

resource "aws_sns_topic_subscription" "signal_alerts_email" {
  count = local.create_alerts_topic && local.alerts_email_effective != null ? 1 : 0

  topic_arn = aws_sns_topic.signal_alerts[0].arn
  protocol  = "email"
  endpoint  = local.alerts_email_effective
}

# One topic per person — emails for their alert-rules only.
resource "aws_sns_topic" "personal_alerts" {
  for_each = local.alert_subscribers_map

  name = "${var.project_name}-alerts-${each.key}"

  tags = {
    Purpose      = "radar-personal-signal-alerts"
    SubscriberId = each.key
  }
}

resource "aws_sns_topic_subscription" "personal_alerts_email" {
  for_each = local.alert_subscribers_map

  topic_arn = aws_sns_topic.personal_alerts[each.key].arn
  protocol  = "email"
  endpoint  = each.value.email
}

check "alerts_need_inbox" {
  assert {
    condition = (
      !var.enable_signal_alerts ||
      var.alerts_use_digest_topic ||
      local.alerts_email_effective != null
    )
    error_message = "enable_signal_alerts with a dedicated shared topic requires alerts_email, digest_email, or budget_alert_email."
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

check "personal_alerts_need_valid_email" {
  assert {
    condition = alltrue([
      for s in var.alert_subscribers :
      can(regex(".+@.+", s.email))
    ])
    error_message = "Each alert_subscribers.email must look like an email address."
  }
}
