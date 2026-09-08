terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }
  }
}

provider "cloudflare" {
  # The Cloudflare provider reads CLOUDFLARE_API_TOKEN from the environment.
  # Keep credentials out of terraform.tfvars and Terraform state inputs.
}
