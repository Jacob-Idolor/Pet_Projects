# Docker practice

Hands-on container fundamentals before and alongside Kubernetes labs.

## Quick exercises

### 1. Build the sample app

```powershell
cd sample-app
docker build -t practice-app:1.0 .
docker run -d -p 8080:8080 --name practice practice-app:1.0
curl http://localhost:8080/health
docker logs practice
docker stop practice && docker rm practice
```

### 2. Multi-stage comparison

Build with and without multi-stage (edit Dockerfile temporarily). Compare:

```powershell
docker images practice-app
docker history practice-app:1.0
```

### 3. Debug exercise

Run with wrong port mapping, fix it:

```powershell
docker run -d -p 9090:8080 --name wrong practice-app:1.0
# curl fails on 8080 — why?
```

### 4. Load into kind (for k8s labs)

After building locally:

```powershell
kind load docker-image practice-app:1.0 --name practice
```

Use `practice-app:1.0` in your Pod manifests on kind (no registry pull needed).

## Drill

Complete [docker-commands.md](../drills/docker-commands.md) — 5 sessions.

## Read

[Curriculum: Docker fundamentals](../curriculum/01-docker-fundamentals.md)
