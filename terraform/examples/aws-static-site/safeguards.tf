# Cost and scope safeguards — S3 + CloudFront (+ optional DNS/budget) ONLY.

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  safeguard_summary = {
    stack_scope       = "static-site-only"
    allowed_services  = "S3, CloudFront, optional Route53/ACM/Budgets"
    blocked_by_design = "EKS, EC2, RDS, Lambda — not defined in this Terraform"
    account_id        = data.aws_caller_identity.current.account_id
    region            = data.aws_region.current.name
  }
}

check "correct_aws_account" {
  assert {
    condition = (
      length(var.allowed_account_ids) == 0 ||
      contains(var.allowed_account_ids, data.aws_caller_identity.current.account_id)
    )
    error_message = "Credentials are for an unexpected AWS account. Set allowed_account_ids in terraform.tfvars."
  }
}

check "custom_domain_requires_dns" {
  assert {
    condition = (
      !var.enable_custom_domain ||
      (var.domain_name != "" && var.route53_zone_id != "")
    )
    error_message = "enable_custom_domain=true requires domain_name and route53_zone_id."
  }
}

check "budget_requires_email" {
  assert {
    condition     = !var.enable_budget || var.budget_alert_email != ""
    error_message = "enable_budget=true requires budget_alert_email."
  }
}
