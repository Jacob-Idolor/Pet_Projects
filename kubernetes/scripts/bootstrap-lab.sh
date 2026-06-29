#!/usr/bin/env bash
# After kind cluster is up — verify connectivity and show next steps.
set -euo pipefail

CONTEXT="kind-practice"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "=== Local Kubernetes Lab ==="
echo ""

if ! kubectl config get-contexts -o name 2>/dev/null | grep -qx "$CONTEXT"; then
  echo "Context '$CONTEXT' not found. Run: make local-up" >&2
  exit 1
fi

kubectl config use-context "$CONTEXT"
kubectl cluster-info
echo ""
kubectl get nodes
echo ""

cat <<EOF
Cluster is ready. Recommended learning path:

  1. Browser (no install):  cd $REPO_ROOT && make site-dev
     Open http://localhost:4321 — modules, quizzes, kubectl simulator

  2. Real kubectl practice:  start Lab 01
     cd $REPO_ROOT/labs/lab-01-first-pod
     Follow README.md

  3. Command drills:         $REPO_ROOT/drills/kubectl-commands.md

  4. Track progress:         edit $REPO_ROOT/PROGRESS.md

Teardown when done:  make local-down
EOF
