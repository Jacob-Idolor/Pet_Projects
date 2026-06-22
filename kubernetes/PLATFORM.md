# Platform vision

## What this is

A **browser-based Kubernetes learning site** hosted on AWS S3 + CloudFront:

- 7 interactive modules (concepts + quizzes)
- Simulated `kubectl` terminal (no real cluster)
- Debug scenarios (CrashLoopBackOff, broken endpoints)
- Ad-ready layout for Google AdSense
- **~$1–5/month** AWS cost — no EKS, no EC2, no learner downloads

## What learners do

1. Visit your CloudFront URL
2. Read a module
3. Practice commands in the simulator
4. Pass the quiz
5. Repeat — progress saved in browser localStorage

## What learners do NOT need

- Docker, kind, kubectl installed
- AWS account
- Git clone
- Paid cloud Kubernetes

## Your path to professional deploys

| Stage | Where | Goal |
|-------|-------|------|
| 1 | **This website** | Understand concepts + commands |
| 2 | Optional `labs/` + kind | Real cluster muscle memory |
| 3 | Your apps + Terraform | Professional deployment |

## Monetization

1. Content first (modules, scenarios, SEO)
2. Deploy to CloudFront
3. Apply for AdSense after traffic
4. Affiliates / PDF products later

**Do not** pay for Google Ads until you have conversion data.

## AWS stack (only this)

- S3 (private) + CloudFront OAC
- Optional Route 53 custom domain
- Optional $5 budget alert
- **Nothing else**

## Sharing

Fork → own AWS account → own ~$1–5/mo bill. See [CONTRIBUTING.md](CONTRIBUTING.md).
