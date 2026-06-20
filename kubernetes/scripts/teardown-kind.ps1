# Deletes the practice kind cluster.
# Usage: .\teardown-kind.ps1

$ErrorActionPreference = "Stop"
$ClusterName = "practice"

Write-Host "Deleting kind cluster '$ClusterName'..."
kind delete cluster --name $ClusterName
Write-Host "Done."
