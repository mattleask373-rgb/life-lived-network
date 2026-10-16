# Live SEO gap evidence — 2026-10-16

**Status:** Evidence record only. No production change, no crawl claim, no indexation claim.

## Verified observations (this cycle)

| Endpoint | Observed | Notes |
|----------|----------|-------|
| `https://life-lived-network.lovable.app/robots.txt` | HTTP 200, platform default | `User-agent: Googlebot/Bingbot/Twitterbot/facebookexternalhit/*` all `Allow: /`. **Zero Disallow rules. No Sitemap line.** |
| `https://life-lived-network.lovable.app/sitemap.xml` | App 404 page | Not a valid sitemap. |
| `https://life-lived-network.lovable.app/api/public/sitemap.xml` | App 404 page | Not a valid sitemap. |

## Repo contrast (main `5f06fc3`)

- `public/robots.txt` contains explicit `Disallow` for `/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources` and a Sitemap line pointing at the API path.
- Open draft PR #129 (CI **PASS**) further aligns private paths (`/memories`, `/partners`, `/partner-tracker`), adds regression tests, and a generator so static and dynamic policies stay consistent.

## Gap

Live origin is not serving the current repository robots content or a sitemap. This is a deployment/publish/platform-static override gap, not a missing repo policy.

## Not claimed

- No full crawl performed.
- No indexation status asserted.
- No fabricated pages, inventory, or availability.
- Merging #129 alone does not guarantee the live origin will serve the new robots until the platform publishes the static file or the dynamic route is hit.

## Next human action

1. Review and merge #157 (env hygiene) first.
2. Review #129 and confirm how Lovable/platform serves `public/robots.txt` vs a dynamic route.
3. After publish, re-probe the same three URLs.

Evidence or it did not happen.
