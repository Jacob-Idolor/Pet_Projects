# Redeploy Stocks Radar (S3 + CloudFront) after destroy — Windows PowerShell
# Run from anywhere:
#   powershell -File stocks/radar/infra/redeploy.ps1

$ErrorActionPreference = "Stop"
$TF = Join-Path $PSScriptRoot "terraform"
$RADAR = Resolve-Path (Join-Path $PSScriptRoot "..")
$ProfileName = if ($env:AWS_PROFILE) { $env:AWS_PROFILE } else { "pet-projects" }
$env:AWS_PROFILE = $ProfileName

Write-Host "==> terraform apply ($TF)"
Push-Location $TF
try {
  terraform init -input=false
  terraform apply -auto-approve
  $Bucket = terraform output -raw s3_bucket_name
  $DistId = terraform output -raw cloudfront_distribution_id
  $Url = terraform output -raw cloudfront_url
  $CfHost = terraform output -raw cloudfront_domain_name
} finally {
  Pop-Location
}

Write-Host "==> build + sync to s3://$Bucket"
Push-Location $RADAR
try {
  $env:STOCKS_RADAR_BASE = "/"
  $env:STOCKS_RADAR_SITE = $Url
  $env:DEPLOY_PROVIDER = "manual"
  $env:DEPLOY_TIME = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  npm ci
  npm run build
  aws s3 sync dist "s3://$Bucket" --delete --profile $ProfileName --exclude "alert-state.json" --exclude "_private/*"
  # Prefer bash tiered sync when available (Git Bash / WSL):
  #   bash ./infra/sync-s3-tiered.sh $Bucket $ProfileName
  aws cloudfront create-invalidation --distribution-id $DistId --paths "/" "/index.html" "/404.html" "/quotes.json" "/build-meta.json" "/ads.txt" "/robots.txt" "/sitemap.xml" "/watchlist-board.mjs" --profile $ProfileName | Out-Null
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Live: $Url"
Write-Host "GitHub secrets to update:"
Write-Host "  STOCKS_RADAR_S3_BUCKET=$Bucket"
Write-Host "  STOCKS_RADAR_CLOUDFRONT_DISTRIBUTION_ID=$DistId"
Write-Host "  STOCKS_RADAR_CLOUDFRONT_DOMAIN=$CfHost"
Write-Host "Custom domain next: see DOMAIN.md (Cloudflare Free DNS)."
