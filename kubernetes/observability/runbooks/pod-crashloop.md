# Runbook: Pod CrashLoopBackOff

## Symptoms

- Pod status `CrashLoopBackOff` or high restart count
- Service errors / missing endpoints
- Alert: `kube_pod_container_status_restarts_total` increasing

## Impact

App unavailable or degraded; dependent services may fail.

## Diagnosis

```bash
kubectl get pods -n <namespace>
kubectl describe pod <name> -n <namespace>
kubectl logs <name> -n <namespace> --previous
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

Check:
1. Container exit code in `describe`
2. Logs from previous instance
3. Recent config/secret/image change
4. Probe killing container (liveness too aggressive?)
5. Resource limits (OOMKilled)

## Resolution

| Cause | Fix |
|-------|-----|
| Bad image tag | Fix image, rollout |
| Missing env/config | Fix ConfigMap/Secret reference, restart |
| App bug on startup | Fix app, rebuild image |
| OOM | Increase memory limit or fix leak |
| Liveness probe | Adjust probe timing/path |

```bash
kubectl rollout undo deployment/<name> -n <namespace>
```

## Verification

```bash
kubectl get pods -n <namespace>
kubectl logs -f deployment/<name> -n <namespace>
# Hit health endpoint or run smoke test
```

## Prevention

- Staging rollout before prod
- Alerts on restart rate
- Resource requests/limits set
- CI tests before deploy

## Related

- [Troubleshooting scenarios](../../drills/troubleshooting-scenarios.md)
- [scenario-01-crashloop.yaml](../../manifests/broken/scenario-01-crashloop.yaml)
