data "cloudflare_zone" "site" {
  count = var.manage_dns_record ? 1 : 0

  filter = {
    name = var.zone_name
  }
}

resource "cloudflare_pages_project" "nbis" {
  account_id        = var.cloudflare_account_id
  name              = var.pages_project_name
  production_branch = var.production_branch

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_pages_domain" "nbis" {
  count        = var.enable_custom_domain ? 1 : 0
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.nbis.name
  name         = var.site_domain
}

resource "cloudflare_dns_record" "site" {
  count   = var.manage_dns_record && var.enable_custom_domain ? 1 : 0
  zone_id = data.cloudflare_zone.site[0].id
  name    = var.site_domain
  type    = "CNAME"
  content = cloudflare_pages_project.nbis.subdomain
  ttl     = 1
  proxied = true
  comment = "Managed by Terraform: StocksWatch NBIS Cloudflare Pages site"

  depends_on = [cloudflare_pages_domain.nbis]
}
