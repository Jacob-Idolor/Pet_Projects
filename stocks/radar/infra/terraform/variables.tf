variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Pages project."
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Pages Edit and DNS Edit permissions. Prefer CLOUDFLARE_API_TOKEN in CI."
  type        = string
  sensitive   = true
  default     = null
}

variable "pages_project_name" {
  description = "Stable Cloudflare Pages project name used by Wrangler deployments."
  type        = string
  default     = "stockswatch-nbis"
}

variable "production_branch" {
  description = "Logical production branch name shown by Cloudflare Pages. Direct uploads still deploy the built dist directory."
  type        = string
  default     = "main"
}

variable "zone_name" {
  description = "Cloudflare zone that serves the custom domain."
  type        = string
  default     = "stockswatch.cc"
}

variable "site_domain" {
  description = "Apex or subdomain to attach to the Pages project."
  type        = string
  default     = "stockswatch.cc"
}

variable "manage_dns_record" {
  description = "Create the CNAME record for the custom domain in the Cloudflare zone."
  type        = bool
  default     = true
}

variable "enable_custom_domain" {
  description = "Attach site_domain to the Pages project."
  type        = bool
  default     = true
}
