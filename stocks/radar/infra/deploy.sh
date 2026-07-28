#!/usr/bin/env bash
# Build Stocks Radar and sync to S3 + CloudFront (after terraform apply).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RADAR_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TF_DIR="$SCRIPT_DIR/terraform"

AWS_PROFILE="${AWS_PROFILE:-pet-projects}"
export AWS_PROFILE

if [[ ! -d "$TF_DIR" ]]; then
  echo "Terraform dir not found: $TF_DIR" >&2
  exit 1
fi

BUCKET="$(terraform -chdir="$TF_DIR" output -raw s3_bucket_name)"
DIST_ID="$(terraform -chdir="$TF_DIR" output -raw cloudfront_distribution_id)"
URL="$(terraform -chdir="$TF_DIR" output -raw cloudfront_url)"

if [[ -z "$BUCKET" || -z "$DIST_ID" ]]; then
  echo "Missing terraform outputs. Run: cd stocks/radar/infra/terraform && terraform apply" >&2
  exit 1
fi

echo "Building site (CloudFront URL: $URL)..."
cd "$RADAR_DIR"
export STOCKS_RADAR_BASE="/"
export STOCKS_RADAR_SITE="$URL"
export DEPLOY_PROVIDER="manual"
export DEPLOY_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

npm ci
npm run build

echo "Syncing to s3://$BUCKET (tiered cache headers)..."
DIST_DIR=dist "$SCRIPT_DIR/sync-s3-tiered.sh" "$BUCKET" "$AWS_PROFILE"

echo "Invalidating CloudFront (HTML + live JSON only — keep hashed assets cached)..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/" "/index.html" "/404.html" "/quotes.json" "/screener.json" \
         "/datacenter.html" "/build-meta.json" \
         "/health.json" "/settings.json" \
         "/ads.txt" "/robots.txt" "/sitemap.xml" "/watchlist-board.mjs" \
  --profile "$AWS_PROFILE" \
  --output text >/dev/null

echo "Done. Share with friends: $URL"
