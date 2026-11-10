# Local creator-content candidate — November 10, 2026

The owner approved this scoped creator-content update and publication after
validation. Social-platform publication and account/settings changes are excluded.

The home page adds the approved Pick My Next Book artwork and verified published
vote destinations on Facebook, Instagram, TikTok and YouTube. Three additional
cards link to verified published reflection, headphone-review and gameplay
videos. These are a curated selection, not an automatically synchronized feed.
The source inventory is `src/data/videos.mjs`, recovered from public publication
receipts in Content Desk revision 390. A scheduled/prepared record or a URL alone
does not qualify for the shelf. Unverified and scheduled items were excluded.

The approved cover is `src/assets/pick-my-next-book-cover.png`, SHA-256
`eb3c3fd35740ec4e611119266537794d90cad3628e9a0ac2bdb670075620cdd2`.
It is rendered in full, without cropping its title, and optimized by Astro.
Legacy raw-photo cover proposals were not substituted for this approved artwork.

About now leads with books, personal reflections and gaming. The existing
professional background, guides, toolkit and consulting remain secondary and
available. The complete public-profile section and `/about#profiles` anchor are
preserved, including the J Sol Facebook creator Page.

One shared responsive navigation exposes Stories (/#stories), Watch
(/#recent-videos), Links and About. On mobile it remains visible and wraps in
normal document flow, with 44px touch targets. There is no overlay or dismissal
state to obscure anchor targets. Native fragment navigation focuses the existing
tabindex=-1 sections; keyboard focus outlines remain visible. Practical guides,
toolkit, consulting and /about#profiles stay available in the footer. Existing
/links#watch and /#watch channel sections remain available. No JavaScript or
security-policy exception is used.

`public/social/j-sol-share.png` is a branded 1200×630 PNG generated from the
code-native `src/assets/j-sol-share.svg`. Regenerate with `npm run share:image`.
The shared layout adds absolute Open Graph and large-card image metadata.

Local verification commands:

- `npm test`
- `npm run typecheck`
- `npm run build` with offline skip variables
- `npm run verify:dist`
- `npm run verify:creator` (built-file checks; no browser or external requests)
- `npm run security:dist` and `npm run policy:dist`

Chrome validation covers responsive layout and WCAG checks at
320/390/768/1024/1440px, 200%-equivalent CSS viewport reflow, repeated mobile
Stories/Watch selections with unobscured and focused targets, keyboard navigation
with scripts disabled, the full cover, About hierarchy and share metadata.
All seven video destinations were freshly opened in Chrome on November 10 and
showed the expected published creator/content. Authenticated platform access does
not establish logged-out or region-specific availability.

The former native-popover same-page dismissal regression is fixed by replacing
the overlay with visible navigation. The global deny-all script CSP and all
security settings remain unchanged. Edge was not used.

Release checks: 110 unit tests and 53 installed-Chrome browser cases passed,
with successful typecheck, build, distribution/creator/security/policy checks
and zero npm-audit vulnerabilities. Reflow is modeled at 720 CSS pixels rather
than changing the browser's toolbar zoom setting.
