# Platform vision

## What this is

A **Kubernetes learning lab** with two complementary modes:

1. **Browser lab** (`site/`) — modules, quizzes, simulated kubectl, debug scenarios
2. **Local lab** (`scripts/` + `labs/`) — real kind cluster on localhost for hands-on practice
3. **AWS hosting** (`infra/`) — optional S3 + CloudFront to publish the site (~$1–5/mo)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR LEARNING FLOW                       │
├─────────────────────────────────────────────────────────────┤
│  site/ (browser)     scripts/ + labs/ (localhost)           │
│  ┌──────────────┐    ┌──────────────┐                        │
│  │ 7 modules    │    │ kind cluster │                        │
│  │ quizzes      │───▶│ real kubectl │                        │
│  │ kubectl sim  │    │ YAML labs    │                        │
│  └──────────────┘    └──────────────┘                        │
│         │                    │                               │
│         └────────┬───────────┘                               │
│                  ▼                                           │
│         manifests/ + drills/ + curriculum/                   │
└─────────────────────────────────────────────────────────────┘
                          │
              optional: infra/terraform
                          ▼
              S3 + CloudFront (public URL)
```

## What learners do

| Stage | Where | Goal |
|-------|-------|------|
| 1 | **Browser site** | Concepts, commands, quizzes — no install |
| 2 | **Local kind** | Real cluster muscle memory |
| 3 | **Your apps** | Deploy professionally with confidence |

## AWS stack (hosting only)

- S3 (private) + CloudFront OAC
- Optional Route 53 custom domain
- Optional budget alert ($5)
- **No EKS** — local kind is the practice cluster

## Entry points

```bash
make site-dev      # browser @ :4321
make local-lab     # kind + instructions
make aws-deploy    # publish site
```

See [QUICKSTART.md](QUICKSTART.md).
