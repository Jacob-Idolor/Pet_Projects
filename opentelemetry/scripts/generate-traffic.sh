#!/usr/bin/env bash
# Hit sample app endpoints to generate traces and metrics.
set -euo pipefail

BASE="${1:-http://localhost:8080}"

echo "Generating traffic against $BASE ..."

curl -sf "$BASE/health" > /dev/null && echo "  GET /health OK"
curl -sf "$BASE/" > /dev/null && echo "  GET / OK"
curl -sf "$BASE/work" > /dev/null && echo "  GET /work OK"
curl -sf "$BASE/chain" > /dev/null && echo "  GET /chain OK"
curl -sf "$BASE/error" > /dev/null || echo "  GET /error (expected 500)"

echo "Done — check Jaeger at http://localhost:16686"
