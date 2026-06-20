# Lab 08 — Prometheus & Grafana

**Level:** L5 | **Time:** 60–90 min | **Prerequisites:** Labs 01–02, metrics-server optional

## Goals

- Deploy a monitoring stack with Helm
- View cluster and workload metrics in Grafana
- Practice the metrics → logs → fix workflow
- Connect skills to Dynatrace / SRE work

## Steps

### 1. Add Helm repos

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### 2. Create monitoring namespace

```bash
kubectl create namespace monitoring
```

### 3. Install kube-prometheus-stack

This bundles Prometheus, Grafana, and default dashboards.

```bash
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set grafana.adminPassword=practice \
  --set prometheus.prometheusSpec.retention=2d
```

Wait for pods:

```bash
kubectl get pods -n monitoring -w
```

### 4. Access Grafana

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
```

Open http://localhost:3000 — login `admin` / `practice`.

Explore dashboards:
- **Kubernetes / Compute Resources / Namespace (Pods)**
- **Node Exporter / Nodes**

### 5. Deploy sample app with metrics (optional depth)

Build and deploy [../docker/sample-app/](../docker/sample-app/). Add Prometheus annotations to Pod template:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
    prometheus.io/path: "/metrics"
```

(Extend sample-app to expose `/metrics` as a portfolio follow-up.)

### 6. Troubleshooting exercise

Break something in `lab-02` namespace, then:

1. Which dashboard shows the problem?
2. What PromQL query would show Pod restarts?
   ```promql
   increase(kube_pod_container_status_restarts_total[15m])
   ```
3. Pull logs for the failing Pod
4. Write runbook entry in [runbooks/pod-crashloop.md](runbooks/pod-crashloop.md)

### 7. Alertmanager (awareness)

```bash
kubectl get pods -n monitoring | findstr alertmanager
```

Browse Alertmanager UI (port-forward svc). Understand: alert ≠ dashboard — alerts need routes and runbooks.

## metrics-server (if `kubectl top` fails)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# kind may need extra args — see SETUP.md troubleshooting
kubectl top nodes
kubectl top pods -A
```

## Checklist

- [ ] Grafana accessible locally
- [ ] Found Pod CPU/memory dashboard
- [ ] Ran one PromQL query
- [ ] Correlated metric → logs → root cause
- [ ] Wrote or updated a runbook
- [ ] Updated [PROGRESS.md](../PROGRESS.md)

## Clean up

```bash
helm uninstall monitoring -n monitoring
kubectl delete namespace monitoring
```

## Connect to Dynatrace track

| This lab | Dynatrace equivalent |
|----------|---------------------|
| Grafana dashboard | Dynatrace dashboard |
| PromQL | DQL / Metrics API |
| Alertmanager | Davis anomaly detection / problem notifications |
| kube-state-metrics | Kubernetes built-in monitoring |

Export a Dynatrace dashboard JSON to [../../dynatrace/dashboards/](../../dynatrace/dashboards/) and note which PromQL queries map to your DQL.

## Read

[Curriculum: Observability](../curriculum/06-observability.md)
