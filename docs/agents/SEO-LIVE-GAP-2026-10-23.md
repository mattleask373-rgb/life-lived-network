# Live SEO Gap Probe — 2026-10-23

## Evidence (this discrete cycle)

- **main SHA:** `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`
- **Source robots.txt** (public/robots.txt on main): contains private-route Disallow rules for * and OAI-SearchBot, plus `Sitemap: https://life-lived-network.lovable.app/sitemap.xml`.
- **Live GET https://life-lived-network.lovable.app/robots.txt** (2026-10-23 ~09:10 UTC):
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
  Platform-default blanket Allow. No Disallow, no Sitemap directive.
- **Live GET https://life-lived-network.lovable.app/sitemap.xml**: HTTP 200 but body is HTML 404 page ("Page not found").

## Classification

Published-build / hosting configuration gap. Source assets and routes are aligned; the live origin is serving platform defaults / missing sitemap route. Not evidence of data exposure. No production settings changed.

## Related

- Issue #263 (live SEO probe / owner action).
- Issue #128 (SEO hygiene).
- Prior STATUS.md notes on the same gap.
- Open draft PR #335 (fail-closed on incomplete sitemap scans) is orthogonal (source completeness).

## Next (human-owned)

1. Confirm published build SHA matches current main.
2. Authorize and perform deploy / hosting config update so live robots.txt and sitemap.xml match source.
3. Re-run live GETs and the scheduled seo-live-smoke workflow.
4. Do not claim indexability or SEO readiness until live parity is evidenced.

No inventory, users, or traction fabricated. findSupply() remains sole discovery engine. place_memories owner-only.
