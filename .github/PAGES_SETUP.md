# GitHub Pages — one-time setup (Stocks Radar)

The deploy workflow pushes built files to the **`gh-pages`** branch at  
`https://jacob-idolor.github.io/Pet_Projects/stocks-radar/`

## Enable Pages (required once)

1. Open **https://github.com/Jacob-Idolor/Pet_Projects/settings/pages**
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**
3. **Branch:** `gh-pages` · **Folder:** `/ (root)` → **Save**
4. Re-run **Stocks Radar — live deploy** (Actions tab → workflow → Run workflow)

After the first successful run, the site should be live within ~1–2 minutes.

## If deploy still fails

- **Branch protection on `gh-pages`:** allow GitHub Actions to push, or disable protection on that branch.
- **Actions permissions:** Settings → Actions → General → **Read and write permissions** (for `GITHUB_TOKEN`).
- **Fork:** Pages must be enabled on your fork separately; workflow runs from `main` only.

## Why not `configure-pages`?

The official `actions/configure-pages` step returns **404 Not Found** until Pages is already enabled with **GitHub Actions** as the source. This repo uses **peaceiris/actions-gh-pages** instead so the first deploy can create/update `gh-pages` without that API call.
