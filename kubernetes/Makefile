# Kubernetes Learning Lab — common commands
# Run from kubernetes/ : make help

.PHONY: help site-dev site-build site-preview local-up local-down local-status local-lab aws-init aws-plan aws-apply aws-deploy aws-destroy check-tools

AWS_PROFILE ?= pet-projects
SITE_DIR    := site
SCRIPTS_DIR := scripts
INFRA_DIR   := infra/terraform

help:
	@echo "Kubernetes Learning Lab"
	@echo ""
	@echo "  Website (browser learning):"
	@echo "    make site-dev       Start Astro dev server (http://localhost:4321)"
	@echo "    make site-build     Build static site to site/dist/"
	@echo "    make site-preview   Preview production build locally"
	@echo ""
	@echo "  Local cluster (real kubectl practice):"
	@echo "    make check-tools    Verify docker, kubectl, kind are installed"
	@echo "    make local-up       Create kind cluster 'practice'"
	@echo "    make local-down     Delete kind cluster"
	@echo "    make local-status   Show cluster nodes and contexts"
	@echo "    make local-lab      Start cluster + print Lab 01 instructions"
	@echo ""
	@echo "  AWS (host learning site on S3 + CloudFront, ~\$$1–5/mo):"
	@echo "    make aws-init       terraform init"
	@echo "    make aws-plan       terraform plan (review before apply)"
	@echo "    make aws-apply      terraform apply"
	@echo "    make aws-deploy     Build site + sync to S3 + invalidate CloudFront"
	@echo "    make aws-destroy    Tear down AWS resources"

site-dev:
	cd $(SITE_DIR) && npm install && npm run dev

site-build:
	cd $(SITE_DIR) && npm install && npm run build

site-preview: site-build
	cd $(SITE_DIR) && npm run preview

check-tools:
	@command -v docker >/dev/null || { echo "Missing: docker"; exit 1; }
	@command -v kubectl >/dev/null || { echo "Missing: kubectl"; exit 1; }
	@command -v kind >/dev/null || { echo "Missing: kind — https://kind.sigs.k8s.io/"; exit 1; }
	@echo "All local lab tools found."

local-up: check-tools
	bash $(SCRIPTS_DIR)/setup-kind.sh

local-down:
	bash $(SCRIPTS_DIR)/teardown-kind.sh

local-status:
	@kubectl config get-contexts 2>/dev/null || echo "No kubectl contexts"
	@kubectl get nodes 2>/dev/null || echo "Cluster not reachable — run: make local-up"

local-lab: local-up
	bash $(SCRIPTS_DIR)/bootstrap-lab.sh

aws-init:
	cd $(INFRA_DIR) && terraform init

aws-plan:
	cd $(INFRA_DIR) && terraform plan

aws-apply:
	cd $(INFRA_DIR) && terraform apply

aws-deploy:
	AWS_PROFILE=$(AWS_PROFILE) bash infra/deploy-site.sh

aws-destroy:
	cd $(INFRA_DIR) && terraform destroy
