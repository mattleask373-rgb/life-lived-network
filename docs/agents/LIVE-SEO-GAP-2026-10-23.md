# Live SEO Gap Evidence — 2026-10-23 / 2026-10-24

## Purpose
Evidence-only snapshot of the current mismatch between repository source `public/robots.txt` (and dynamic routes / planned build-time generation in open PR #335) and the published Lovable host. No claims of deployment, indexation, or resolution.

## Probe timestamps
- 2026-10-23 ~22:12 UTC (initial)
- 2026-10-24 ~01:33 UTC (confirmation; same gap)
- 2026-10-24 ~08:33 UTC (fresh confirmation; gap unchanged)
- 2026-10-24 ~11:33 UTC (fresh confirmation; gap unchanged)

## Source (main `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`)
File: `public/robots.txt`

- Contains specific Disallow rules for private routes matching `PRIVATE_PATHS` in `src/lib/seo-route-policy.ts`: `/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`, `/memories`, `/partners`, `/partner-tracker`, `/earn`.
- Includes `Sitemap: https://life-lived-network.lovable.app/sitemap.xml`.
- Dynamic route `src/routes/robots[.]txt.ts` generates equivalent content from `robotsTxt()` in `src/lib/seo.ts` (sourced from `PRIVATE_PATHS`).
- Notes about OAI-SearchBot and intentional crawlability of `/life-list` for noindex observation.

## Live host
Host: `https://life-lived-network.lovable.app`

- `GET /robots.txt` → HTTP 200, generic default content (confirmed 2026-10-24 ~11:33 UTC):
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
  (No Disallow rules, no Sitemap directive. Differs from both static `public/robots.txt` and dynamic route output.)
- `GET /sitemap.xml` → HTTP 404 (app 404 page; no XML).
- `GET /api/public/sitemap.xml` → HTTP 404 (app 404 page).

## Related work
- Merged PR #129 aligned static `public/robots.txt` with `PRIVATE_PATHS` and added regression tests. Live host does not yet reflect it.
- Open PR #335 (`fix(seo): harden sitemap completeness and live verification`) aims to generate static robots/sitemap at build time from the route registry and validated origin, plus completeness checks. Its current exact-head Verify is failing on dependency audit (Zod advisory); independent review and owner-authorized deploy are required before any live change.
- Dynamic server routes for `/robots.txt` and `/sitemap.xml` exist in source but are not observed on the published host (static file or platform default takes precedence, or deploy lag).
- Prior coordination notes (Issue #125, Issue #263) have flagged the hosting parity gap.

## Invariants
- No merge to main, no force-push, no production DB/RLS/credential changes.
- This document is evidence only. Live gap remains until an authorized deploy of source that serves the aligned robots/sitemap occurs.
- Indexability gate stays honest (≥3 real records); no fabricated pages.
