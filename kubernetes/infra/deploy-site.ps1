param(
    [Parameter(Mandatory = $true)]
    [string]$Profile,

    [string]$SitePath = "$PSScriptRoot\..\site",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$TerraformDir = Join-Path $PSScriptRoot "terraform"

if (-not (Test-Path $TerraformDir)) {
    throw "Terraform directory not found: $TerraformDir"
}

Push-Location $TerraformDir
try {
    $Bucket = terraform output -raw s3_bucket_name 2>$null
    $DistributionId = terraform output -raw cloudfront_distribution_id 2>$null
    $Url = terraform output -raw cloudfront_url 2>$null
} finally {
    Pop-Location
}

if (-not $Bucket -or -not $DistributionId) {
    throw "Terraform outputs missing. Run 'terraform apply' in $TerraformDir first."
}

if (-not $SkipBuild) {
    Write-Host "Building site..."
    Push-Location $SitePath
    try {
        if (-not (Test-Path "node_modules")) {
            npm install
        }
        npm run build
    } finally {
        Pop-Location
    }
}

$DistPath = Join-Path $SitePath "dist"
if (-not (Test-Path $DistPath)) {
    throw "Build output not found: $DistPath"
}

Write-Host "Syncing to s3://$Bucket ..."
aws s3 sync $DistPath "s3://$Bucket" --delete --profile $Profile

Write-Host "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*" --profile $Profile | Out-Null

Write-Host "Done. Site: $Url"
