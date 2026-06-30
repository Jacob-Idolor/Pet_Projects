#!/usr/bin/env bash
# Build Astro site and deploy to S3 + CloudFront.
# Usage: AWS_PROFILE=pet-projects ./deploy-site.sh
# Or from kubernetes/: make aws-deploy
#
# Env:
#   SKIP_TESTS=1     Skip npm test:ci before deploy
#   SKIP_INVALIDATION=1  Never invalidate CloudFront (not recommended)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"
SITE_DIR="$SCRIPT_DIR/../site"
PROFILE="${AWS_PROFILE:-pet-projects}"

if [[ ! -d "$TERRAFORM_DIR" ]]; then
  echo "Terraform directory not found: $TERRAFORM_DIR" >&2
  exit 1
fi

pushd "$TERRAFORM_DIR" >/dev/null
BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || true)
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || true)
URL=$(terraform output -raw cloudfront_url 2>/dev/null || true)
popd >/dev/null

if [[ -z "$BUCKET" || -z "$DISTRIBUTION_ID" ]]; then
  echo "Terraform outputs missing. Run 'make aws-apply' in kubernetes/ first." >&2
  exit 1
fi

pushd "$SITE_DIR" >/dev/null
if [[ ! -d node_modules ]]; then
  npm install
fi

if [[ "${SKIP_TESTS:-}" != "1" ]]; then
  echo "Running regression tests (test:ci)..."
  npm run test:ci
else
  echo "SKIP_TESTS=1 — building without test suite"
  npm run build
fi
popd >/dev/null

DIST_PATH="$SITE_DIR/dist"
if [[ ! -d "$DIST_PATH" ]]; then
  echo "Build output not found: $DIST_PATH" >&2
  exit 1
fi

echo "Syncing to s3://$BUCKET ..."
SYNC_OUTPUT=$(aws s3 sync "$DIST_PATH" "s3://$BUCKET" --delete --profile "$PROFILE" 2>&1)
echo "$SYNC_OUTPUT"

CHANGED=false
if echo "$SYNC_OUTPUT" | grep -qE 'upload:|delete:'; then
  CHANGED=true
fi

if [[ "$CHANGED" == "true" && "${SKIP_INVALIDATION:-}" != "1" ]]; then
  echo "Content changed — invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --profile "$PROFILE" >/dev/null
elif [[ "$CHANGED" == "false" ]]; then
  echo "No changes detected — skipping CloudFront invalidation (saves cost)."
else
  echo "SKIP_INVALIDATION=1 — cache not invalidated."
fi

echo "Done. Site: $URL"
