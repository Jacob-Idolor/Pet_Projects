variable "aws_region" {
  description = "Primary AWS region for S3 bucket"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix for resource names"
  type        = string
  default     = "k8s-practice"
}

variable "site_bucket_name" {
  description = "Globally unique S3 bucket name for static site"
  type        = string
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
  description = "AWS budget alert threshold in USD"
  type        = number
  default     = 5
}

variable "budget_alert_email" {
  description = "Email for budget alerts. Required for budget resource."
  type        = string
  default     = ""
}

variable "enable_budget" {
  description = "Create AWS Budget alert (needs billing permissions on IAM user)"
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "PriceClass_100 = US/EU only (cheapest). PriceClass_All = global."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "Use PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}
