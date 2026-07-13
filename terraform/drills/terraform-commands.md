# Terraform command drill

Practice until you can run these without looking at notes.

## Core workflow

```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan
terraform apply
terraform destroy
```

## Inspection

```bash
terraform show
terraform show -json | jq '.values.root_module.resources'
terraform state list
terraform state show local_file.hello
terraform output
terraform output -json
```

## Workspaces

```bash
terraform workspace list
terraform workspace new dev
terraform workspace select production
terraform workspace show
```

## State operations

```bash
terraform import aws_s3_bucket.site bucket-name
terraform state mv old_address new_address
terraform state rm aws_instance.orphan
terraform refresh   # sync state with real world (prefer plan)
```

## Locking

```bash
terraform force-unlock LOCK_ID
```

## Debugging

```bash
TF_LOG=DEBUG terraform plan
terraform providers
terraform version
```

## Timed drill (20 min)

1. init → validate → plan → apply (minimal example)
2. state list + output
3. workspace new + plan
4. destroy
5. Repeat from memory — target under 15 min by attempt 3
