# Live SEO Probe — 2026-10-23 (Grok discrete cycle)

**Probe time:** ~2026-10-23 18:00 UTC (this session)
**Origin:** https://life-lived-network.lovable.app
**Main SHA at probe:** `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`

## Results (unauthenticated public GET)

### robots.txt
- URL: https://life-lived-network.lovable.app/robots.txt
- HTTP 200, `text/plain`
- Content: platform-default blanket Allow only (Googlebot, Bingbot, Twitterbot, facebookexternalhit, *)
- Zero `Disallow` rules
- No `Sitemap:` directive
- Does **not** match repository source

### sitemap.xml
- URL: https://life-lived-network.lovable.app/sitemap.xml
- HTTP 404 rendered as app HTML "Page not found" (not XML)
- `/api/public/sitemap.xml` likewise 404 HTML

## Repository state (main)
- `public/robots.txt` and `robotsTxt()` emit Disallows for all `PRIVATE_PATHS` (including `/memories`, `/partners`, `/partner-tracker`, `/earn`, etc.) + Sitemap directive.
- Dynamic routes: `src/routes/robots[.]txt.ts`, `src/routes/sitemap[.]xml.ts`.
- PR #129 (merged) aligned private-route Disallows. Source is consistent.
- #335 (open, green Verify + CodeQL) further hardens sitemap completeness/fail-closed.

## Assessment
Source (static + dynamic + policy) is aligned and honest. Live published host serves Lovable platform default robots and 404s sitemap paths. Gap is published-build / hosting configuration / sync parity, not missing repo files.

**Human action required:** Authorize republish of current main (or diagnose platform override of `public/` + dynamic routes). Then re-probe both URLs. Until then, live crawler policy is non-authoritative.

No fabricated pages. Indexability gate remains on real records only. `findSupply()` sole discovery engine. No production secrets/DB/RLS touched.

Evidence or it did not happen.
