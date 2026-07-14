#!/usr/bin/env bash
# Print lab instructions and optional setup hints.
set -euo pipefail

LAB="${1:-01}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

case "$LAB" in
  01)
    echo "=== Lab 01 — First trace ==="
    echo "Guide: $ROOT/labs/lab-01-first-trace/README.md"
    echo ""
    echo "Ensure stack is up: make stack-up"
    echo "Start Go app: docker compose -f $ROOT/examples/stack/docker-compose.yml up -d go-http"
    echo ""
    bash "$ROOT/scripts/generate-traffic.sh"
    echo ""
    echo "Open Jaeger: http://localhost:16686 (service: go-http-lab)"
    ;;
  *)
    echo "Unknown lab: $LAB"
    echo "Available: 01"
    exit 1
    ;;
esac
