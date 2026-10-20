# Live robots.txt / sitemap gap — 2026-10-20

## Status

Repo source on `main` is aligned (via merged PR #129). Published origin is not.

## Live evidence (public HTTP, no auth, 2026-10-20)

- https://life-lived-network.lovable.app/robots.txt → HTTP 200, platform-default blanket Allow:
  ```
  User-agent: Googlebot
  Allow: /
  User-agent: Bingbot
  Allow: /
  User-agent: Twitterbot
  Allow: /
  User-agent: facebookexternalhit
  Allow: /
  User-agent: *
  Allow: /
  ```
  Zero Disallow rules. No Sitemap directive.

- https://life-lived-network.lovable.app/sitemap.xml → app 404 page.
- https://life-lived-network.lovable.app/api/public/sitemap.xml → app 404 page.

## Repo alignment (current main)

- `public/robots.txt` matches `robotsTxt()` in `src/lib/seo.ts` (single `PRIVATE_PATHS` + `SITE_ORIGIN` source of truth).
- Disallows for all `PRIVATE_PATHS`: `/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`, `/memories`, `/partners`, `/partner-tracker`, `/earn`.
- `Sitemap: https://life-lived-network.lovable.app/sitemap.xml`.
- Static `public/sitemap.xml` lists exactly existing `PUBLIC_PATHS` (`/`, `/journey`, `/road-trip`, `/life-list`, `/give`, `/make`). No fabricated pages.
- Dynamic server routes present: `src/routes/robots[.]txt.ts` and `src/routes/sitemap[.]xml.ts`.
- Tests in `src/lib/sitemap-privacy.test.ts` enforce the sync and privacy.

## Gap

Published Lovable snapshot is behind current `main` (or the platform is serving its own default robots.txt and not the static `public/` files / TanStack server routes for these paths). Code is correct; live is not.

## Required next (human gate)

Founder / platform owner must republish the published origin from current `main` so `public/robots.txt` (and/or the dynamic routes) take effect, then re-check the live URLs.

robots.txt remains crawler guidance only, not access control. Indexability gate stays honest (≥3 real records for any future locality pages). `findSupply()` remains the sole discovery authority. No second matcher. No fabricated SEO pages.
