# Docker command drills

Run these **without looking at answers**. Time yourself. Goal: 5 clean runs before moving on.

## Drill A — Images & containers (10 min)

```bash
# 1. List running containers
docker ps

# 2. List all containers (including stopped)
docker ps -a

# 3. List local images
docker images

# 4. Build from Dockerfile in current dir, tag myapp:drill
docker build -t myapp:drill .

# 5. Run detached, name web, map 8080→80
docker run -d -p 8080:80 --name web myapp:drill

# 6. Follow logs
docker logs -f web

# 7. Shell into container
docker exec -it web sh

# 8. Inspect JSON config
docker inspect web

# 9. Stop and remove
docker stop web && docker rm web

# 10. Remove image
docker rmi myapp:drill
```

## Drill B — Debugging (10 min)

Given a container named `broken`:

1. Why did it exit? → `docker logs broken`
2. What was the exit code? → `docker inspect broken --format='{{.State.ExitCode}}'`
3. Run interactively overriding entrypoint → `docker run -it --entrypoint sh myapp:drill`
4. Check disk usage → `docker system df`
5. Prune unused resources → `docker system prune` (careful in shared envs)

## Drill C — Volumes & networks (10 min)

```bash
docker volume create drill-data
docker run -d --name db -v drill-data:/data alpine sleep 3600
docker exec db ls /data
docker network create drill-net
docker run -d --name api --network drill-net nginx:alpine
docker network inspect drill-net
```

## Drill D — Dockerfile practice

From [sample-app](../docker/sample-app/), without opening the drill sheet:

1. Write a Dockerfile that uses multi-stage build
2. Build with `--no-cache`
3. Compare sizes: `docker images myapp`
4. View layers: `docker history myapp:drill`

## Self-check questions

1. What is the difference between `COPY` and `ADD`?
2. Why use multi-stage builds?
3. What does `-p 8080:80` mean (host vs container)?
4. How do you pass env vars at run time?
5. Why shouldn't secrets go in Dockerfile?

## Answers (hide until done)

<details>
<summary>Self-check answers</summary>

1. COPY is preferred; ADD has extra features (URLs, auto-extract tar) — usually avoid ADD.
2. Smaller final image; build tools not in runtime layer.
3. Host port 8080 maps to container port 80.
4. `-e KEY=val` or `--env-file .env`
5. Layers are persistent in image history; use runtime secrets / k8s Secrets.

</details>
