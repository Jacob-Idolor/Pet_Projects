# Lab 00 — Docker fundamentals

**Level:** L0 | **Time:** 45–60 min | **Prerequisites:** Docker installed

Do this **before** Lab 01 if you're new to containers. Browser practice: [/docker.html](../site/) (run `make site-dev`).

## Goals

- Build a multi-stage Docker image from the sample app
- Run, inspect, and debug containers locally
- Apply containerization best practices
- Load your image into kind for Kubernetes labs

## Steps

### 1. Build the sample app

```bash
cd kubernetes/docker/sample-app
docker build -t practice-app:1.0 .
docker images practice-app
```

**Write down:** Final image size. Why is it smaller than a golang image?

### 2. Run and health-check

```bash
docker run -d -p 8080:8080 --name practice practice-app:1.0
curl http://localhost:8080/health
curl http://localhost:8080/
docker logs practice
```

### 3. Inspect and debug

```bash
docker inspect practice --format='{{.State.Status}}'
docker history practice-app:1.0
docker exec -it practice wget -qO- http://localhost:8080/health
```

### 4. Break and fix — wrong port

```bash
docker stop practice && docker rm practice
docker run -d -p 9090:8080 --name wrong-port practice-app:1.0
curl http://localhost:8080/health   # fails — why?
docker ps                           # check PORTS column
docker stop wrong-port && docker rm wrong-port
docker run -d -p 8080:8080 --name practice practice-app:1.0
```

### 5. Break and fix — missing env (optional)

The sample app defaults `PORT` to 8080. Try overriding:

```bash
docker run -d -p 3000:3000 -e PORT=3000 --name custom-port practice-app:1.0
curl http://localhost:3000/health
docker stop custom-port && docker rm custom-port
```

### 6. Load into kind (bridge to Kubernetes)

```bash
# From kubernetes/
make local-up
kind load docker-image practice-app:1.0 --name practice
```

Use `practice-app:1.0` in Pod manifests — no registry pull needed.

## Best practices checklist

- [ ] Image uses pinned base tags (`alpine:3.19`, not `latest`)
- [ ] Multi-stage build (builder + runtime)
- [ ] Non-root `USER appuser`
- [ ] `HEALTHCHECK` defined
- [ ] `.dockerignore` excludes unnecessary files

## Checklist

- [ ] Built and ran practice-app locally
- [ ] Used `docker logs`, `inspect`, `exec`
- [ ] Fixed wrong port mapping exercise
- [ ] Completed browser Docker missions on `/docker.html`
- [ ] Loaded image into kind (optional until Lab 01)
- [ ] Logged takeaway in [PROGRESS.md](../PROGRESS.md)

## Clean up

```bash
docker stop practice 2>/dev/null; docker rm practice 2>/dev/null
```

## Next

[Lab 01 — First pod](../lab-01-first-pod/) · [Docker drills](../drills/docker-commands.md)
