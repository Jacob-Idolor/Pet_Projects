# StocksWatch NBIS infrastructure

This stack keeps the production site as a static Cloudflare Pages project. Terraform owns the Pages project and custom-domain attachment. Cloudflare Pages owns the custom-domain CNAME for the Cloudflare-managed zone; `manage_dns_record` is false by default to avoid double-managing that record. GitHub Actions owns the daily data refresh and direct upload of `radar/dist`.

## First apply

1. Create a narrowly scoped Cloudflare API token with `Account:Cloudflare Pages:Edit` for the account containing `stockswatch.cc`. If you intentionally set `manage_dns_record = true`, also grant `Zone:Zone:Read` and `Zone:DNS:Edit` for the zone. Do not use the global API key.
2. Export `CLOUDFLARE_API_TOKEN` in the same shell that runs Terraform, copy `terraform.tfvars.example` to a local `terraform.tfvars`, and fill in the account ID. Do not add a `cloudflare_api_token` setting to that file.
3. Run `terraform init`, `terraform fmt -check`, `terraform validate`, then `terraform plan` and `terraform apply` from this directory.
4. Add the same token as the GitHub Actions secret `CLOUDFLARE_API_TOKEN`, plus `CLOUDFLARE_ACCOUNT_ID` and `SEC_CONTACT_EMAIL`.

For a Cloudflare-managed apex zone, leave `manage_dns_record = false`: adding the Pages custom domain creates the CNAME automatically. If you deleted that record after the custom domain was attached, add it back from Cloudflare Pages using the project `pages.dev` hostname before testing the site. Only set `manage_dns_record = true` when you deliberately want Terraform to own a compatible record and have confirmed Pages will not create it as well.

The Pages project has Terraform `prevent_destroy` enabled. If you intentionally retire it, remove that guard in a reviewed change first; it is there to prevent an accidental production-site deletion.

## Cost posture

The site has no always-on server, database, or container. Static asset delivery stays on the Pages free tier; the daily workflow consumes one scheduled GitHub Actions run and the public data providers are queried only during that run. Add a paid data provider only after traffic or revenue justifies it.
