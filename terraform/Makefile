# Terraform Learning Lab — common commands
# Run from terraform/ : make help

.PHONY: help site-dev site-build site-preview check-tools validate-all lab-00 lab-01 lab-02 lab-03 lab-04 lab-05 lab-06 lab-07

SITE_DIR    := site
SCRIPTS_DIR := scripts
EXAMPLES    := examples
CURDIR      := $(shell pwd)

help:
	@echo "Terraform Learning Lab"
	@echo ""
	@echo "  Website (browser learning):"
	@echo "    make site-dev       Start Astro dev server (http://localhost:4321)"
	@echo "    make site-build     Build static site to site/dist/"
	@echo "    make site-preview   Preview production build locally"
	@echo ""
	@echo "  Labs:"
	@echo "    make lab-00         First init + validate"
	@echo "    make lab-01         S3 bucket stack (local state)"
	@echo "    make lab-02         Modules and composition"
	@echo "    make lab-03         Remote state backend"
	@echo "    make lab-04         Workspaces and environments"
	@echo "    make lab-05         Drift detection and import"
	@echo "    make lab-06         CI plan-only pipeline"
	@echo "    make lab-07         Production static site deploy"
	@echo ""
	@echo "  Validation:"
	@echo "    make check-tools    Verify terraform is installed"
	@echo "    make validate-all   fmt -check + validate all examples"

site-dev:
	cd $(SITE_DIR) && npm install && npm run dev

site-build:
	cd $(SITE_DIR) && npm install && npm run build

site-preview: site-build
	cd $(SITE_DIR) && npm run preview

check-tools:
	@command -v terraform >/dev/null || { echo "Missing: terraform — https://developer.hashicorp.com/terraform/install"; exit 1; }
	@terraform version
	@echo "Core lab tools found."

validate-all: check-tools
	@for dir in $(CURDIR)/$(EXAMPLES)/minimal $(CURDIR)/$(EXAMPLES)/aws-static-site $(CURDIR)/$(EXAMPLES)/modules/networking; do \
		echo "==> $$dir"; \
		(cd $$dir && terraform init -backend=false && terraform validate && terraform fmt -check -recursive); \
	done
	@echo "All examples validated."

lab-00: check-tools
	@bash $(SCRIPTS_DIR)/bootstrap-lab.sh 00

lab-01: check-tools
	@bash $(SCRIPTS_DIR)/bootstrap-lab.sh 01

lab-02: check-tools
	@bash $(SCRIPTS_DIR)/bootstrap-lab.sh 02

lab-03: check-tools
	@bash $(SCRIPTS_DIR)/bootstrap-lab.sh 03

lab-04: check-tools
	@bash $(SCRIPTS_DIR)/bootstrap-lab.sh 04

lab-05: check-tools
	@bash $(SCRIPTS_DIR)/bootstrap-lab.sh 05

lab-06: check-tools
	@bash $(SCRIPTS_DIR)/bootstrap-lab.sh 06

lab-07: check-tools
	@bash $(SCRIPTS_DIR)/bootstrap-lab.sh 07
