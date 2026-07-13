# Lab 00 — First init & validate

**Goal:** Run your first Terraform workflow on a safe, local-only example.

**Time:** 20 min · **Difficulty:** Beginner

## Prerequisites

- Terraform installed (`terraform version`)
- No cloud account required

## Steps

### 1. Enter the example

```bash
cd terraform/examples/minimal
ls -la
```

You should see `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`.

### 2. Initialize

```bash
terraform init
```

Expected: providers downloaded, `.terraform/` directory created.

### 3. Validate syntax

```bash
terraform validate
```

Expected: `Success! The configuration is valid.`

### 4. Format check

```bash
terraform fmt -check
terraform fmt    # fix formatting if needed
```

### 5. Plan

```bash
terraform plan
```

Read the output:
- `+` means create
- Note the resource address: `local_file.hello`

### 6. Apply

```bash
terraform apply
```

Type `yes` when prompted. A file `hello.txt` appears in the directory.

### 7. Inspect state

```bash
terraform show
terraform state list
terraform output message
```

### 8. Clean up

```bash
terraform destroy
```

## Reflection

- What did `terraform init` download?
- Where is state stored after apply? (`terraform.tfstate`)
- Why is `local_file` safe for learning?

## Next

[Lab 01 — S3 bucket](../lab-01-s3-bucket/README.md) or browser [Lesson 3](/modules/t3-workflow.html).
