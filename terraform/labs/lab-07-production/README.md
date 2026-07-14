# Lab 07 — Production static site deploy

**Goal:** Deploy a production-ready S3 + CloudFront stack with all safeguards.

**Time:** 45 min · **Difficulty:** Advanced

## Prerequisites

- AWS account with deploy permissions
- Reviewed `examples/aws-static-site/safeguards.tf`

## Steps

### 1. Pre-flight

```bash
cd terraform/examples/aws-static-site
cp terraform.tfvars.example terraform.tfvars
# Set unique bucket name, budget email, project name
terraform init
terraform plan -out=prod.tfplan
```

### 2. Review plan checklist

- [ ] S3 public access blocked
- [ ] Encryption enabled
- [ ] CloudFront HTTPS redirect
- [ ] No open security groups (static site — no compute)
- [ ] Budget alert configured (if enabled)

### 3. Apply

```bash
terraform apply prod.tfplan
```

### 4. Deploy content

Sync static files to the bucket (pattern from kubernetes/stocks labs):

```bash
aws s3 sync ../site/dist/ s3://YOUR_BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

### 5. Teardown

```bash
terraform destroy
```

Empty the S3 bucket first if `force_destroy` is false.

## Production patterns demonstrated

| Pattern | File |
|---------|------|
| OAC instead of public bucket | `main.tf` |
| Lifecycle rules | `main.tf` |
| `prevent_destroy` on critical resources | `safeguards.tf` |
| Budget alerts | `safeguards.tf` |
| Provider version pinning | `versions.tf` |

## Certificate

Complete all labs and browser scenarios, then claim your certificate at `/certificate.html`.
