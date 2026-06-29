# Stocks Radar

A single-page watchlist for you and your friends — what you **own**, what you're **waiting on** (price targets), and what you're **watching** long-term.

> ⚠️ Not financial advice. Personal tooling for tracking tickers and theses with friends.

## What it does

- **Three buckets** — Currently Holding, Waiting on Price Targets, Long-Term Watchlist
- **Live-ish quotes** — pulls from Yahoo Finance client-side (falls back to manual prices in the data file)
- **Target distance** — shows how far each ticker is from its target (% above/below)
- **Holdings screenshots** — drag-and-drop broker screenshots; stored in **IndexedDB** on your device (never uploaded)

## Quick start

```bash
cd stocks/radar
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Updating the watchlist

Edit `src/data/watchlist.ts` — each stock entry looks like:

```ts
{
  id: "nvda-owned",
  symbol: "NVDA",
  name: "NVIDIA",
  category: "owned",        // "owned" | "targets" | "watching"
  lastPrice: 135.5,         // fallback if live quote fails
  targetPrice: 180,
  targetNote: "Trim 25% above $175",
  thesis: "AI infra leader — holding through next earnings.",
  addedBy: "J",             // who flagged it
  holder: "J",              // for owned positions
}
```

Commit and push — everyone sees the updated list on refresh.

## Holdings screenshots

1. Enter your initials (saved in `localStorage`)
2. Drop a screenshot from your broker app
3. Thumbnails appear in the grid — click to enlarge
4. "Clear my uploads" removes only your initials' images

Screenshots stay in **your browser**. They won't sync to other devices or friends unless you share the page another way. That's intentional — no server, no accidental exposure of portfolio values.

## Build & deploy

```bash
npm run build    # output → dist/
npm run preview  # serve dist/ locally
```

Static output works anywhere: S3 + CloudFront, Netlify, Vercel, GitHub Pages, or `npx serve dist`.

## Project layout

```
stocks/radar/
  src/
    data/watchlist.ts      # shared ticker list (edit this)
    components/            # StockCard, sections, upload panel
    pages/index.astro      # the one page
    styles/global.css
  public/favicon.svg
```

## Privacy

- Watchlist data is in the repo (tickers and theses only — no account info)
- Screenshot blobs live in IndexedDB locally
- Live prices fetched directly from Yahoo Finance in the browser

## License

Same as the parent repo — [MIT](../../LICENSE).
