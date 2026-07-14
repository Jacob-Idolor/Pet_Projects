# OpenTelemetry Learning Lab — common commands
# Run from opentelemetry/ : make help

.PHONY: help stack-up stack-down stack-status stack-logs check-tools lab-01 lab-sample-traffic

STACK_DIR := examples/stack
GO_APP    := examples/go-http
SCRIPTS   := scripts

help:
	@echo "OpenTelemetry Learning Lab"
	@echo ""
	@echo "  Local stack (Jaeger + Prometheus + Grafana + Collector):"
	@echo "    make stack-up       Start docker compose stack"
	@echo "    make stack-down     Stop and remove stack"
	@echo "    make stack-status   Show container health"
	@echo "    make stack-logs     Tail Collector logs"
	@echo ""
	@echo "  Labs:"
	@echo "    make lab-01         Print Lab 01 guide + generate sample traffic"
	@echo "    make lab-sample-traffic  Hit Go sample app endpoints"
	@echo ""
	@echo "  Tools:"
	@echo "    make check-tools    Verify docker and curl"

stack-up:
	docker compose -f $(STACK_DIR)/docker-compose.yml up -d --build
	@echo ""
	@echo "Stack starting. UIs:"
	@echo "  Jaeger:     http://localhost:16686"
	@echo "  Grafana:    http://localhost:3000  (admin / practice)"
	@echo "  Prometheus: http://localhost:9090"
	@echo ""
	@echo "OTLP endpoints: gRPC :4317  HTTP :4318"

stack-down:
	docker compose -f $(STACK_DIR)/docker-compose.yml down -v

stack-status:
	docker compose -f $(STACK_DIR)/docker-compose.yml ps

stack-logs:
	docker compose -f $(STACK_DIR)/docker-compose.yml logs -f otel-collector

check-tools:
	@command -v docker >/dev/null || { echo "Missing: docker"; exit 1; }
	@docker compose version >/dev/null 2>&1 || { echo "Missing: docker compose"; exit 1; }
	@command -v curl >/dev/null || { echo "Missing: curl"; exit 1; }
	@echo "All core lab tools found."

lab-01: stack-up
	@bash $(SCRIPTS)/bootstrap-lab.sh 01

lab-sample-traffic:
	@bash $(SCRIPTS)/generate-traffic.sh
