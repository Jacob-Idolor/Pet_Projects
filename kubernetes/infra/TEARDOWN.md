@'
# Manual AWS teardown (use if terraform destroy fails due to state lock)

Close other terminals/IDE tabs running terraform first, then:

```powershell
cd kubernetes\infra\terraform
terraform destroy
```

If still locked, delete stale lock (only when no terraform is running):

```powershell
Remove-Item .terraform.tfstate.lock.info -ErrorAction SilentlyContinue
terraform destroy
```

## Nuclear option — AWS CLI (same result)

Replace IDs from your last deploy:

```powershell
$Profile = "pet-projects"
$Bucket = "pet-projects-jacob-k8s-lab"
$DistId = "E25C5F09VERRR1"

aws s3 rm "s3://$Bucket" --recursive --profile $Profile
aws cloudfront delete-distribution --id $DistId --if-match (aws cloudfront get-distribution-config --id $DistId --profile $Profile --query ETag --output text) --profile $Profile
# Wait until distribution Disabled, then delete OAC and bucket via console or terraform after state unlocks
```

Verify nothing left: AWS Console → S3, CloudFront — should be empty.

'@ | Out-File -Encoding utf8 e:\Pet_Projects\Pet_Projects\kubernetes\infra\TEARDOWN.md
