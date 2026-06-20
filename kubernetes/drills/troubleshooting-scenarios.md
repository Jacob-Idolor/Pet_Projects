# Troubleshooting scenarios

Practice fixing realistic problems. **Do not look at solutions until you've tried 15+ minutes.**

Use namespace `troubleshoot` for all scenarios:

```bash
kubectl create namespace troubleshoot
kubectl config set-context --current --namespace=troubleshoot
```

---

## Scenario 1 — CrashLoopBackOff

**Symptom:** Pod keeps restarting.

```bash
kubectl apply -f ../manifests/broken/scenario-01-crashloop.yaml
kubectl get pods
```

**Your tasks:**
1. Find root cause
2. Fix the manifest (or patch live)
3. Verify Pod is Running

<details>
<summary>Hint</summary>

Check logs and the command the container runs. Often bad entrypoint, missing config, or app exiting immediately.

</details>

<details>
<summary>Solution</summary>

Common fixes: wrong `command`, missing env var, failing health check killing pod. Inspect with `kubectl logs` and `kubectl describe`. Fix image command or env in YAML, re-apply.

</details>

---

## Scenario 2 — Service with no endpoints

**Symptom:** `curl` to Service fails from another Pod.

```bash
kubectl apply -f ../manifests/broken/scenario-02-no-endpoints.yaml
kubectl get svc,endpoints
```

**Your tasks:**
1. Explain why endpoints are empty
2. Fix selector or labels
3. Confirm endpoints populate

<details>
<summary>Hint</summary>

Service `selector` must match Pod labels exactly.

</details>

---

## Scenario 3 — ImagePullBackOff

**Symptom:** Pod stuck pulling image.

```bash
kubectl apply -f ../manifests/broken/scenario-03-imagepull.yaml
```

**Your tasks:**
1. Identify bad image reference
2. Fix tag or use valid public image
3. Document how you'd debug private registry auth

---

## Scenario 4 — Config not applied

**Symptom:** App runs but ignores config.

```bash
kubectl apply -f ../manifests/broken/scenario-04-config.yaml
kubectl logs deployment/config-app
```

**Your tasks:**
1. Verify ConfigMap contents
2. Fix volume mount or env reference
3. Confirm app reads new value (may need rollout restart)

---

## Scenario 5 — Pending Pod (resources)

**Symptom:** Pod stays Pending.

```bash
kubectl apply -f ../manifests/broken/scenario-05-pending.yaml
kubectl describe pod
```

**Your tasks:**
1. Read Events — insufficient CPU/memory?
2. Fix requests or add capacity (local: lower requests)

---

## Scenario 6 — Observability blind spot

**Symptom:** App is up but no metrics in Prometheus.

**Your tasks (conceptual + lab):**
1. List 5 reasons metrics might be missing
2. Fix ServiceMonitor/Pod annotations in [observability lab](../observability/lab-prometheus-grafana/)
3. Write 3-line runbook for on-call

<details>
<summary>Common causes</summary>

- No `/metrics` endpoint
- ServiceMonitor selector mismatch
- Wrong port name
- NetworkPolicy blocking scrape
- Prometheus not in same namespace / RBAC denied

</details>

---

## Scenario 7 — CKA timed drill

**Goal:** 20 minutes, no docs.

1. Create Deployment `api` (2 replicas, nginx)
2. Expose ClusterIP on port 80
3. Create ConfigMap, mount as file in Pod
4. Scale to 4 replicas
5. Roll out new image tag, then rollback
6. Delete everything cleanly

Log your time. Target: under 20 min by third attempt.

---

## After each scenario

Update [PROGRESS.md](../PROGRESS.md):

```
Scenario:
Root cause:
Commands used:
Prevention:
```
