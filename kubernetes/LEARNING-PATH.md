# How to learn with this lab

This repo is designed for **concept → simulate → practice → reflect**. Follow this order for each topic.

## The learning loop

```
1. Read lesson (browser)     → interactive steps + quick quiz
2. Simulator practice        → safe kubectl/docker reps
3. Local lab (kind)          → real YAML on your machine
4. Troubleshoot scenario     → break/fix under pressure
5. Mark complete + notes     → Tracker (/progress.html)
```

## Recommended path

Start with **[Learn](/learn.html)** — 15 bite-sized lessons split into Part 1 (containers) and Part 2 (Kubernetes).

| Step | Browser | Local cluster |
|------|---------|---------------|
| 1 | [Part 1 — Lessons 1–6](/learn.html#containers) | `make docker-lab` → [Lab 00](labs/lab-00-docker/) |
| 2 | [Docker simulator](/docker.html) | Lab 00 |
| 3 | [Part 2 — Lessons 7–9](/learn.html#kubernetes) | [Lab 01](labs/lab-01-first-pod/) |
| 4 | [Lessons 10–11 — Deployments & Services](/modules/k4-deployments.html) | [Lab 02](labs/lab-02-deployments-services/) |
| 5 | [Lesson 12 — Config](/modules/k6-config.html) | [Lab 03](labs/lab-03-config-secrets/) |
| 6 | [Lesson 13 — Networking](/modules/k7-networking.html) | [Lab 04](labs/lab-04-networking-ingress/) |
| 7 | [Lesson 14 — Storage & RBAC](/modules/k8-storage-rbac.html) | [Labs 05–06](labs/lab-05-storage/) |
| 8 | [Lesson 15 — Production](/modules/k9-production.html) | [Lab 07 Helm](labs/lab-07-helm/) |
| 9 | [Troubleshoot hub](/troubleshoot.html) | [manifests/broken/](manifests/broken/) on kind |

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

## Completion certificate

When you finish **all 31 core labs** (mark them in Tracker), unlock:

- **Printable PDF certificate** — `/certificate.html` → Download PDF (Print)
- **Credential ID** — unique ID based on your completed tasks
- **LinkedIn copy-paste** — certification description, post text, and suggested skills
- **JSON proof export** — backup file listing everything you completed

Full program (all tracker tasks including advanced challenges) earns a **Distinction** line on the certificate.

## When you're stuck

| Symptom | First command |
|---------|---------------|
| Pod won't start | `kubectl describe pod NAME` |
| Service unreachable | `kubectl get endpoints` |
| Container crashed | `kubectl logs NAME --previous` |
| Docker curl fails | `docker ps` (check PORTS column) |

See [SETUP.md](SETUP.md) for cluster setup and [QUICKSTART.md](QUICKSTART.md) for commands.
