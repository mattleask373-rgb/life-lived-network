# Live SEO Gap Analysis — 2026-10-12

## Purpose
Evidence-backed comparison of published site vs repository robots/sitemap policy. No fabricated inventory or claims of indexing impact.

## Live checks (HTTP GET, this session)
- `https://life-lived-network.lovable.app/robots.txt`
  - Content: permissive only.
  - User-agent blocks for Googlebot, Bingbot, Twitterbot, facebookexternalhit, * — all `Allow: /`.
  - **No `Disallow` rules** for private paths (`/profile`, `/memories`, `/conversations`, `/auth`, etc.).
  - No Sitemap directive observed in the returned body.
- `https://life-lived-network.lovable.app/sitemap.xml` → 404 (Lovable 404 page).
- `https://life-lived-network.lovable.app/api/public/sitemap.xml` → 404 (same).

## Repository state (main `5f06fc336a748cf37c6a06ac272bee4a387bd745`)
- `public/robots.txt` contains Disallows for `/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`.
- Missing Disallows for `/memories`, `/partners`, `/partner-tracker` (present in `src/lib/seo.ts` PRIVATE_PATHS).
- Sitemap line points to the 404 endpoint above.

## Related work
- Draft PR #129 (https://github.com/mattleask373-rgb/life-lived-network/pull/129): adds the missing Disallows + regression test that every PRIVATE_PATHS entry has a matching Disallow. CI verify green on current main base. Draft status.
- This is crawler guidance only; does not enforce access control (RLS/auth remain the authority).
- Live published robots does not yet match even the current main robots.txt (deployment lag or separate serving path).

## Limitations / unknowns
- Does not prove current crawl/index status of any URL.
- No production deploy, robots rewrite, or sitemap generation performed.
- Sitemap implementation status (static vs dynamic, data-driven) not audited in this run.

## Recommended next
1. Human review + merge of #129 (or equivalent) after confirming no private content is intended for indexing.
2. Independent live re-check of robots.txt post-deploy.
3. Decide sitemap strategy (static file, dynamic from public places only, or disable until useful content exists). Do not generate fabricated locality pages.

Evidence: open_page fetches of the three URLs; get_file_contents of public/robots.txt on main. Session: 2026-10-12.