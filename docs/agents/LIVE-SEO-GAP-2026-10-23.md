# Live SEO Gap Evidence — 2026-10-23

## Purpose
Evidence-only snapshot of the current mismatch between repository source `public/robots.txt` (and planned sitemap generation in open PR #335) and the published Lovable host. No claims of deployment, indexation, or resolution.

## Probe timestamp
2026-10-23 ~22:12 UTC

## Source (main `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`)
File: `public/robots.txt`

- Contains specific Disallow rules for private routes: `/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`, `/memories`, `/partners`, `/partner-tracker`, `/earn`.
- Includes `Sitemap: https://life-lived-network.lovable.app/sitemap.xml`.
- Notes about OAI-SearchBot and intentional crawlability of `/life-list` for noindex observation.

## Live host
Host: `https://life-lived-network.lovable.app`

- `GET /robots.txt` → HTTP 200, generic default content:
  ```
  User-agent: Googlebot
  Allow: /
  User-agent: Bingbot
  Allow: /
  User-agent: Twitterbot
  Allow: /
  User-agent: *
  Allow: /
  ```
  (No Disallow rules, no Sitemap directive.)
- `GET /sitemap.xml` → HTTP 404.

## Related work
- Open PR #335 (`fix(seo): harden sitemap completeness and live verification`) aims to generate static robots/sitemap at build time from the route registry and validated origin. Its current CI is failing; independent review and owner-authorized deploy are required before any live change.
- Prior coordination notes (Issue #125, Issue #263) have flagged the hosting parity gap.

## Invariants
- No merge to main, no force-push, no production DB/RLS/credential changes.
- This document is evidence only. Live gap remains until an authorized deploy occurs.
