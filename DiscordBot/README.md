# GrowthBot (Discord Stock Bot)

GrowthBot turns your trading or investing community into a subscription business. It combines live market data, AI commentary, automated watchlists, and licensing rails so you can sell premium access to multiple Discord servers with minimal effort.

## Features

- **Live market intel** – real-time quotes, option P/L calculator, and configurable watchlist embeds.
- **AI-powered insights** – premium plans unlock OpenAI summaries, outlier detection, and analyst target consolidation.
- **Automated earnings digest** – daily posts highlighting upcoming earnings for watched tickers.
- **Productized onboarding** – auto-DM welcome playbook, `/plans` upsell command, and in-app pricing copy.
- **License enforcement** – gated features, trial expiry handling, and per-server license activation keys.
- **Passive-income ready** – resale-friendly licensing flow and upsell reminders baked into responses.

## Quick start

1. Install dependencies and copy `.env.example` (create one if needed) with your Discord token.
2. Set up required environment variables:

   ```bash
   DISCORD_TOKEN=...          # Bot token
   CLIENT_ID=...              # Application ID
   GUILD_ID=...               # Development guild for slash-command registration
   PREFIX=!                   # Optional message prefix
   OPENAI_API_KEY=sk-...      # Optional for AI analysis
   LICENSE_SECRET=supersecret # Required for license signatures
   SALES_URL=https://growthbot.yourbrand.com
   SUPPORT_EMAIL=you@yourbrand.com
   TRIAL_DAYS=7
   FREE_WATCH_LIMIT=3
   FREE_MIN_INTERVAL=300
   ```

3. Launch with `npm start` once environment is configured.

Slash commands are registered automatically on startup for the guild specified by `GUILD_ID`.

## Licensing workflow

The bot ships with HMAC-signed license keys. Generate keys anywhere (Node REPL, serverless function, etc.):

```bash
node -e "import('./license-manager.js').then(m => console.log(m.generateLicense({ tier: 'pro', guildId: '123456789012345678', expiresAt: '2025-12-31' })))"
```

- Distribute the printed key to your customer.
- Inside Discord, they run `/license activate <KEY>` (or `!license activate <KEY>`).
- The bot validates the signature with `LICENSE_SECRET` and unlocks premium features until `expiresAt`.
- `/license status` shows the current tier, features, and expiry date.

### Plan tiers

| Tier        | Pricing suggestion | Included features |
|-------------|--------------------|-------------------|
| Free        | $0                 | Quotes, options P/L, watchlist (3 tickers @ ≥5 min) |
| Pro         | $19/server/mo      | Unlimited watchlist, 60s refresh, AI analysis, daily earnings digest |
| Enterprise  | $49/server/mo      | Everything in Pro + webhook/CRM integrations, priority support |

Trials are automatically provisioned for new guilds (`TRIAL_DAYS`), and the background scheduler enforces free-tier limits once a trial expires.

## Upsell tooling

- `/plans` – share pricing and feature differences.
- `/license` – activate, revoke, and check plan status.
- Auto welcome message (on `guildCreate`) posts a conversion-focused onboarding checklist.

Tweak copy by editing the strings in `bot.js` (`plansEmbed`, `featureGateMessage`, and `onboardingEmbed`).

## Data sources

- [Yahoo Finance](https://www.yahoofinanceapi.com/) via `yahoo-finance2`
- OpenAI Chat Completions (optional)

## Contributing

1. Fork or clone the repo.
2. Run `npm install`.
3. Create feature branches, run `npm start` locally (with a test guild), and open PRs with screenshots or GIFs where relevant.

License keys rely on a shared secret—keep `LICENSE_SECRET` secure and rotate as needed.
