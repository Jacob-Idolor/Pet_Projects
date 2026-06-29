# How to learn with this lab

This repo is designed for **concept → simulate → practice → reflect**. Follow this order for each topic.

## The learning loop

```
1. Read module (browser)     → concepts + quiz
2. Simulator practice        → safe kubectl/docker reps
3. Local lab (kind)          → real YAML on your machine
4. Troubleshoot scenario     → break/fix under pressure
5. Mark complete + notes     → Tracker (/progress.html)
```

## Recommended path

| Step | Browser | Local cluster |
|------|---------|---------------|
| 1 | [Docker fundamentals](/docker.html) | `make docker-lab` → [Lab 00](labs/lab-00-docker/) |
| 2 | [Containers module](site/) | Lab 00 |
| 3 | [Pods module](site/) | [Lab 01](labs/lab-01-first-pod/) |
| 4 | [Deployments module](site/) | [Lab 02](labs/lab-02-deployments-services/) |
| 5 | [Config module](site/) | [Lab 03](labs/lab-03-config-secrets/) |
| 6 | [Networking module](site/) | [Lab 04](labs/lab-04-networking-ingress/) |
| 7 | [Storage module](site/) | [Labs 05–06](labs/lab-05-storage/) |
| 8 | [Production module](site/) | [Lab 07 Helm](labs/lab-07-helm/) |
| 9 | [Troubleshoot hub](site/) | [manifests/broken/](manifests/broken/) on kind |

Run the site locally: `make site-dev` → http://localhost:4321

## Difficulty levels

- **Beginner** — Docker basics, first Pod, CrashLoop, ImagePull
- **Intermediate** — Networking, storage, RBAC, command drills
- **Advanced** — Full broken-manifest sweep, CKA timed drill, observability lab

## Tips for retention

1. **Don't skip the quiz** — it catches gaps before you hit the cluster.
2. **Write one note per lab** in the Tracker — commands you want to remember.
3. **Break things on purpose** — apply `manifests/broken/` after the browser scenario.
4. **Repeat drills** — `drills/kubectl-commands.md` until commands are automatic.
5. **Export your progress** — Tracker → Export backup so you don't lose checkmarks.

## When you're stuck

| Symptom | First command |
|---------|---------------|
| Pod won't start | `kubectl describe pod NAME` |
| Service unreachable | `kubectl get endpoints` |
| Container crashed | `kubectl logs NAME --previous` |
| Docker curl fails | `docker ps` (check PORTS column) |

See [SETUP.md](SETUP.md) for cluster setup and [QUICKSTART.md](QUICKSTART.md) for commands.
