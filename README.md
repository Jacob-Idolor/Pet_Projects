# Pet Projects — Deployable Solutions

A portfolio of projects I build, ship, and run. The goal of this repo is simple: everything here should be **deployable** — clear setup steps, reproducible environments, and (where it makes sense) containers, CI, and live demos.

## Tracks

| Track | Folder | What goes here |
|-------|--------|----------------|
| 🎮 Games | [`games/`](games/) | Web games and game projects — from quick browser apps to more serious builds |
| ♠️ Poker | [`poker/`](poker/) | Tools to practice and sharpen my poker skills (trainers, solvers, drills) |
| 📊 Dynatrace | [`dynatrace/`](dynatrace/) | Dashboards, scripts, workflows, and everything I learn about Dynatrace |
| ☸️ Kubernetes | [`kubernetes/`](kubernetes/) | My Kubernetes learning journey — manifests, clusters, experiments, notes |

## Deployability standards

Every project in this repo aims to meet this bar:

- [ ] **README** with what it is, how to run it, and how to deploy it
- [ ] **Reproducible setup** — pinned dependencies (`requirements.txt`, `package.json`, `go.mod`, etc.)
- [ ] **Config via environment** — `.env.example` checked in, secrets never committed
- [ ] **Containerized** when applicable — `Dockerfile` / `docker-compose.yml`
- [ ] **CI** — lint and tests run on push (GitHub Actions)
- [ ] **Deploy target** documented — where it runs and how it got there

## Projects

| Project | Track | Status | Deployed |
|---------|-------|--------|----------|
| _Coming soon_ | — | — | — |

> Previous projects (BallStats, stock-buy-bot, PokerGTO, and more) are preserved in git history — see the [`pre-reset-archive`](../../tree/pre-reset-archive) tag.

## License

[MIT](LICENSE)
