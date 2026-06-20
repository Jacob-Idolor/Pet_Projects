# Observability

**Level:** L5 | **Lab:** [lab-prometheus-grafana](../observability/lab-prometheus-grafana/) | **Ties to:** Dynatrace track

## The three pillars

| Pillar | Question | Tools (examples) |
|--------|----------|-------------------|
| **Metrics** | How much / how fast? | Prometheus, Grafana, Dynatrace |
| **Logs** | What happened? | Loki, ELK, Fluent Bit, Dynatrace logs |
| **Traces** | Where did time go? | Jaeger, Tempo, OpenTelemetry |

## Golden signals (SRE)

1. **Latency** — request duration
2. **Traffic** — demand
3. **Errors** — failure rate
4. **Saturation** — how full is the system

## Kubernetes-native observability

- **kube-state-metrics** — object state (Deployments, Pods)
- **node-exporter** — node hardware metrics
- **cAdvisor / metrics-server** — container resources
- **Pod logs** — `kubectl logs`; aggregate with DaemonSet agents

## Instrumentation

- Expose `/metrics` in Prometheus format from your app
- Structured JSON logs (not printf debugging in prod)
- OpenTelemetry SDK → traces to backend

## Alerting

Good alert: actionable, tied to user impact, runbook linked.

Bad alert: "CPU > 80%" with no context, pages on-call for non-issues.

## Dynatrace connection

Skills here transfer directly to your [dynatrace/](../../dynatrace/) track:

- Dashboard design (golden signals, RED/USE methods)
- DQL / metric queries ↔ PromQL thinking
- Problem detection ↔ alert rules
- OneAgents / OTel ↔ instrumentation

## Practice goals

- [ ] Deploy Prometheus + Grafana lab stack
- [ ] Import or build a dashboard for Pod CPU/memory
- [ ] Write one alert rule (e.g. Pod not ready)
- [ ] Correlate metric spike → logs → root cause (manual exercise)
- [ ] Document a mini runbook in [observability/runbooks/](observability/runbooks/)

Portfolio: deploy an app with metrics endpoint + screenshot of dashboard in README.
