#!/usr/bin/env bash
# Build sample app, run it, and verify health — local Docker practice.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/../docker/sample-app"
IMAGE="practice-app:1.0"
CONTAINER="practice"

echo "=== Docker Lab — sample app ==="
echo ""

command -v docker >/dev/null || { echo "Docker not found. Install Docker first." >&2; exit 1; }

echo "Building $IMAGE ..."
docker build -t "$IMAGE" "$APP_DIR"

docker rm -f "$CONTAINER" 2>/dev/null || true

echo ""
echo "Running container on localhost:8080 ..."
docker run -d -p 8080:8080 --name "$CONTAINER" "$IMAGE"

sleep 1

echo ""
echo "Health check:"
curl -sf "http://localhost:8080/health" && echo "" || echo "Health check failed — run: docker logs $CONTAINER"

echo ""
docker ps --filter "name=$CONTAINER"
echo ""
cat <<EOF
Commands to try:
  docker logs $CONTAINER
  docker inspect $CONTAINER --format='{{.State.Status}}'
  docker history $IMAGE
  docker stop $CONTAINER && docker rm $CONTAINER

Next: labs/lab-00-docker/README.md
Load into kind: kind load docker-image $IMAGE --name practice
EOF
