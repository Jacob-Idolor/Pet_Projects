# ☸️ Kubernetes

My Kubernetes learning journey — everything I learn goes here.

## Structure

```
kubernetes/
  notes/             # concepts, commands, gotchas as I learn them
  manifests/         # YAML I write while learning (deployments, services, etc.)
  experiments/       # bigger hands-on projects (e.g. deploy one of my apps to k8s)
```

## Learning roadmap

- [ ] Local cluster up and running (kind / minikube / k3d / Docker Desktop)
- [ ] Pods, Deployments, Services — deploy a hello-world app
- [ ] ConfigMaps & Secrets
- [ ] Ingress + local routing
- [ ] Persistent volumes
- [ ] Helm basics
- [ ] Deploy one of my own apps (a game or poker tool) to the cluster
- [ ] CI/CD into the cluster (GitOps?)

## End goal

Tie the tracks together: build something in `games/` or `poker/`, containerize it, and run it on Kubernetes — a full deployable story.
