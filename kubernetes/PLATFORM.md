# Platform architecture — practice + passive income

This folder is evolving from **local-only labs** into a **hosted learning platform**: you practice DevOps skills, visitors learn from your content, and the site can earn passive income — without running real Kubernetes clusters in AWS.

## Core principle: simulate in the cloud, practice for real locally

| Layer | Where it runs | Cost | Purpose |
|-------|---------------|------|---------|
| **Public website** | AWS (static) | ~$1–5/mo | Content, labs as pages, ads, email capture |
| **Interactive practice** | Browser (simulated) | ~$0 | kubectl-style drills without real clusters |
| **Real hands-on labs** | Your laptop (kind) | $0 cloud | Actual containers — never auto-spun in AWS |
| **Optional premium** | Stripe + static member area | +$0 infra | Cheat sheets, exam tracks, ad-free |

**You do not expose a multi-tenant Kubernetes API on AWS.** That path is expensive, risky, and unnecessary for income + learning.

---

## Architecture diagram

```
                    Visitors
                       │
                       ▼
              ┌─────────────────┐
              │  Route 53       │  yourdomain.com
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  CloudFront CDN │  HTTPS, caching, WAF optional
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    ┌─────────┐  ┌──────────┐  ┌──────────────┐
    │ S3      │  │ Lambda   │  │ API Gateway  │  (optional, later)
    │ static  │  │ (forms,  │  │ + Lambda     │  newsletter, waitlist
    │ site    │  │  waitlist)│  │ only         │
    └─────────┘  └──────────┘  └──────────────┘

    Ad slots (AdSense) embedded in lab pages
    Affiliate links in “tools I use” sections

    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

    YOU (local only — never public AWS)
    kind / Docker Desktop  →  real Lab 01–08
    PROGRESS.md in git     →  your private tracker
```

---

## Safeguards (non-negotiable)

### 1. No production clusters for visitors

- **Never** deploy EKS, ECS, or EC2 “lab sandboxes” for anonymous users on a budget.
- Public site = **static HTML/Markdown** + optional **client-side** terminal simulators.
- Real `kubectl apply` stays in [SETUP.md](SETUP.md) on **your machine only**.

### 2. AWS cost guardrails

| Control | Setting |
|---------|---------|
| **Billing alarm** | Alert at $5, $10, $25 |
| **Budget** | Monthly cap with email at 80% / 100% |
| **IAM** | No `AdministratorAccess` on deploy user; use scoped policy (S3, CloudFront, Route53 only) |
| **Region lock** | Single region (e.g. `us-east-1`) |
| **No default VPC resources** | No EC2, RDS, EKS in IaC without explicit review |
| **IaC review** | Terraform/CDK with `terraform plan` before apply |

Example deny list in deploy policy: `eks:*`, `ec2:RunInstances`, `rds:*`, `ecs:CreateCluster`.

### 3. Repo safeguards

- `manifests/broken/` and labs labeled **local-only**.
- CI checks: no secrets, no accidental `kubectl apply` to prod (if CI exists, it only builds static site).
- `.env` and AWS keys never committed ([root `.gitignore`](../.gitignore)).

### 4. Legal / ads

- Privacy policy + cookie notice if using AdSense (EU/CA).
- Affiliate disclosures (“I may earn a commission”).
- Disclaimer: educational content, not certification guarantee or financial advice.

---

## Monetization stack (passive income mindset)

Revenue is **slow at first** — treat it as a 6–12 month compounding project.

| Stream | Effort | Passive potential | Notes |
|--------|--------|-------------------|-------|
| **Google AdSense** | Low after setup | Medium long-term | Needs traffic + approval; $2–15 RPM typical for tech/education |
| **Affiliate links** | Low | Medium | CKA books, Udemy, Linux Foundation exams, cloud credits — disclose |
| **Digital products** | Medium upfront | High | PDF cheat sheets, “30-day CKA drill pack” on Gumroad/Lemon Squeezy |
| **Premium ad-free** | Medium | Medium | $5–15/mo via Stripe; static gated pages or Memberful |
| **Sponsored posts** | High (later) | High | Once you have traffic |
| **YouTube → site** | Medium | Medium | Repurpose lab content |

**Google Ads (you paying Google)** vs **AdSense (Google paying you)**:

- **AdSense** = ads *on your site* → you earn (this is passive income).
- **Google Ads** = you pay to drive traffic → only worth it once you know conversion (email signup, product sale). Budget $0 until you have a product.

Recommended order: **content → SEO → AdSense + affiliates → digital product → optional paid ads**.

---

## AWS cost breakdown (realistic)

Assumptions: static site, **10k–50k pageviews/month**, single region, no EC2/EKS.

