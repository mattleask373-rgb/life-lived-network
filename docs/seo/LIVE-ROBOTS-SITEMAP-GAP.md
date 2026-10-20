# Live robots.txt / sitemap gap analysis — 2026-10-20

## Evidence

- Merged PR #129 (`seo: keep private routes out of crawler paths`) updated `public/robots.txt` on main (SHA `9269dff0fb66911733ea309fd7342d86bb60c112`) to Disallow private routes (`/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`, `/memories`, `/partners`, `/partner-tracker`, `/earn`) and reference `Sitemap: https://life-lived-network.lovable.app/sitemap.xml`.
- Source of truth: repository `public/robots.txt` at main SHA `9269dff`.
- Live origin `https://life-lived-network.lovable.app/robots.txt` (fetched 2026-10-20) returns the default Lovable template:
  ```
  User-agent: Googlebot
  Allow: /
  ...
  User-agent: *
  Allow: /
  ```
  No Disallow rules matching the private paths. Crawler policy on the published origin does **not** match the repository.
- Live `https://life-lived-network.lovable.app/sitemap.xml` returns an HTML 404 page, not an XML sitemap. The Sitemap directive in the repository robots.txt points to a non-existent resource on the live origin.

## What this is not

- Not access control. robots.txt is crawler guidance only.
- Not a claim that private content is exposed. Separate auth-guard tests (PR #156) and RLS remain the relevant boundaries.
- Not a production deploy or config change. This document records the observed gap only.

## Next human action

1. Confirm whether the Lovable publish/deploy pipeline has picked up the post-#129 `public/robots.txt` and any static sitemap generation.
2. If the static files are not served from `public/`, decide whether to add a server route for `/robots.txt` and `/sitemap.xml` that emit the current policy, or trigger a full publish from current main.
3. Re-check live robots.txt and sitemap after the next deploy. Do not treat repository presence as live evidence.

No merge, deploy, credential, RLS, or production data change performed by this cycle.
