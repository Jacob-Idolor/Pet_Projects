#!/usr/bin/env bash
# Tiered S3 sync for Stocks Radar — AWS cost + cache-hit best practice.
# Hashed assets: long cache. HTML/SEO: short. Live JSON: no-cache.
# Preserves alert-state.json (personal alert cooldowns) across --delete.
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

EXCLUDE_STATE=(--exclude "alert-state.json")

echo "→ Immutable / long-cache assets (_astro, fonts, images)…"
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  --delete \
  "${EXCLUDE_STATE[@]}" \
  --exclude "*" \
  --include "_astro/*" \
  --include "*.woff" --include "*.woff2" --include "*.ttf" \
  --include "*.png" --include "*.jpg" --include "*.jpeg" --include "*.webp" --include "*.svg" --include "*.ico" \
  --cache-control "public,max-age=31536000,immutable"

echo "→ Board script + static JS/CSS (hashed or rarely changed)…"
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  "${EXCLUDE_STATE[@]}" \
  --exclude "*" \
  --include "*.mjs" --include "*.js" --include "*.css" \
  --exclude "_astro/*" \
  --cache-control "public,max-age=86400"

echo "→ HTML + SEO (short cache; redeploys pick up quickly)…"
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  --delete \
  "${EXCLUDE_STATE[@]}" \
  --exclude "_astro/*" \
  --exclude "quotes.json" --exclude "build-meta.json" --exclude "health.json" --exclude "settings.json" \
  --exclude "*.mjs" --exclude "*.js" --exclude "*.css" \
  --exclude "*.woff" --exclude "*.woff2" --exclude "*.ttf" \
  --exclude "*.png" --exclude "*.jpg" --exclude "*.jpeg" --exclude "*.webp" --exclude "*.svg" --exclude "*.ico" \
  --cache-control "public,max-age=60,must-revalidate"

echo "→ Live data (never cache at edge via object headers)…"
aws s3 sync "$DIST" "s3://$BUCKET" "${PROFILE_ARGS[@]}" \
  "${EXCLUDE_STATE[@]}" \
  --exclude "*" \
  --include "quotes.json" --include "build-meta.json" --include "health.json" --include "settings.json" \
  --cache-control "public,max-age=0,no-cache,no-store,must-revalidate" \
  --content-type "application/json"

echo "✓ Tiered sync complete → s3://$BUCKET"
