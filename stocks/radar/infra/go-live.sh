#!/usr/bin/env bash
# Bootstrap GitHub secrets + vars from Terraform outputs after `terraform apply`.
# Does not apply Terraform. Prints gh commands by default.
#
# Usage:
#   cd stocks/radar
#   bash infra/go-live.sh                 # print commands
#   bash infra/go-live.sh --apply         # set secrets/vars via gh (needs gh auth)
#   bash infra/go-live.sh --apply --enable  # also STOCKS_RADAR_DEPLOY_ENABLED=true
#
# Prerequisites:
#   - terraform apply completed in infra/terraform/
#   - IAM deploy user + access keys (DEPLOY.md)
#   - gh CLI authenticated to the repo
#
# See GO_LIVE.md for the full checklist.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT/infra/terraform"
APPLY=false
ENABLE=false
REPO="${GITHUB_REPOSITORY:-Jacob-Idolor/Pet_Projects}"

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --enable) ENABLE=true ;;
    -h|--help)
      sed -n '2,18p' "$0"
      exit 0
      ;;
  esac
done

need() { command -v "$1" >/dev/null 2>&1 || { echo "Need $1 on PATH"; exit 1; }; }
need terraform
need jq

if [[ ! -f "$TF_DIR/terraform.tfstate" ]] && [[ ! -d "$TF_DIR/terraform.tfstate.d" ]]; then
  # remote state still ok if terraform can output
  :
fi

cd "$TF_DIR"
if ! OUT="$(terraform output -json 2>/dev/null)"; then
  echo "terraform output failed — run terraform apply in $TF_DIR first."
  exit 1
fi

BUCKET="$(echo "$OUT" | jq -r '.s3_bucket_name.value // empty')"
DIST_ID="$(echo "$OUT" | jq -r '.cloudfront_distribution_id.value // empty')"
CF_DOMAIN="$(echo "$OUT" | jq -r '.cloudfront_domain_name.value // empty')"
SITE_URL="$(echo "$OUT" | jq -r '.preferred_site_url.value // empty')"
DIGEST_ARN="$(echo "$OUT" | jq -r '.daily_digest_topic_arn.value // empty')"
ALERTS_ARN="$(echo "$OUT" | jq -r '.signal_alerts_topic_arn.value // empty')"
ALERT_JSON="$(echo "$OUT" | jq -c '.personal_alert_topic_arns.value // {}')"

if [[ -z "$BUCKET" || -z "$DIST_ID" || -z "$CF_DOMAIN" ]]; then
  echo "Missing core Terraform outputs (bucket / distribution / domain)."
  exit 1
fi
if [[ -z "$SITE_URL" ]]; then
  SITE_URL="https://${CF_DOMAIN}"
fi

echo "═══════════════════════════════════════════════════════════"
echo " Stocks Radar — go-live bootstrap"
echo " Repo: $REPO"
echo "═══════════════════════════════════════════════════════════"
echo
echo "From Terraform:"
echo "  bucket:      $BUCKET"
echo "  dist id:     $DIST_ID"
echo "  cf domain:   $CF_DOMAIN"
echo "  site URL:    $SITE_URL"
echo "  digest ARN:  ${DIGEST_ARN:-"(none)"}"
echo "  alerts ARN:  ${ALERTS_ARN:-"(none)"}"
echo "  alert map:   $ALERT_JSON"
echo
echo "IAM access keys are NOT in Terraform — create the deploy user first (DEPLOY.md)."
echo

