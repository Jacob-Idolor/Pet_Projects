variable "aws_region" {
  description = "Primary AWS region for S3 bucket"
  type        = string
  default     = "us-west-2"
}

variable "aws_profile" {
  description = "AWS CLI profile name (must match aws configure --profile ...)"
  type        = string
  default     = "pet-projects"
}

variable "allowed_regions" {
  description = "Regions Terraform is allowed to use (safeguard against wrong-region deploys)"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

variable "allowed_account_ids" {
  description = "REQUIRED for production safety: your AWS account ID(s). Refuses apply if CLI credentials are for a different account."
  type        = list(string)
  default     = []
}

variable "project_name" {
  description = "Prefix for resource names"
  type        = string
  default     = "stocks-radar"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_name must be lowercase letters, numbers, and hyphens only."
  }
}

variable "site_bucket_name" {
  description = "Globally unique S3 bucket name for static site (must match required_bucket_prefix)"
  type        = string
}

variable "required_bucket_prefix" {
  description = "Bucket name prefix — must match IAM policy (e.g. pet-projects-)"
  type        = string
  default     = "pet-projects-"
}

variable "enable_custom_domain" {
  description = "Attach a custom domain to CloudFront via ACM (us-east-1). Leave false for free *.cloudfront.net URL."
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Primary hostname (e.g. stockradar.com or www.stockradar.com). Required if enable_custom_domain is true."
  type        = string
  default     = ""
}

variable "domain_aliases" {
  description = <<-EOT
    Extra hostnames on the same ACM cert + CloudFront aliases (e.g. ["www.example.com"] when domain_name is apex).
    Keep empty until you buy the domain. Cloudflare can redirect the unused hostname later.
  EOT
  type        = list(string)
  default     = []
}

variable "include_www_alias" {
  description = "When domain_name is an apex (example.com), also request www.example.com on the cert and CloudFront."
  type        = bool
  default     = true
}

variable "dns_management" {
  description = <<-EOT
    Where DNS lives for the custom domain:
      external — cheapest path: buy at Cloudflare Registrar or Porkbun, DNS on Cloudflare Free (no Route53 fee)
      route53  — AWS managed DNS (~$0.50/mo hosted zone)
  EOT
  type        = string
  default     = "external"

  validation {
    condition     = contains(["external", "route53"], var.dns_management)
    error_message = "dns_management must be \"external\" (Cloudflare/Porkbun DNS) or \"route53\"."
  }
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID. Required only when dns_management = \"route53\"."
  type        = string
  default     = ""
}

variable "enable_security_headers" {
  description = "Attach AWS managed SecurityHeadersPolicy to CloudFront (HSTS, XSS, frame deny, etc.)."
  type        = bool
  default     = true
}

variable "monthly_budget_usd" {
  description = <<-EOT
    Monthly cost alert for THIS stack only (filtered by Project tag).
    Friend-scale hosting is typically $0.50–3; default $3 gives headroom without masking a runaway.
  EOT
  type    = number
  default = 3
}

variable "max_monthly_budget_usd" {
  description = "Upper cap for monthly_budget_usd (typo safeguard). Raise only if you expect real traffic growth."
  type        = number
  default     = 15
}

variable "budget_alert_email" {
  description = "Email for budget alerts. Required when enable_budget=true."
  type        = string
  default     = ""
  sensitive   = true
}

variable "enable_budget" {
  description = "Create AWS Budget alert scoped to Project=project_name (needs Billing → Cost allocation tags activated for Project)."
  type        = bool
  default     = true
}

variable "budget_scope_to_project_tag" {
  description = <<-EOT
    If true (recommended), budget tracks only spend tagged Project=<project_name>.
    If false, budget is account-wide — only use on a dedicated empty account.
  EOT
  type    = bool
  default = true
}

variable "cloudfront_price_class" {
  description = "PriceClass_100 = US/EU only (cheapest). PriceClass_All = global (costs more)."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = var.cloudfront_price_class == "PriceClass_100"
    error_message = "This project only allows PriceClass_100 (cheapest). Remove this validation deliberately if you need global edges."
  }
}

variable "enable_prevent_destroy" {
  description = "Documentation flag — prevent_destroy is false in main.tf so friend-feedback stacks can terraform destroy cleanly."
  type        = bool
  default     = false
}
