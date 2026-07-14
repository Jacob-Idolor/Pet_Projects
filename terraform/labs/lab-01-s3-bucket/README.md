# Lab 01 — S3 static site bucket

**Goal:** Plan an AWS S3 + CloudFront stack without applying (or apply in a sandbox account).

**Time:** 30 min · **Difficulty:** Beginner

## Prerequisites

- AWS credentials configured
- Globally unique bucket name chosen

## Steps

### 1. Configure variables

```bash
cd terraform/examples/aws-static-site
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
project_name     = "tf-lab-dev"
site_bucket_name = "your-unique-bucket-name-here"
aws_region       = "us-east-1"
```

### 2. Init and validate

```bash
terraform init
terraform validate
terraform fmt -check
```

### 3. Plan (read every line)

```bash
terraform plan -out=tfplan
```

Identify resources:
- `aws_s3_bucket.site`
- `aws_cloudfront_distribution.site`
- `aws_s3_bucket_public_access_block.site`

### 4. Review safeguards

Open `safeguards.tf` and note:
- Public access blocked on S3
- CloudFront OAC (not public bucket policy)
- Optional budget alert

### 5. Apply (optional)

Only if you intend to create real resources (~$1–5/mo at low traffic):

```bash
terraform apply tfplan
```

### 6. Destroy (if applied)

```bash
terraform destroy
```

## Reflection

- Why is the bucket not publicly readable?
- What does CloudFront OAC do?
- Which resources have `prevent_destroy`?

## Next

[Lab 02 — Modules](../lab-02-modules/README.md)
