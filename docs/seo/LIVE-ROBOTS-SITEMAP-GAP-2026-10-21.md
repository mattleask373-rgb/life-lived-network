# Live robots.txt / sitemap.xml gap — 2026-10-21

Evidence-backed snapshot. No deploy, no fabricated traffic or index claims.

## Repository state (main `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3`)

`public/robots.txt` contains:

- User-agent: * Allow: /
- Disallow for private paths matching `PRIVATE_PATHS` in `src/lib/seo.ts` (`/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`, `/memories`, `/partners`, `/partner-tracker`, `/earn`)
- Sitemap: https://life-lived-network.lovable.app/sitemap.xml

PR #129 (merged 2026-10-19) aligned the file and added regression tests.

## Live origin (https://life-lived-network.lovable.app) — GETs 2026-10-21

| Path | Observed | vs repo |
|------|----------|---------|
| `/robots.txt` | Platform-default Allow-only for Googlebot, Bingbot, Twitterbot, facebookexternalhit, and * | **FAIL** — private Disallows absent |
| `/sitemap.xml` | HTML 404 page ("Page not found") | **FAIL** — no XML sitemap |

Home page loads and shows Lisbon demo content. No claim that private routes are indexed or that search traffic exists.

## Interpretation

- Repo assets and tests are correct and merged.
- Hosting/Lovable publish is serving a different (older/platform) robots.txt and is not emitting the sitemap route or static file.
- robots.txt is crawler guidance only; it is not access control. Private routes remain protected by application auth/session gates (see #214 / #156 lineage).
- Sitemap generation logic (static + dynamic `/api/public/sitemap.xml`) is present in repo but not confirmed live.

## Next human action

1. Authorize a republish or static-asset sync of the current main tree to the Lovable origin.
2. After deploy, re-GET both URLs and record the exact response bodies/headers.
3. Confirm sitemap only lists PUBLIC_PATHS and that private paths remain Disallowed.
4. Do not treat this gap as a security incident until a crawler actually indexed private content (none observed here).

No production DB, RLS, credentials, or merge performed. findSupply() untouched.
