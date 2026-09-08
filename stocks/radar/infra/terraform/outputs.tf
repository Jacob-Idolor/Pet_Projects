output "pages_project_name" {
  description = "Cloudflare Pages project name used by the deploy workflow."
  value       = cloudflare_pages_project.nbis.name
}

output "pages_subdomain" {
  description = "Cloudflare-provided pages.dev hostname."
  value       = cloudflare_pages_project.nbis.subdomain
}

output "site_url" {
  description = "Configured public site URL."
  value       = "https://${var.site_domain}"
}

output "wrangler_deploy_command" {
  description = "Manual deploy command from radar/."
  value       = "npx wrangler@4 pages deploy dist --project-name ${cloudflare_pages_project.nbis.name} --branch ${var.production_branch}"
}
