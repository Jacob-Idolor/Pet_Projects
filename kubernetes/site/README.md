# Static site — public learning platform

Source for the hosted site (S3 + CloudFront). **No Kubernetes runs in AWS.**

## Local preview

```powershell
cd kubernetes/site
npm install
npm run dev
```

Open http://localhost:4321

## Deploy (after AWS infra is created)

```powershell
npm run build
cd ../infra
.\deploy-site.ps1 -Profile pet-projects
```

See [infra/README.md](../infra/README.md) for one-time Terraform setup. Deploy is **manual** — nothing auto-runs on git push unless you enable it.

## Content

| Path | Purpose |
|------|---------|
| `src/pages/` | Site pages (home, labs, learn, about) |
| `src/content/` | Markdown articles (optional, grows over time) |
| `public/` | Static assets |

Lab YAML and real `kubectl` practice stay in the repo root folders — marked **local only**.
