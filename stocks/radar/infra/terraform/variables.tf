variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Pages project."
  type        = string

  validation {
    condition     = can(regex("^[a-f0-9]{32}$", var.cloudflare_account_id))
    error_message = "cloudflare_account_id must be the 32-character hexadecimal Cloudflare account ID."
  }
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Pages Edit, Zone Read, and DNS Edit permissions. Prefer CLOUDFLARE_API_TOKEN in CI."
  type        = string
  sensitive   = true
  default     = null
}

variable "pages_project_name" {
  description = "Stable Cloudflare Pages project name used by Wrangler deployments."
  type        = string
  default     = "stockswatch-nbis"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$", var.pages_project_name))
    error_message = "pages_project_name must be a lowercase Cloudflare Pages project name."
  }
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

  validation {
    condition     = can(regex("^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$", var.zone_name))
    error_message = "zone_name must be a DNS zone name such as stockswatch.cc."
  }
}

variable "site_domain" {
  description = "Apex or subdomain to attach to the Pages project."
  type        = string
  default     = "stockswatch.cc"

  validation {
    condition     = can(regex("^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$", var.site_domain))
    error_message = "site_domain must be a DNS hostname such as stockswatch.cc or www.stockswatch.cc."
  }
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
