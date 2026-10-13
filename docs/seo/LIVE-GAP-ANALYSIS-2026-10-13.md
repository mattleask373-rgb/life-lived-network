# Live SEO Gap Analysis — 2026-10-13

Evidence-backed comparison of repository `main` vs published https://life-lived-network.lovable.app.

## robots.txt

### Repository (main @ 5f06fc336a748cf37c6a06ac272bee4a387bd745)
```
User-agent: *
Allow: /

# Personal, private and internal screens. Nothing useful for a search engine,
# and nothing anyone else should be shown.
Disallow: /auth
Disallow: /profile
Disallow: /conversations
Disallow: /need
Disallow: /help
Disallow: /moderation
Disallow: /sources

Sitemap: https://life-lived-network.lovable.app/api/public/sitemap.xml
```

### Live (fetched 2026-10-13)
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
- No Disallow rules present.
- No Sitemap directive.
- HTTP 200, content-type text/plain.

### Gap
Live robots.txt does not yet enforce the private-route Disallows present on main (and expanded in open draft PR #129). Private paths (`/auth`, `/profile`, `/memories`, etc.) are currently crawlable if discovered.

PR #129 (green on Verify) aligns repo robots.txt with `PRIVATE_PATHS` in `src/lib/seo.ts` and adds a regression test. It remains draft / human-gated and has not been deployed.

## Sitemap

- Repository robots.txt points to `https://life-lived-network.lovable.app/api/public/sitemap.xml`.
- Live fetch of that URL returns HTTP 404 (HTML page-not-found).
- Live fetch of `/sitemap.xml` also 404.
- No public sitemap is currently served.

## Implications
- Crawler policy on the published site is currently more permissive than the repository intends.
- Sitemap absence is consistent with current sparse public surface (demo locality, limited PUBLIC_PATHS).
- No fabricated inventory or availability is claimed; home page correctly shows quiet states ("0 things", "It's quiet here") for the demo place.

## Recommended next
1. Human review + merge of #129 (or equivalent) then redeploy so live robots.txt matches.
2. Decide whether/when to implement and serve the sitemap endpoint referenced in robots.txt (only real public paths; no invented pages).
3. Re-audit live after deploy.

Evidence collected via direct HTTP GET; no production mutation performed.
