#!/usr/bin/env bash
set -euo pipefail
CLUSTER_NAME=practice
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if kind get clusters 2>/dev/null | grep -qx "$CLUSTER_NAME"; then
  echo "Cluster '$CLUSTER_NAME' already exists."
  kind export kubeconfig --name "$CLUSTER_NAME"
  kubectl cluster-info --context "kind-$CLUSTER_NAME"
  exit 0
fi

kind create cluster --name "$CLUSTER_NAME" --config "$SCRIPT_DIR/kind-config.yaml"
kubectl cluster-info --context "kind-$CLUSTER_NAME"
kubectl get nodes
echo "Ready. Start with: kubernetes/labs/lab-01-first-pod/"
