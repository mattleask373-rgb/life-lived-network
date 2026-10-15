# SEO Live Gap Analysis — 2026-10-15

## Purpose
Evidence-backed snapshot of the gap between repository source on `main` and the published Lovable deployment. This is not a claim that pages have been indexed or that private content is exposed. Robots.txt is crawler guidance, not access control.

## Source of truth (main SHA `5f06fc336a748cf37c6a06ac272bee4a387bd745`)
- `public/robots.txt` contains:
  - `User-agent: *`
  - `Allow: /`
  - Explicit `Disallow` for `/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`
  - `Sitemap: https://life-lived-network.lovable.app/api/public/sitemap.xml`
- `src/lib/seo.ts` defines `PRIVATE_PATHS` including the above plus `/memories`, `/partners`, `/partner-tracker`.
- `src/routes/api/public/sitemap[.]xml.ts` and `sitemap-pages[.]xml.ts` implement sitemap index and pages routes.

## Live deployment (https://life-lived-network.lovable.app)
Fetched 2026-10-15 ~01:11 UTC via HTTP:

**robots.txt** (HTTP 200, text/plain):
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
- No `Disallow` rules.
- No `Sitemap` directive.
- Differs from repository `public/robots.txt`.

**Sitemap paths** (HTTP 404 HTML):
- `/sitemap.xml`
- `/api/public/sitemap.xml`
- `/api/public/sitemap-pages.xml`

## Implications
- The published site is not currently serving the repository's static `public/robots.txt`.
- Sitemap routes defined in source are not reachable on the live deployment (404).
- PR #129 (draft, green CI) aligns additional private paths in the static robots file but does not address the live serving gap.
- No evidence here of indexed private pages; indexability control also exists via `noindex` meta in `privatePage()`.

## Recommended next actions (human-gated)
1. Confirm whether Lovable overrides or ignores `public/robots.txt` on publish.
2. Verify whether API routes under `src/routes/api/public/` are deployed and routed correctly.
3. After confirming serving behavior, update robots/sitemap as needed and re-verify live responses.
4. Keep PR #129 open for the static private-path alignment once the live base is confirmed.

## Safety
Read-only live fetches only. No production changes, no credentials, no merge, no deployment.
