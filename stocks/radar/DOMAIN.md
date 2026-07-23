# Domain — cheapest path (Cloudflare / Porkbun + AWS)

Host the site on **S3 + CloudFront** (this repo). Buy a domain elsewhere — **do not** use Google/Squarespace as a host.

| Need | Pick | Cost |
|------|------|------|
| Register name | [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) or [Porkbun](https://porkbun.com/) | ~$10–12/yr (.com) |
| DNS | **Cloudflare Free** | $0 |
| Site hosting | AWS Terraform in this folder | ~$0.50–3/mo |
| Route53 | Skip (`dns_management = "external"`) | Saves ~$0.50/mo |

You can apply Terraform and share the `*.cloudfront.net` URL **before** buying a domain. Flip `enable_custom_domain` only after checkout.

## 1. Buy the domain

1. Search your name on Porkbun or Cloudflare Registrar.
2. Prefer a short **`.com`** for AdSense + friend trust. Cheaper TLDs work but look less solid.
3. Complete checkout. If you buy on Porkbun, set **nameservers to Cloudflare** next (or buy on Cloudflare so NS are already theirs).

## 2. Cloudflare Free DNS

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → Add site → Free plan.
2. Copy the two Cloudflare nameservers into your registrar (if not already Cloudflare).
3. Wait until Cloudflare shows the zone as **Active**.

## 3. Wire Terraform (after CloudFront exists)

Redeploy the static site first with `enable_custom_domain = false` so you have a working `*.cloudfront.net` URL.

Then edit `terraform.tfvars`:

```hcl
enable_custom_domain = true
domain_name          = "yourdomain.com"   # apex recommended
dns_management       = "external"         # cheapest — no Route53
include_www_alias    = true               # ACM + CloudFront also cover www
# domain_aliases     = []                 # extra hosts if needed
# route53_zone_id  = ""                   # leave empty
```

```bash
cd stocks/radar/infra/terraform
terraform apply
```

**While apply is waiting on ACM** (up to ~45 min):

```bash
terraform output acm_dns_validation_records
```

In Cloudflare → DNS → Add record for each validation entry (apex **and** www if `include_www_alias`):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | (from output `name`) | (from output `value`) | **DNS only** (grey cloud) |

After ACM issues, Terraform attaches the cert to CloudFront.

Then add site CNAMEs for every hostname:

```bash
terraform output cloudflare_site_cnames
terraform output -raw cloudfront_domain_name
```

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` or `www` (each host from output) | `dxxxx.cloudfront.net` | **DNS only** (grey cloud) |

> Keep the orange cloud **off**. CloudFront already terminates HTTPS; proxying through Cloudflare often breaks the ACM cert pairing.

Optional: Cloudflare Bulk Redirect from the hostname you do not want as canonical (e.g. `www` → apex).

## 4. Point the app at the new URL

1. For SEO/site URL, set build env:
   - Local / CI: `STOCKS_RADAR_SITE=https://yourdomain.com`
2. Redeploy so `robots.txt`, `sitemap.xml`, and `ads.txt` use the custom domain.
3. In AdSense → add **yourdomain.com** (see [ADSENSE.md](ADSENSE.md)).

GitHub secret `STOCKS_RADAR_CLOUDFRONT_DOMAIN` can stay the distribution hostname for invalidation; preferred public URL is the custom domain via `STOCKS_RADAR_SITE`.

## 5. Checklist after purchase

- [ ] Domain bought + Cloudflare zone Active  
- [ ] `enable_custom_domain = true` + `domain_name` + `include_www_alias`  
- [ ] `terraform apply` + ACM validation CNAMEs (grey cloud)  
- [ ] Site CNAMEs for apex/www → CloudFront (grey cloud)  
- [ ] `STOCKS_RADAR_SITE=https://yourdomain.com` on next deploy  
- [ ] AdSense site added (optional)

## Cost check

- Domain ~$10–12/yr  
- Cloudflare DNS $0  
- AWS ~$0.50–3/mo  
- **No** Google Domains / Squarespace hosting required  

Destroy AWS anytime: empty the bucket → `terraform destroy`. Domain registration stays with Cloudflare/Porkbun until you cancel renewal.
