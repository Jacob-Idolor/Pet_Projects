# Production checklist — StocksWatch NBIS

The application code, daily refresh workflow, Terraform configuration, dependency lockfile, and static-bundle security scan are in place. The remaining go-live work requires access to your Cloudflare and GitHub accounts.

## User actions before launch

1. In Cloudflare, confirm `stockswatch.cc` is an active zone and record the account ID.
2. Create a scoped API token with `Account:Cloudflare Pages:Edit` for the account containing `stockswatch.cc`. Add `Zone:Zone:Read` and `Zone:DNS:Edit` only if you deliberately enable Terraform DNS management. Keep the token out of files and chat.
3. From `stocks/radar/infra/terraform`, copy `terraform.tfvars.example` to `terraform.tfvars`, set the account ID, then run `terraform init`, `terraform plan`, and review the plan before `terraform apply`.
4. In GitHub repository settings, add Actions secrets named `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `SEC_CONTACT_EMAIL`.
5. Run **StocksWatch — NBIS daily refresh and deploy** manually once. Confirm the workflow succeeds and check `/`, `/health.json`, `/nbis.json`, and `/ads.txt`.
6. Leave `manage_dns_record = false` for the Cloudflare-managed apex zone; Pages custom-domain setup creates the CNAME. If you deleted that automatically created record, restore it to the project `pages.dev` hostname before testing the site.
7. Before monetization, publish a privacy policy, terms/disclaimer, and a clear data-source/market-data attribution page. Keep the existing not-financial-advice language.

## Optional monetization configuration

After AdSense approves the site and you have created manual display units, add these as GitHub **repository variables** (not secrets): `PUBLIC_ADSENSE_CLIENT`, `PUBLIC_ADSENSE_ENABLED=true`, `PUBLIC_ADSENSE_SLOT_BOARD`, `PUBLIC_ADSENSE_SLOT_FOOTER`, and optionally `PUBLIC_ADSENSE_VERIFY_META`. Add `PUBLIC_WEB3FORMS_ACCESS_KEY` only if you want group suggestions delivered by email. The workflow passes these values into the build; leaving them unset keeps live ads and external email delivery off.

## Current scope and deliberate limits

- The public app is read-only. It does not place trades or store brokerage credentials.
- NBIS is the primary daily product. The old watchlist and data-center surfaces remain archived and are not the reliability dependency for `/`.
- The build refuses a production NBIS refresh without an SEC contact identity and fails schema validation on malformed data.
- Terraform protects the Pages project with `prevent_destroy`; intentional retirement requires a reviewed change.
- No Cloudflare account mutation, Terraform apply, GitHub secret write, deploy, or push was performed during this audit.

## Operating cadence after launch

- Check the daily workflow and `/health.json` after the first few scheduled runs.
- Rotate the Cloudflare token if it is ever exposed, and keep its permissions limited to this site.
- Review provider terms, market-data licensing, AdSense policy, and disclosure requirements before adding paid products or automated recommendations.
- Add paid data, alerts, accounts, or payments only after traffic validates the product; those features require a separate threat model.
