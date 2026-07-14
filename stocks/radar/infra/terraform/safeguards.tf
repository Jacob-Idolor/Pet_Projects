# Cost and scope safeguards — this stack creates S3 + CloudFront (+ optional DNS/budget) ONLY.

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  safeguard_summary = {
    stack_scope       = "static-site-only"
    allowed_services  = "S3, CloudFront, optional ACM + external/Cloudflare or Route53 DNS, Budgets, optional SNS digest"
    blocked_by_design = "EKS, EC2, RDS, Lambda, ECS — not defined in this Terraform"
    account_id        = data.aws_caller_identity.current.account_id
    region            = data.aws_region.current.name
    cost_notes        = "PriceClass_100, Cloudflare DNS preferred (no Route53), destroy when feedback done"
  }
}

check "correct_aws_account" {
  assert {
    condition = (
      length(var.allowed_account_ids) == 0 ||
      contains(var.allowed_account_ids, data.aws_caller_identity.current.account_id)
    )
    error_message = <<-EOT
      Refusing to apply: credentials are for account ${data.aws_caller_identity.current.account_id},
      which is not in allowed_account_ids. Set allowed_account_ids in terraform.tfvars to your account ID
      from: aws sts get-caller-identity --profile pet-projects
    EOT
  }
}

check "bucket_name_matches_iam_prefix" {
  assert {
    condition     = startswith(var.site_bucket_name, var.required_bucket_prefix)
    error_message = "site_bucket_name must start with '${var.required_bucket_prefix}' to match your IAM policy and prevent typos."
  }
}

check "custom_domain_requires_dns" {
  assert {
    condition = (
      !var.enable_custom_domain ||
      (
        var.domain_name != "" &&
        (
          var.dns_management == "external" ||
          (var.dns_management == "route53" && var.route53_zone_id != "")
        )
      )
    )
    error_message = <<-EOT
      enable_custom_domain=true requires domain_name.
      For cheapest path set dns_management = "external" (Cloudflare Free DNS — no Route53).
      For AWS DNS set dns_management = "route53" and route53_zone_id.
    EOT
  }
}

check "region_is_allowed" {
  assert {
    condition     = contains(var.allowed_regions, var.aws_region)
    error_message = "aws_region must be one of: ${join(", ", var.allowed_regions)}. Stay in one region to avoid surprise cross-region charges."
  }
}

check "budget_cap_sane" {
  assert {
    condition     = !var.enable_budget || (var.monthly_budget_usd >= 1 && var.monthly_budget_usd <= var.max_monthly_budget_usd)
    error_message = "monthly_budget_usd must be between 1 and ${var.max_monthly_budget_usd} when enable_budget is true."
  }
}
