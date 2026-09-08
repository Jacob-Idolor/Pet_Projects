# AdSense — StocksWatch

Publisher ads are supported on the **NBIS Deep Dive research desk** (`/`) after its source-linked content and on the archived watchlist after its publisher content; **404 never loads ads**. Live ads remain opt-in until the site has passed review and numeric units are configured.

> **AdSense ≠ Google Ads.** Set publisher + unit IDs via env — **do not** paste the AdSense `<script>` into every HTML file.

## Best way to add your snippets (mapped)

| AdSense console gives you | StocksWatch equivalent |
|---------------------------|------------------------|
| `<script … adsbygoogle.js?client=ca-pub-…>` | `PUBLIC_ADSENSE_CLIENT` → loaded by `BaseLayout` only when the live custom-domain gate passes |
| `google.com, pub-…, DIRECT, f08c47fec0942fa0` | Auto-written to `/ads.txt` by deploy/`write-seo-files` when `PUBLIC_ADSENSE_CLIENT` is set |
| `<meta name="google-adsense-account" content="ca-pub-…">` | `PUBLIC_ADSENSE_VERIFY_META` |

Your publisher ID: **`ca-pub-6564901086381119`** → ads.txt uses **`pub-6564901086381119`**.

## Policy compliance (required before requesting review)

| Rule | How StocksWatch complies |
|------|--------------------------|
| No ads on empty / low-value screens | Units only when universe/watchlist has **≥5** names |
| No ads in chrome-only UI | Never in header / ticker; only labeled “Sponsored” **after** screener content |
| No ads on thin error pages | `404` → `allowAds={false}`, `noindex`, no `adsbygoogle.js` |
| Don’t rely on Auto ads | **Turn Auto ads OFF** in AdSense → Ads → Auto ads. Manual Display units only |

### Before you request a review

1. Live `/` shows NBIS research content **before** any Sponsored unit.
2. A bad URL → 404 has **no** AdSense network requests in DevTools.
3. AdSense console: Auto ads **disabled**; only board + footer Display units.
4. Site URL is `https://stockswatch.cc` (not bare CloudFront).
5. `https://stockswatch.cc/ads.txt` matches your `pub-…`.

## Production setup (GitHub → stockswatch.cc)

In the repo **Settings → Secrets and variables → Actions → Variables**:

```text
PUBLIC_ADSENSE_CLIENT=ca-pub-6564901086381119
PUBLIC_ADSENSE_VERIFY_META=ca-pub-6564901086381119
PUBLIC_ADSENSE_ENABLED=true
PUBLIC_ADSENSE_SLOT_BOARD=<numeric ad unit id from AdSense>
PUBLIC_ADSENSE_SLOT_FOOTER=<numeric ad unit id from AdSense>
STOCKS_RADAR_SITE=https://stockswatch.cc
```

Then:

1. AdSense → **Ads → Auto ads → OFF** for stockswatch.cc  
2. **Ads → By ad unit → Display** — create 2 responsive units → paste IDs into the slot vars  
3. Deploy `main` (workflow already passes these into the Astro build)  
4. Confirm `https://stockswatch.cc/ads.txt` contains:
   `google.com, pub-6564901086381119, DIRECT, f08c47fec0942fa0`  
5. View source on `/` → meta + script when gates pass; 404 has neither  

Until slot IDs exist, keep CLIENT + VERIFY_META for **ads.txt + meta** verification but leave live units disabled; enable `PUBLIC_ADSENSE_ENABLED=true` only after the site is ready to serve approved units.

## Local

```bash
cd stocks/radar
cp .env.example .env   # example already has your ca-pub
npm run dev            # dashed preview slots (Google rarely fills localhost)
```

## How it works here

| Mode | When | What you see |
|------|------|----------------|
| **Preview** | `npm run dev` | Dashed placeholders for board + footer |
| **Live** | Prod build, custom domain, CLIENT + slots, content gate | Real units after screener |
| **Off** | `ENABLED=false`, empty client, or non-custom-host URL | No slots / no live units |

## Files

| Path | Role |
|------|------|
| `src/lib/adsense.ts` | Domain / content / placement gates |
| `src/components/AdSlot.astro` | Unit + preview |
| `src/pages/index.astro` | NBIS home ad gate + post-content placement |
| `src/layouts/BaseLayout.astro` | Archive watchlist script + meta |
| `scripts/ops/write-seo-files.mjs` | `ads.txt`, robots, sitemap |
