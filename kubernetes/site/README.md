# Static learning site

**The product.** Browser-based Kubernetes learning — modules, simulated kubectl, quizzes. Deploys to S3 + CloudFront.

## Local preview

```powershell
cd kubernetes/site
npm install
npm run dev
```

Open http://localhost:4321

## Deploy to AWS

```powershell
cd kubernetes/infra/terraform
# terraform apply (after tfvars configured)

cd ..
.\deploy-site.ps1 -Profile pet-projects
```

## Features

- `/learn.html` — module index
- `/modules/*.html` — lessons + quiz + terminal per topic
- `/practice.html` — kubectl simulator + missions
- `/practice-broken.html` — empty endpoints scenario
- `/practice-crash.html` — CrashLoopBackOff scenario
- Ad placements via `AdSlot.astro` — configure at `/ads.html` (toggle on/off, AdSense client ID)

## Cost

Static files only → **~$1–5/mo** at low traffic. No backend, no database, no Kubernetes in AWS.
