# Pet Projects — Deployable Solutions

A portfolio of projects I build, ship, and run. The goal of this repo is simple: everything here should be **deployable** — clear setup steps, reproducible environments, and (where it makes sense) containers, CI, and live demos.

This repo is also a **build-in-the-open journal**. Alongside the code, I document what I'm learning, what worked, and what didn't — so if you've found your way here, feel free to follow along, borrow ideas, or open an issue to chat.

## Tracks

| Track | Folder | What goes here |
|-------|--------|----------------|
| 🎮 Games | [`games/`](games/) | Web games and game projects — from quick browser apps to more serious builds |
| ♠️ Poker | [`poker/`](poker/) | Tools to practice and sharpen my poker skills (trainers, solvers, drills) |
| 📊 Dynatrace | [`dynatrace/`](dynatrace/) | Dashboards, scripts, workflows, and everything I learn about Dynatrace |
| ☸️ Kubernetes | [`kubernetes/`](kubernetes/) | My Kubernetes learning journey — manifests, clusters, experiments, notes |
| 🏗️ Terraform | [`terraform/`](terraform/) | Infrastructure as Code — curriculum, simulator, labs, production examples |
| 🔭 OpenTelemetry | [`opentelemetry/`](opentelemetry/) | Industry-standard observability — traces, metrics, logs, Collector, hands-on labs |
| 📈 Stocks | [`stocks/`](stocks/) | Trading tools — TradingView Pine Scripts, research, screeners, and bots |

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
| [Stocks Radar](stocks/radar/) | 📈 Stocks | Active | AWS S3 + CloudFront — see [DEPLOY.md](stocks/radar/DEPLOY.md) |
| [K8s Practice Lab](kubernetes/site/) | ☸️ Kubernetes | Active | S3 + CloudFront |
| [Terraform Practice Lab](terraform/site/) | 🏗️ Terraform | Active | Local / optional AWS |
| [OpenTelemetry Lab](opentelemetry/) | 🔭 OpenTelemetry | Active | Local Docker stack |

> Previous projects (BallStats, stock-buy-bot, PokerGTO, and more) are preserved in git history — see the [`pre-reset-archive`](../../tree/pre-reset-archive) tag.

## License

[MIT](LICENSE)