| Service | What for | Est. monthly |
|---------|----------|--------------|
| **Route 53** | 1 hosted zone | **$0.50** |
| **Route 53** | Queries | **$0.10–0.50** |
| **ACM** | TLS cert | **$0** |
| **S3** | Static files (~500 MB) | **$0.01–0.10** |
| **S3** | Requests | **$0.05–0.50** |
| **CloudFront** | Data transfer (10–50 GB) | **$0.85–4.50** |
| **CloudFront** | Requests | **$0.10–1.00** |
| **Lambda** (optional) | Waitlist form, 10k invocations | **$0–0.20** |
| **API Gateway** (optional) | Same | **$0–0.10** |
| **WAF** (optional) | Bot protection | **$5–10** (skip at launch) |

### Monthly totals

| Stage | Traffic | AWS cost |
|-------|---------|----------|
| **Launch** | &lt; 5k views | **$1–3** |
| **Growing** | 10k–50k views | **$3–8** |
| **Busy** | 100k+ views | **$10–25** (still no K8s cluster) |

**Domain** (Route 53 or registrar): **~$12–15/year** (~$1/mo).

**Email** (ConvertKit free tier / Buttondown): **$0** until list grows.

### What to avoid (cost traps)

| Service | Typical cost | Why skip |
|---------|--------------|----------|
| **EKS** | $70+/mo minimum | Overkill; not needed for content site |
| **EC2 24/7** | $8–30+/mo | Use static hosting instead |
| **RDS** | $15+/mo | No database needed at launch |
| **Multi-tenant lab VMs** | $100s+/mo | Security + abuse risk |

---

## Google AdSense — economics (honest)

AdSense pays **you** for impressions/clicks. You don't pay Google (unless buying traffic separately).

| Metric | Conservative | Optimistic |
|--------|--------------|------------|
| Pageviews/month | 10,000 | 50,000 |
| RPM (revenue per 1000 views) | $3 | $8 |
| **Monthly ad revenue** | **$30** | **$400** |

Early months with low traffic: **$0–10/mo** is normal until SEO compounds.

**Requirements:** original content, privacy policy, enough pages, Google approval (can take days–weeks).

---

## Optional: paying for traffic (Google Ads)

Only after you sell something with known conversion.

| Budget | Use | Expected |
|--------|-----|----------|
| **$0** | Recommended at start | Organic SEO + Reddit/LinkedIn posts |
| **$100–300/mo test** | Search ads “CKA practice”, “kubectl tutorial” | $1–5 per click; need landing page + email capture |
| **Break-even** | Need product or high AdSense RPM | Rare on ads alone for dev education |

**Rule:** Don't spend on ads until **monthly site revenue &gt; AWS cost + ad spend** or you're buying email list growth intentionally.

---

## Full “win-win” stack cost summary

| Item | Month 1 | Steady state (low traffic) |
|------|---------|----------------------------|
| AWS hosting | $2–5 | $3–8 |
| Domain (amortized) | ~$1 | ~$1 |
| AdSense | $0 (pending approval) | $5–50 |
| Affiliates | $0 | $0–30 |
| Digital products | $0 | $0–100+ |
| **Net (rough)** | **−$3 to −$6** | **−$3 to +$80** |

Passive income is real but **back-loaded**: AWS stays cheap; income scales with content and traffic, not with running clusters.

---

## Implementation phases

### Phase 0 — Now (this repo)

- Local labs + drills (already here)
- Add static site export of curriculum/labs (see [site/](site/))
- PROGRESS stays local or optional account later

### Phase 1 — Launch site (~$3/mo AWS)

- S3 + CloudFront + Route 53
- Privacy policy, about, lab index pages
- Apply for AdSense after 15–20 quality pages

### Phase 2 — Monetize (~$3–8/mo AWS)

- AdSense live, affiliate “resources” page
- Email waitlist (Lambda or Buttondown)
- First digital product: “kubectl drill PDF” ($9–19)

### Phase 3 — Premium (optional)

- Stripe checkout, ad-free tier
- Still **no** shared K8s cluster — premium = content + trackers + simulators

### Phase 4 — Your real practice (always local)

- kind on laptop for Labs 01–08
- Document journey on site (build in public → traffic → income)

---

## Repo layout (updated model)

```
kubernetes/
  PLATFORM.md          ← this file (business + architecture)
  site/                ← static site source (deploys to S3, not clusters)
  labs/                ← local-only hands-on (real kubectl)
  drills/              ← content → also published as web pages
  manifests/           ← LOCAL ONLY — never applied by CI to AWS
  scripts/             ← local kind setup only
```

---

## Next steps

1. Register domain (or subdomain of personal site).
2. Build [site/](site/) from lab/drill markdown.
3. Deploy with Terraform or AWS CLI (scoped IAM).
4. Set billing alarm at **$5**.
5. Publish 2 posts/week from lab content; apply AdSense at ~20 pages.
6. Keep practicing on **kind** locally — write what you learned on the site.

Questions or want Terraform for Phase 1? Open an issue or ask in chat.
