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
  description = "Enable Route53 + ACM custom domain (extra cost). Leave false to use CloudFront URL only."
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Custom domain (e.g. learn.example.com). Required if enable_custom_domain is true."
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for DNS validation and alias record"
  type        = string
  default     = ""
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
