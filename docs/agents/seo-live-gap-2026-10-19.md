# Live SEO Gap — 2026-10-19

Independent check against published Lovable origin. Not a source claim and not a production change.

## Evidence

| Resource | Live result | Repo source (main `5f06fc3`) | Notes |
|----------|-------------|------------------------------|-------|
| `/robots.txt` | HTTP 200, permissive: specific bots `Allow: /`, `*` `Allow: /`. No `Disallow` lines. | `public/robots.txt` has `Disallow` for `/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`. Missing `/memories`, `/partners`, `/partner-tracker` relative to `PRIVATE_PATHS` in `src/lib/seo.ts`. | Live does not match source. PR #129 aligns source Disallows. |
| `/api/public/sitemap.xml` | HTTP 404, HTML page-not-found. | robots.txt Sitemap line points here; `src/lib/seo.ts` defines sitemap helpers. | Endpoint not serving XML. |

## Observations

- Live deploy is out of sync with current source robots policy.
- Sitemap path returns 404; no public sitemap is currently served.
- `src/lib/seo.ts` already marks private paths with `noindex, nofollow` metadata — robots.txt is supplementary crawler guidance, not access control.
- No locality or fabricated pages were added.

## Recommended next actions (human-gated)

1. Review and merge PR #129 (source robots alignment). Then confirm deploy so live robots updates.
2. Investigate why `/api/public/sitemap.xml` 404s; restore or remove the Sitemap reference until a real sitemap is served.
3. Do not treat robots.txt as security boundary.

## Safety

Read-only check. No merge, deploy, credential, DB, or RLS change. No fabricated inventory.

**NOT RUN:** full crawl, index status checks, production sitemap generation test.
