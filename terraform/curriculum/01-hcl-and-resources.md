# 01 — HCL and resources

## Resource block

```hcl
resource "local_file" "hello" {
  filename = "hello.txt"
  content  = "Hello!"
}
```

- First string: **provider resource type**
- Second string: **local name** (address = `local_file.hello`)

## Variables and outputs

```hcl
variable "environment" {
  type        = string
  description = "Deployment environment"
}

output "file_path" {
  value = local_file.hello.filename
}
```

## Providers

Declared in `terraform` block `required_providers`. Downloaded by `terraform init`.
