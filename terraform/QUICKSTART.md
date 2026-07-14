# Quick start

Get the interactive site running in under 2 minutes.

## Browser learning (no cloud account)

```bash
cd terraform
make site-dev
```

Open http://localhost:4321

1. Go to **Learn** → start Lesson 1
2. Try commands in the **Terraform simulator**
3. Mark progress in **Tracker**

## Local Terraform (minimal example — no AWS)

```bash
cd terraform
make lab-00

cd examples/minimal
terraform init
terraform validate
terraform plan
terraform apply   # creates a local file — safe to experiment
terraform destroy # clean up
```

## AWS example (optional — costs money)

Requires AWS credentials with appropriate permissions.

```bash
cd terraform/examples/aws-static-site
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your bucket name (globally unique)

terraform init
terraform plan    # review every resource
# terraform apply  # only when you intend to create real resources
```

## Next steps

- [LEARNING-PATH.md](LEARNING-PATH.md) — full study order
- [CORE-CONCEPTS.md](CORE-CONCEPTS.md) — concept map
- [SETUP.md](SETUP.md) — install Terraform, AWS CLI, editor plugins
