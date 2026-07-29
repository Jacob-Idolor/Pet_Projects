# Apply live JSON edge caching when local AWS keys work (profile: pet-projects).
# 1) Create a new access key for the deploy IAM user in AWS Console
# 2) aws configure --profile pet-projects
# 3) pwsh stocks/radar/infra/enable-live-json-cache.ps1

$ErrorActionPreference = "Stop"
$ProfileName = if ($env:AWS_PROFILE) { $env:AWS_PROFILE } else { "pet-projects" }
$env:AWS_PROFILE = $ProfileName

$DistId = "E2NRSILRGBNISE"
$CachingOptimized = "658327ea-f89d-4fab-a63d-7e88639e58f6"
$CachingDisabled = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
$SecurityHeaders = "67f7725c-6f97-4210-82d7-5512b31e9d03"
$Live = @("/quotes.json", "/outlook.json", "/screener.json", "/dc-movers.json", "/datacenter/news.json")
$Ops = @("/build-meta.json", "/health.json", "/settings.json")

Write-Host "==> STS ($ProfileName)"
aws sts get-caller-identity --profile $ProfileName | Out-Host

$raw = aws cloudfront get-distribution-config --id $DistId --profile $ProfileName --output json | ConvertFrom-Json
$etag = $raw.ETag
$cfg = $raw.DistributionConfig
$originId = $cfg.Origins.Items[0].Id

function New-Behavior([string]$path, [string]$cachePolicyId) {
  [pscustomobject]@{
    PathPattern = $path
    TargetOriginId = $originId
    ViewerProtocolPolicy = "redirect-to-https"
    AllowedMethods = @{
      Quantity = 3
      Items = @("HEAD", "GET", "OPTIONS")
      CachedMethods = @{ Quantity = 2; Items = @("HEAD", "GET") }
    }
    Compress = $true
    CachePolicyId = $cachePolicyId
    ResponseHeadersPolicyId = $SecurityHeaders
    SmoothStreaming = $false
    FieldLevelEncryptionId = ""
    LambdaFunctionAssociations = @{ Quantity = 0 }
    FunctionAssociations = @{ Quantity = 0 }
    GrpcConfig = @{ Enabled = $false }
  }
}

$existing = @()
if ($cfg.CacheBehaviors -and $cfg.CacheBehaviors.Items) {
  $existing = @($cfg.CacheBehaviors.Items)
}
$byPath = @{}
foreach ($b in $existing) { $byPath[$b.PathPattern] = $b }

$kept = @($existing | Where-Object { $Live -notcontains $_.PathPattern -and $Ops -notcontains $_.PathPattern })
$newItems = [System.Collections.Generic.List[object]]::new()
foreach ($b in $kept) { $newItems.Add($b) }

foreach ($path in ($Live | Sort-Object)) {
  $b = if ($byPath.ContainsKey($path)) { $byPath[$path] } else { New-Behavior $path $CachingOptimized }
  $b.CachePolicyId = $CachingOptimized
  $b.PathPattern = $path
  $newItems.Add($b)
}
foreach ($path in ($Ops | Sort-Object)) {
  $b = if ($byPath.ContainsKey($path)) { $byPath[$path] } else { New-Behavior $path $CachingDisabled }
  $b.CachePolicyId = $CachingDisabled
  $b.PathPattern = $path
  $newItems.Add($b)
}

$cfg.CacheBehaviors = @{ Quantity = $newItems.Count; Items = @($newItems) }

$tmp = Join-Path $env:TEMP ("cf-dist-" + [guid]::NewGuid().ToString() + ".json")
# UTF-8 no BOM — AWS CLI rejects PowerShell's default BOM on file:// JSON
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($tmp, ($cfg | ConvertTo-Json -Depth 40 -Compress), $utf8NoBom)

Write-Host "==> Updating distribution $DistId (live JSON → CachingOptimized)"
aws cloudfront update-distribution --id $DistId --if-match $etag --distribution-config "file://$tmp" --profile $ProfileName | Out-Null
if ($LASTEXITCODE -ne 0) { throw "update-distribution failed" }
Remove-Item $tmp -Force

Write-Host "==> Waiting for Deployed…"
for ($i = 1; $i -le 60; $i++) {
  $status = aws cloudfront get-distribution --id $DistId --profile $ProfileName --query "Distribution.Status" --output text
  Write-Host "  [$i] $status"
  if ($status -eq "Deployed") { break }
  Start-Sleep -Seconds 15
}

Write-Host "==> Verify"
curl.exe -sI "https://stockswatch.cc/quotes.json" | Select-String -Pattern "cache-control|x-cache|age"
Start-Sleep -Seconds 2
curl.exe -sI "https://stockswatch.cc/quotes.json" | Select-String -Pattern "cache-control|x-cache|age"
Write-Host "Done. Second request should show X-Cache: Hit from cloudfront"
