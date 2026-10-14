# SEO Live Gap Analysis — 2026-10-13

## Evidence (fetched this cycle)

- **Live robots.txt** (https://life-lived-network.lovable.app/robots.txt):
  ```
  User-agent: Googlebot
  Allow: /
  ... (similar for Bingbot, Twitterbot, facebookexternalhit, *)
  ```
  Zero `Disallow` rules. No `Sitemap` line.

- **Live sitemap.xml** (https://life-lived-network.lovable.app/sitemap.xml): returns the app's 404 page.

- **Repo main `public/robots.txt`** (SHA 5f06fc3...):
  ```
  User-agent: *
  Allow: /
  Disallow: /auth
  Disallow: /profile
  Disallow: /conversations
  Disallow: /need
  Disallow: /help
  Disallow: /moderation
  Disallow: /sources
  Sitemap: https://life-lived-network.lovable.app/api/public/sitemap.xml
  ```

- **PR #129** (draft, Verify PASS): extends Disallows to match `PRIVATE_PATHS` in `src/lib/seo.ts` and adds regression tests. Does not change live deployment.

## Gap

Published Lovable origin is **not** serving the repository's `public/robots.txt` content. It appears to be using a platform default blanket Allow. Sitemap endpoint is not published (404).

This is a **deployment/publish gap**, not a code gap on main. Merging #129 alone will not update the live origin until a publish/deploy occurs.

## Impact

- Private routes (`/auth`, `/profile`, etc.) are crawlable in theory on the live origin.
- No sitemap advertised or available.
- No evidence of indexation status (NOT RUN).

## Safety / next

- No production deploy performed.
- Human decision: confirm whether Lovable publish pipeline respects `public/robots.txt`, or if a platform override / custom domain is required.
- Recommend review of #129, then human-gated publish after merge.
- No fabricated SEO claims or traffic numbers.

Recorded by Grok coordination cycle 2026-10-13. Evidence or it did not happen.
