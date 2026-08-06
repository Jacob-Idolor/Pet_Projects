#!/usr/bin/env bash
# Tiered S3 sync for Stocks Radar — AWS cost + cache-hit best practice.
# Hashed assets: long cache. HTML/SEO: short. Live market JSON: max-age=60. Ops JSON: no-store.
# Preserves _private/* (personal alert cooldowns) across --delete — not public via CloudFront.
set -euo pipefail

BUCKET="${1:?Usage: sync-s3-tiered.sh <bucket> [aws-profile]}"
PROFILE_ARGS=()
if [[ -n "${2:-}" ]]; then
  PROFILE_ARGS=(--profile "$2")
elif [[ -n "${AWS_PROFILE:-}" ]]; then
  PROFILE_ARGS=(--profile "$AWS_PROFILE")
fi

DIST="${DIST_DIR:-dist}"
if [[ ! -d "$DIST" ]]; then
  echo "Missing dist dir: $DIST (run npm run build first)" >&2
  exit 1
fi

EXCLUDE_STATE=(--exclude "alert-state.json" --exclude "_private/*")

echo "→ Immutable / long-cache assets (_astro, fonts, images)…"
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  --delete \
  "${EXCLUDE_STATE[@]}" \
  --exclude "*" \
  --include "_astro/*" \
  --include "*.woff" --include "*.woff2" --include "*.ttf" \
  --include "*.png" --include "*.jpg" --include "*.jpeg" --include "*.webp" --include "*.svg" --include "*.ico" \
  --cache-control "public,max-age=31536000,immutable"

echo "→ Content-hashed datacenter JS/CSS (immutable)…"
# Matches app.abc123def0.js / style.abc123def0.css produced by hash-datacenter-assets.mjs
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  "${EXCLUDE_STATE[@]}" \
  --exclude "*" \
  --include "datacenter/*.*.js" \
  --include "datacenter/*.*.css" \
  --cache-control "public,max-age=31536000,immutable"

echo "→ Board script + remaining JS/CSS (short TTL — unhashed / fallback)…"
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  "${EXCLUDE_STATE[@]}" \
  --exclude "*" \
  --include "*.mjs" --include "*.js" --include "*.css" \
  --exclude "_astro/*" \
  --exclude "datacenter/*.*.js" \
  --exclude "datacenter/*.*.css" \
  --exclude "datacenter/app.js" \
  --exclude "datacenter/static-api.js" \
  --exclude "datacenter/map.js" \
  --exclude "datacenter/backtest.js" \
  --exclude "datacenter/datacenter.js" \
  --exclude "datacenter/rackexplorer.js" \
  --exclude "datacenter/style.css" \
  --cache-control "public,max-age=300,must-revalidate"

# Drop stale unhashed datacenter sources if previously uploaded (page only loads hashed names).
for f in app.js static-api.js map.js backtest.js datacenter.js rackexplorer.js style.css; do
  aws s3 rm "s3://$BUCKET/datacenter/$f" "${PROFILE_ARGS[@]}" 2>/dev/null || true
done

echo "→ HTML + SEO (short cache; redeploys pick up quickly)…"
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  --delete \
  "${EXCLUDE_STATE[@]}" \
  --exclude "_astro/*" \
  --exclude "quotes.json" --exclude "outlook.json" --exclude "screener.json" --exclude "dc-movers.json" --exclude "build-meta.json" --exclude "health.json" --exclude "settings.json" \
  --exclude "datacenter/news.json" \
  --exclude "*.mjs" --exclude "*.js" --exclude "*.css" \
  --exclude "*.woff" --exclude "*.woff2" --exclude "*.ttf" \
  --exclude "*.png" --exclude "*.jpg" --exclude "*.jpeg" --exclude "*.webp" --exclude "*.svg" --exclude "*.ico" \
  --cache-control "public,max-age=60,must-revalidate"

echo "→ Live market JSON (short edge TTL — CloudFront live_json policy ~60s)…"
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  "${EXCLUDE_STATE[@]}" \
  --exclude "*" \
  --include "quotes.json" --include "outlook.json" --include "screener.json" --include "dc-movers.json" --include "datacenter/news.json" --include "datacenter/campuses.json" --include "datacenter/reports.json" \
  --cache-control "public,max-age=60,must-revalidate" \
  --content-type "application/json"

echo "→ Ops JSON (never cache — health/settings/build-meta)…"
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  "${EXCLUDE_STATE[@]}" \
  --exclude "*" \
  --include "build-meta.json" --include "health.json" --include "settings.json" \
  --cache-control "public,max-age=0,no-cache,no-store,must-revalidate" \
  --content-type "application/json"

echo "✓ Tiered sync complete → s3://$BUCKET"
