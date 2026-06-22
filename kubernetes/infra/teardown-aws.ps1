# Destroys static site AWS resources when terraform state is locked.
# Usage: .\teardown-aws.ps1 -Profile pet-projects

param(
    [Parameter(Mandatory = $true)]
    [string]$Profile,

    [string]$Bucket = "pet-projects-jacob-k8s-lab",
    [string]$DistributionId = "E25C5F09VERRR1"
)

$ErrorActionPreference = "Stop"

Write-Host "Emptying s3://$Bucket ..."
aws s3 rm "s3://$Bucket" --recursive --profile $Profile 2>$null

Write-Host "Disabling CloudFront distribution $DistributionId ..."
$etag = aws cloudfront get-distribution-config --id $DistributionId --profile $Profile --query ETag --output text
$config = aws cloudfront get-distribution-config --id $DistributionId --profile $Profile --output json | ConvertFrom-Json
$config.DistributionConfig.Enabled = $false
$config.DistributionConfig | ConvertTo-Json -Depth 20 | Set-Content "$env:TEMP\cf-config.json"
aws cloudfront update-distribution --id $DistributionId --if-match $etag --distribution-config "file://$env:TEMP\cf-config.json" --profile $Profile | Out-Null

Write-Host "Waiting for distribution to disable (2-5 min)..."
do {
    Start-Sleep -Seconds 30
    $enabled = aws cloudfront get-distribution --id $DistributionId --profile $Profile --query "Distribution.Status" --output text
    Write-Host "  Status: $enabled"
} while ($enabled -ne "Deployed" -and $enabled -notmatch "Disabled")

Start-Sleep -Seconds 10
$etag = aws cloudfront get-distribution-config --id $DistributionId --profile $Profile --query ETag --output text
aws cloudfront delete-distribution --id $DistributionId --if-match $etag --profile $Profile

Write-Host "Deleting S3 bucket..."
aws s3 rb "s3://$Bucket" --force --profile $Profile

Write-Host "Done. Check AWS Console for OAC/budget leftovers. Run 'terraform state rm' later if needed."
