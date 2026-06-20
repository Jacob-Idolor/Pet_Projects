# Docker fundamentals

**Level:** L1 | **Drill:** [docker-commands.md](../drills/docker-commands.md) | **Hands-on:** [docker/README.md](../docker/README.md)

## Why Docker first

Kubernetes orchestrates **containers**. You need to be fluent in building images, running containers, and debugging before `kubectl` makes sense.

## Core concepts

| Concept | What it is |
|---------|------------|
| **Image** | Immutable template (layers) — your app + runtime |
| **Container** | Running instance of an image |
| **Dockerfile** | Recipe to build an image |
| **Registry** | Storage for images (Docker Hub, GHCR, quay.io) |
| **Volume** | Persistent data outside container lifecycle |
| **Network** | How containers talk (bridge, host, overlay) |

## Mental model

```
Dockerfile → docker build → Image → docker run → Container
                                      ↓
                              Registry (push/pull)
```

Kubernetes adds: schedule many containers, heal failures, expose services, mount storage, enforce policy.

## Must-know commands

```bash
docker build -t myapp:1.0 .
docker run -d -p 8080:80 --name web myapp:1.0
docker ps / docker logs web / docker exec -it web sh
docker stop web && docker rm web
docker images
docker system df
```

## Dockerfile checklist

- [ ] `FROM` pinned tag (not `latest` in prod)
- [ ] `WORKDIR` set
- [ ] Multi-stage build for smaller images
- [ ] Non-root `USER` when possible
- [ ] `HEALTHCHECK` or k8s probes defined at deploy time
- [ ] `.dockerignore` to exclude junk

## Practice goals

1. Build the [sample app](../docker/sample-app/) and run it locally.
2. Inspect layers: `docker history myapp:1.0`
3. Debug a crashing container: `docker logs`, `docker inspect`
4. Complete 5 rounds of [docker command drills](../drills/docker-commands.md)

## Common mistakes

- Forgetting `-p host:container` and wondering why curl fails
- Running as root in production images
- Huge images (no multi-stage, no .dockerignore)
- Storing secrets in Dockerfile or image layers

Next: [Kubernetes basics](02-kubernetes-basics.md) → [Lab 01](../labs/lab-01-first-pod/)
