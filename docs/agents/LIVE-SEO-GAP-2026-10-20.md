# Live SEO Gap Evidence — 2026-10-20

## Status
**Code on main is ahead of published origin.** PR #129 (robots/private-path alignment) is merged. `public/robots.txt` on main contains PRIVATE_PATHS Disallows + Sitemap directive. Live site does not.

## Fresh evidence (2026-10-20T06:09Z, public HTTP, no auth)
- `https://life-lived-network.lovable.app/robots.txt` → HTTP 200, platform-default:
  ```
  User-agent: Googlebot
  Allow: /
  ...
  User-agent: *
  Allow: /
  ```
  Zero Disallow rules. No Sitemap line.
- `https://life-lived-network.lovable.app/sitemap.xml` → 404 (app page).

## Interpretation
Lovable/platform static file serving is either lagging the Git deploy or overriding `public/robots.txt` + `sitemap.xml`. This is crawler guidance only; not access control. No product claim of indexability control until live matches code.

## Next
Human/platform owner: confirm Lovable publish behaviour for static public files, or trigger explicit publish of current main. Independent review of open green PRs (#154 discovery, #156 auth tests) remains higher priority than further SEO code.

Evidence only. No fabricated availability or traction.
