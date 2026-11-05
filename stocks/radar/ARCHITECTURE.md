# J Sol architecture

## Purpose and scope

J Sol is Jacob's creator home base, leading with stories, small discoveries and his public personal channels
and keeping practical AI, automation and systems notes and consulting available.
It reuses stockswatch.cc and the existing static Astro/TypeScript application and
Cloudflare Pages hosting. The owner explicitly retired the StocksWatch product
on October 5, 2026. There are no new services, accounts, databases or payments.

## Active pages

- `/`: creator introduction, decorative editorial hero, topic cards linking to Substack/Goodreads/Twitch, core-channel shortcuts and a route to the grouped links hub. Guides and consulting remain accessible through the footer and hub.
- `/guides`: the complete three-guide library.
- `/guides/[slug]`: static articles from `src/data/guides.ts`.
- `/links`: personal referrals with adjacent benefit disclosures, and a shared home for future labeled affiliate links and paid partnerships. Inventory: `src/data/referrals.ts`. No tracking, forms or embeds.
- `/resources`: tools evidenced by this repository, without affiliate links.
- `/consulting`: the approved $750 USD Monitoring & Alert Health Check, with
  clearly illustrative examples and assessment boundaries. The inquiry CTA opens
  the owner's exact public Upwork profile URL in a new tab; there is no email
  inquiry link, embedded form, booking system or payment integration.
- `/about`: owner-provided professional background and project philosophy, plus
  a Connect section before the biography with verified Facebook creator Page, YouTube, Instagram, TikTok, Twitch, Threads, Goodreads and Substack
  channels, a LinkedIn link and directly visible Guru/Upwork consulting links.
  Service context remains in a native keyboard-accessible details disclosure. The footer retains the `/about#profiles` shortcut; platform links open in a new tab.
  There are no channel embeds, live-status badges, highlight placeholders or
  new visitor/click analytics.

`src/data/profiles.ts` is the shared inventory of owner-confirmed public URLs;
`SocialChannels.astro` preserves seven verified profile cards on About. `CoreChannels.astro` and `DestinationCard.astro` render the shared channel shortcuts on Home and Links. J Sol / Jacob is the public brand; existing routes, article content and favicon are retained. Shared design follows the approved Figma concept: warm paper, green ink, locally hosted DM Sans and Playfair Display, and an optimized editorial still life. Connect has a wider creator-focused panel;
article reading width remains bounded. Motion is limited to hover feedback and
disabled for reduced-motion preferences. No remote fonts or image assets are used.
- `/privacy`: current data-handling explanation and legacy-service caveat.
- Retired research/product URLs: noindex retirement notices with a link to guides.

`PersonalLayout.astro`, `personal.css` and `creator.css` provide the active shell and responsive
styles. No client JavaScript is required. The mobile menu uses the native HTML popover API with keyboard focus, Escape and light dismissal; a visible Close control is provided. Fonts and the optimized hero image are hosted locally, with no third-party asset requests.
Canonicals, sitemap entries and internal links use extensionless routes, matching
Cloudflare Pages' direct 200 responses; the physical build still contains .html files.
Each guide owns its date-only publication/modification values using the owner's
Pacific calendar dates, links to the author and
other guides, and emits article Open Graph plus BlogPosting JSON-LD metadata.
The resources page links to official documentation for the four existing tools.
The previous layout/styles and domain-specific libraries remain available locally,
but are not imported by active pages. Archived pages and tests are preserved in
`archive/stockswatch-retired/` outside the application and active browser suite.

## Build and release

`npm run build` writes build metadata and SEO files, builds static pages, and
removes retired market data, health/settings feeds, downloads and advertising
metadata from the distribution. It performs no live market-data requests.
`verify:dist` checks active routes and excludes retired/private artifacts;
`security:dist` scans for credentials. `freshness:live` now checks all ten reader-facing pages, valid build metadata
and the expected revision, plus the exact public robots and ten-route sitemap endpoints, not market-data freshness. It rejects missing pages,
homepage fallbacks, malformed metadata and a different deployed revision. This is only suitable after
this redesign is deployed. The underlying checker is `check-personal-live.mjs`.
Its SEO helper uses strict namespace-aware XML parsing for complete `urlset > url > loc`
entries. Robots validation checks actual reader and discovery paths for the default
group, Googlebot and Bingbot, merging repeated named groups without inheriting the
wildcard group. Prefix/wildcard/anchor matching uses longest-rule precedence with
Allow winning ties; unrelated crawler and private-path restrictions remain valid.

Run npm test, npm run typecheck, npm run build, npm run verify:dist,
npm run security:dist, npm run policy:dist and npm run test:e2e for release verification.

The owner explicitly approved the workflow transition and publication on October 6,
2026. This revision changes the parent publishing workflow to manual dispatch only;
there are no scheduled or push-triggered deployments and no NBIS data fetch.
Dependency audit, source checks, build, release/security scans and browser checks
run before upload. PR/main-push validation retains the Python and legacy source
checks and the Terraform job. The obsolete NBIS/AdSense build checklist is replaced
by policy:dist, which rejects ads, analytics, forms, iframes and third-party scripts
and requires noindex on error and retirement pages. Existing secrets and hosting
resources are unchanged. Protected-main review/merge requirements still apply.

## Content rules

Keep three loose themes, with no empty category pages. Use real project history or
clearly illustrative examples; do not invent personal experience, savings, revenue,
endorsements or demand. Review owner-attributed copy before publishing. No publishing
quota, paid-product expansion, analytics or newsletter funnel is required for V1.

Private products, sandbox delivery code and external newsletter/payment accounts
have not been deleted or cancelled. They are not linked from the new interface.
Website retirement does not imply cancellation of external billing or subscriptions.

Goodreads is labeled Books & reviews and points to the owner-confirmed public
profile. This is a profile link; it does not imply written reviews or live syncing.

Substack links to the owner-confirmed Jsol’s Space publication at
https://idolorthoughts.substack.com/. This is a public link only; it does not
embed a signup form, synchronize accounts or publish content.


## November 4 creator navigation

The approved Figma home and links concept is implemented in Astro. Home topic cards lead to the owner-confirmed Substack, Goodreads and Twitch URLs; no empty topic pages or invented posts are created. `/links` groups the core channels, reading/writing, resources, personal referrals and professional work. Upwork and Guru have separate links. Facebook links to the owner-confirmed creator Page at `https://www.facebook.com/profile.php?id=61596047859545`; the personal Facebook profile is intentionally separate. Snapchat is omitted. Footer and mobile navigation retain guides, toolkit, consulting and `/about#profiles` access. The HSA referral benefit stays beside its link; privacy and toolkit copy explain the separation.

Source hero: Figma node 2:30, AI-generated editorial still life, used decoratively with empty alt text and Astro responsive WebP variants. Font licenses are retained in `public/fonts`. No security-header changes, tracking or embedded channels were added.

The `/about#profiles` section renders the same `facebookPage` destination used by Home and Links, via the shared DestinationCard, before the preserved seven other channel cards.
