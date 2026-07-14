#!/usr/bin/env bash
# Print lab instructions and optional setup hints.
set -euo pipefail

LAB="${1:-00}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

case "$LAB" in
  00)
    echo "=== Lab 00 — First init & validate ==="
    echo "Guide: $ROOT/labs/lab-00-init/README.md"
    echo ""
    echo "  cd $ROOT/examples/minimal"
    echo "  terraform init"
    echo "  terraform validate"
    echo "  terraform plan"
    ;;
  01)
    echo "=== Lab 01 — S3 bucket stack ==="
    echo "Guide: $ROOT/labs/lab-01-s3-bucket/README.md"
    echo ""
    echo "  cd $ROOT/examples/aws-static-site"
    echo "  cp terraform.tfvars.example terraform.tfvars"
    echo "  terraform init && terraform plan"
    ;;
  02)
    echo "=== Lab 02 — Modules ==="
    echo "Guide: $ROOT/labs/lab-02-modules/README.md"
    echo ""
    echo "  cd $ROOT/examples/modules/networking"
    echo "  terraform init && terraform plan"
    ;;
  03)
    echo "=== Lab 03 — Remote state ==="
    echo "Guide: $ROOT/labs/lab-03-remote-state/README.md"
    echo "Read backend config in examples/aws-static-site/backend.tf.example"
    ;;
  04)
    echo "=== Lab 04 — Workspaces ==="
    echo "Guide: $ROOT/labs/lab-04-workspaces/README.md"
    echo "  terraform workspace list"
    echo "  terraform workspace new staging"
    ;;
  05)
    echo "=== Lab 05 — Drift & import ==="
    echo "Guide: $ROOT/labs/lab-05-drift-import/README.md"
    echo "Practice: terraform plan (shows drift) then terraform import"
    ;;
  06)
    echo "=== Lab 06 — CI plan-only ==="
    echo "Guide: $ROOT/labs/lab-06-ci-pipeline/README.md"
    echo "See: .github/workflows/terraform-validate.yml"
    ;;
  07)
    echo "=== Lab 07 — Production static site ==="
    echo "Guide: $ROOT/labs/lab-07-production/README.md"
    echo "  cd $ROOT/examples/aws-static-site"
    echo "  terraform plan  # review every resource"
    ;;
  *)
    echo "Unknown lab: $LAB (use 00-07)"
    exit 1
    ;;
esac
