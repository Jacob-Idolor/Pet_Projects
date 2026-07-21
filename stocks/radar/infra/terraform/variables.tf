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
  description = "AWS budget alert threshold in USD (keep low for friend-feedback trials)"
  type        = number
  default     = 3
}

variable "max_monthly_budget_usd" {
  description = "Upper cap for budget alert variable (safeguard against typos like 5000)"
  type        = number
  default     = 5
}

variable "budget_alert_email" {
  description = "Email for budget alerts. Required for budget resource."
  type        = string
  default     = ""
  sensitive   = true
}

variable "enable_budget" {
  description = "Create AWS Budget alert (needs billing permissions on IAM user)"
  type        = bool
  default     = true
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
