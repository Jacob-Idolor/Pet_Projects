variable "aws_region" {
  description = "Primary AWS region for S3 bucket"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix for resource names"
  type        = string
  default     = "tf-lab"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_name must be lowercase letters, numbers, and hyphens only."
  }
}

variable "environment" {
  description = "Environment tag (dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be dev, staging, or production."
  }
}

variable "site_bucket_name" {
  description = "Globally unique S3 bucket name for static site"
  type        = string
}

variable "enable_custom_domain" {
  description = "Enable Route53 + ACM custom domain (extra cost)"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Custom domain. Required if enable_custom_domain is true."
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "monthly_budget_usd" {
  description = "AWS budget alert threshold in USD"
  type        = number
  default     = 5
}

variable "budget_alert_email" {
  description = "Email for budget alerts"
  type        = string
  default     = ""
  sensitive   = true
}

variable "enable_budget" {
  description = "Create AWS Budget alert"
  type        = bool
  default     = false
}

variable "cloudfront_price_class" {
  description = "PriceClass_100 = US/EU only (cheapest)"
  type        = string
  default     = "PriceClass_100"
}

variable "allowed_account_ids" {
  description = "Optional: refuse apply if credentials are for a different account"
  type        = list(string)
  default     = []
}
