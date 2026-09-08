# StocksWatch NBIS infrastructure

This stack keeps the production site as a static Cloudflare Pages project. Terraform owns the Pages project, custom-domain attachment, and DNS CNAME. GitHub Actions owns the daily data refresh and direct upload of `radar/dist`.

## First apply

1. Create a Cloudflare API token with `Account:Cloudflare Pages:Edit` and `Zone:DNS:Edit` for the `stockswatch.cc` zone.
2. Export `CLOUDFLARE_API_TOKEN`, copy `terraform.tfvars.example` to a local `terraform.tfvars`, and fill in the account ID.
3. Run `terraform init`, `terraform fmt -check`, `terraform validate`, then `terraform plan` and `terraform apply` from this directory.
4. Add the same token as the GitHub Actions secret `CLOUDFLARE_API_TOKEN`, plus `CLOUDFLARE_ACCOUNT_ID` and `SEC_CONTACT_EMAIL`.

If an existing DNS record already owns the hostname, import it before applying or set `manage_dns_record = false` and manage that record separately. Cloudflare Pages custom-domain verification does not replace DNS ownership automatically.

## Cost posture

The site has no always-on server, database, or container. Static asset delivery stays on the Pages free tier; the daily workflow consumes one scheduled GitHub Actions run and the public data providers are queried only during that run. Add a paid data provider only after traffic or revenue justifies it.
