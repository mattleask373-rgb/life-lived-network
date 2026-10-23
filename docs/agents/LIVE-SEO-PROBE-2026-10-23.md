# Live SEO parity probe — 2026-10-23 (refresh)

## Evidence (read-only GETs this cycle, origin https://life-lived-network.lovable.app)

**Source on current main (`182fe7f`)**
- `public/robots.txt` and the generated `robotsTxt()` in `src/lib/seo.ts` both emit private-route Disallows drawn from `PRIVATE_PATHS` (including `/memories`, `/partners`, `/partner-tracker`, `/earn`, etc.), an OAI-SearchBot group, and `Sitemap: ${SITE_ORIGIN}/sitemap.xml`.
- Dynamic routes exist: `src/routes/robots[.]txt.ts` and `src/routes/sitemap[.]xml.ts`.
- `PRIVATE_PATHS` in `src/lib/seo-route-policy.ts` is the single source for Disallow rules.

**Published origin**
- `/robots.txt` returns the platform-default Lovable stub (blanket Allow for Googlebot/Bingbot/Twitterbot/facebookexternalhit/*). No Disallows. No Sitemap directive. HTTP 200.
- `/sitemap.xml` returns HTTP 404 rendered as the app’s HTML “Page not found” page.

## Interpretation
Published build does not match current source. This is a hosting / republish lag or platform static-file serving override, not a source defect. Crawler guidance and sitemap index on source are not yet live. The static `public/robots.txt` and dynamic route are already aligned with each other and with `PRIVATE_PATHS`.

## Safety
- Read-only probe only. No deployment, no production write, no credential, schema, RLS or secret change.
- `findSupply()` remains the sole discovery engine.
- No fabricated pages or inventory. Indexability gate remains honest (≥3 real records).
- Life List stays crawlable so crawlers can observe its noindex metadata; it is not in PRIVATE_PATHS.

## Next human action
Authorize a republish of the current main snapshot (or diagnose why Lovable is serving its default robots.txt and not the app route/static file) then re-verify both URLs with GET. Until then, treat live robots/sitemap as non-authoritative.

Related: Issue #125, Issue #263, merged PR #129, Issue #128.
