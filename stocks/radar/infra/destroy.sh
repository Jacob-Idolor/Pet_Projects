#!/usr/bin/env bash
# Empty the site bucket and destroy Stocks Radar AWS stack (friend-feedback teardown).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$SCRIPT_DIR/terraform"
AWS_PROFILE="${AWS_PROFILE:-pet-projects}"
export AWS_PROFILE

cd "$TF_DIR"

BUCKET="$(terraform output -raw s3_bucket_name 2>/dev/null || true)"
URL="$(terraform output -raw cloudfront_url 2>/dev/null || true)"

echo "About to DESTROY Stocks Radar AWS resources."
echo "  URL was: ${URL:-unknown}"
echo "  Bucket:  ${BUCKET:-unknown}"
echo "  Profile: $AWS_PROFILE"
read -r -p "Type destroy to continue: " confirm
if [[ "$confirm" != "destroy" ]]; then
  echo "Aborted."
  exit 1
fi

if [[ -n "$BUCKET" ]]; then
  echo "Emptying s3://$BUCKET ..."
  aws s3 rm "s3://$BUCKET" --recursive --profile "$AWS_PROFILE" || true
fi

terraform destroy -auto-approve
echo "Done. Cost should drop to ~\$0 for this stack."
