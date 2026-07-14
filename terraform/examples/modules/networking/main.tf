module "vpc" {
  source = "./modules/vpc"

  name       = "${var.project_name}-${var.environment}"
  cidr_block = var.cidr_block
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "subnet_ids" {
  value = module.vpc.subnet_ids
}
