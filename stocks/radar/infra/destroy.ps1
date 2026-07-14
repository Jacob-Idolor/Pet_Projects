# Empty the site bucket and destroy Stocks Radar AWS stack (friend-feedback teardown).
$ErrorActionPreference = "Stop"
$AwsProfile = if ($env:AWS_PROFILE) { $env:AWS_PROFILE } else { "pet-projects" }
$TfDir = Join-Path $PSScriptRoot "terraform"
Set-Location $TfDir

$bucket = $null
$url = $null
try { $bucket = terraform output -raw s3_bucket_name 2>$null } catch {}
try { $url = terraform output -raw cloudfront_url 2>$null } catch {}

Write-Host "About to DESTROY Stocks Radar AWS resources."
Write-Host "  URL was: $(if ($url) { $url } else { 'unknown' })"
Write-Host "  Bucket:  $(if ($bucket) { $bucket } else { 'unknown' })"
Write-Host "  Profile: $AwsProfile"
$confirm = Read-Host "Type destroy to continue"
if ($confirm -ne "destroy") {
  Write-Host "Aborted."
  exit 1
}

if ($bucket) {
  Write-Host "Emptying s3://$bucket ..."
  aws s3 rm "s3://$bucket" --recursive --profile $AwsProfile
}

terraform destroy -auto-approve
Write-Host "Done. Cost should drop to ~`$0 for this stack."
