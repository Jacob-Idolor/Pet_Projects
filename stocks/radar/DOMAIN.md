# Domain — cheapest path (Cloudflare / Porkbun + AWS)

Host the site on **S3 + CloudFront** (this repo). Buy a domain elsewhere — **do not** use Google/Squarespace as a host.

**Live domain for this project:** `stockswatch.cc` (Cloudflare Registrar + Free DNS).

| Need | Pick | Cost |
|------|------|------|
| Register name | [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) or [Porkbun](https://porkbun.com/) | ~$10–12/yr (.com / .cc) |
| DNS | **Cloudflare Free** | $0 |
| Site hosting | AWS Terraform in this folder | ~$0.50–3/mo |
| Route53 | Skip (`dns_management = "external"`) | Saves ~$0.50/mo |

You can apply Terraform and share the `*.cloudfront.net` URL **before** buying a domain. Flip `enable_custom_domain` only after checkout.

## 1. Buy the domain

1. Search your name on Porkbun or Cloudflare Registrar.
2. Prefer a short **`.com`** for AdSense + friend trust. Cheaper TLDs (like `.cc`) work fine for a tools site.
3. Complete checkout. If you buy on Porkbun, set **nameservers to Cloudflare** next (or buy on Cloudflare so NS are already theirs).

## 2. Cloudflare Free DNS

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → Add site → Free plan.
2. Copy the two Cloudflare nameservers into your registrar (if not already Cloudflare).
3. Wait until Cloudflare shows the zone as **Active**.

## 3. Wire Terraform

For **stockswatch.cc**, `terraform.tfvars` should look like:

```hcl
enable_custom_domain = true
domain_name          = "stockswatch.cc"
dns_management       = "external"         # cheapest — no Route53
include_www_alias    = true               # ACM + CloudFront also cover www
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
   - Local / CI: `STOCKS_RADAR_SITE=https://stockswatch.cc`
2. Redeploy so `robots.txt`, `sitemap.xml`, and `ads.txt` use the custom domain.
3. In AdSense → add **stockswatch.cc** (see [ADSENSE.md](ADSENSE.md)).

GitHub secret `STOCKS_RADAR_CLOUDFRONT_DOMAIN` can stay the distribution hostname for invalidation; preferred public URL is the custom domain via `STOCKS_RADAR_SITE`.

## 5. Checklist after purchase

- [x] Domain bought + Cloudflare zone Active (`stockswatch.cc`)
- [ ] `enable_custom_domain = true` + `domain_name` + `include_www_alias` (in `terraform.tfvars`)
- [ ] `terraform apply` + ACM validation CNAMEs (grey cloud)
- [ ] Site CNAMEs for apex/www → CloudFront (grey cloud)
- [ ] `STOCKS_RADAR_SITE=https://stockswatch.cc` on next deploy
- [ ] AdSense site added (optional)

## Cost check

- Domain ~$10–12/yr
- Cloudflare DNS $0
- AWS ~$0.50–3/mo
- **No** Google Domains / Squarespace hosting required

Destroy AWS anytime: empty the bucket → `terraform destroy`. Domain registration stays with Cloudflare/Porkbun until you cancel renewal.