CMDS=()
CMDS+=("gh secret set AWS_ACCESS_KEY_ID --repo $REPO --body \"<IAM access key id>\"")
CMDS+=("gh secret set AWS_SECRET_ACCESS_KEY --repo $REPO --body \"<IAM secret access key>\"")
CMDS+=("gh secret set AWS_REGION --repo $REPO --body \"us-west-2\"")
CMDS+=("gh secret set STOCKS_RADAR_S3_BUCKET --repo $REPO --body \"$BUCKET\"")
CMDS+=("gh secret set STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID --repo $REPO --body \"$DIST_ID\"")
CMDS+=("gh secret set STOCKS_RADAR_CLOUDFRONT_DOMAIN --repo $REPO --body \"$CF_DOMAIN\"")
if [[ -n "$DIGEST_ARN" && "$DIGEST_ARN" != "null" ]]; then
  CMDS+=("gh secret set STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN --repo $REPO --body \"$DIGEST_ARN\"")
fi
if [[ -n "$ALERTS_ARN" && "$ALERTS_ARN" != "null" ]]; then
  CMDS+=("gh secret set STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN --repo $REPO --body \"$ALERTS_ARN\"")
fi
CMDS+=("gh secret set STOCKS_RADAR_ALERT_TOPICS --repo $REPO --body '$ALERT_JSON'")
CMDS+=("gh variable set STOCKS_RADAR_SITE --repo $REPO --body \"$SITE_URL\"")
CMDS+=("gh variable set STOCKS_RADAR_DEPLOY_ENABLED --repo $REPO --body \"false\"")

echo "── Commands (review, then run) ──"
echo
for c in "${CMDS[@]}"; do
  echo "$c"
done
echo
echo "# After secrets + SNS confirms + preflight:"
echo "npm run go-live:preflight -- --strict"
echo "gh variable set STOCKS_RADAR_DEPLOY_ENABLED --repo $REPO --body \"true\""
echo "gh workflow run \"Stocks Radar — deploy\" --repo $REPO"
echo

if [[ "$APPLY" != true ]]; then
  exit 0
fi

need gh
echo "── Applying via gh ──"

if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Set env AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to push IAM secrets."
  echo "Other secrets from Terraform will still be set."
  SKIP_IAM=true
else
  SKIP_IAM=false
fi

if [[ "$SKIP_IAM" == false ]]; then
  gh secret set AWS_ACCESS_KEY_ID --repo "$REPO" --body "$AWS_ACCESS_KEY_ID"
  gh secret set AWS_SECRET_ACCESS_KEY --repo "$REPO" --body "$AWS_SECRET_ACCESS_KEY"
  gh secret set AWS_REGION --repo "$REPO" --body "${AWS_REGION:-us-west-2}"
fi

gh secret set STOCKS_RADAR_S3_BUCKET --repo "$REPO" --body "$BUCKET"
gh secret set STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID --repo "$REPO" --body "$DIST_ID"
gh secret set STOCKS_RADAR_CLOUDFRONT_DOMAIN --repo "$REPO" --body "$CF_DOMAIN"

if [[ -n "$DIGEST_ARN" && "$DIGEST_ARN" != "null" ]]; then
  gh secret set STOCKS_RADAR_DIGEST_SNS_TOPIC_ARN --repo "$REPO" --body "$DIGEST_ARN"
fi
if [[ -n "$ALERTS_ARN" && "$ALERTS_ARN" != "null" ]]; then
  gh secret set STOCKS_RADAR_ALERTS_SNS_TOPIC_ARN --repo "$REPO" --body "$ALERTS_ARN"
fi
gh secret set STOCKS_RADAR_ALERT_TOPICS --repo "$REPO" --body "$ALERT_JSON"
gh variable set STOCKS_RADAR_SITE --repo "$REPO" --body "$SITE_URL"

if [[ "$ENABLE" == true ]]; then
  gh variable set STOCKS_RADAR_DEPLOY_ENABLED --repo "$REPO" --body "true"
  echo "STOCKS_RADAR_DEPLOY_ENABLED=true"
else
  gh variable set STOCKS_RADAR_DEPLOY_ENABLED --repo "$REPO" --body "false"
  echo "STOCKS_RADAR_DEPLOY_ENABLED left false — re-run with --enable when ready"
fi

echo "Done. Confirm SNS emails, run preflight, then enable deploy."
