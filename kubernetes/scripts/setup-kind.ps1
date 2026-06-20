# Creates a kind cluster for kubernetes practice labs.
# Usage: .\setup-kind.ps1

$ErrorActionPreference = "Stop"

$ClusterName = "practice"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigFile = Join-Path $ScriptDir "kind-config.yaml"

Write-Host "Creating kind cluster '$ClusterName'..."

if (kind get clusters 2>$null | Select-String -Pattern "^$ClusterName$") {
    Write-Host "Cluster '$ClusterName' already exists. Use teardown-kind.ps1 first or skip."
    kind export kubeconfig --name $ClusterName
    kubectl cluster-info --context "kind-$ClusterName"
    exit 0
}

kind create cluster --name $ClusterName --config $ConfigFile
kubectl cluster-info --context "kind-$ClusterName"
kubectl get nodes

Write-Host ""
Write-Host "Ready. Start with: kubernetes/labs/lab-01-first-pod/"
