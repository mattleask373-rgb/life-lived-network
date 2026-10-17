# Live SEO robots/sitemap gap — 2026-10-17

**Status:** evidence-backed observation. Not a claim of indexation, crawl budget, or production impact.

## Source of truth

- Repository `main` SHA: `5f06fc336a748cf37c6a06ac272bee4a387bd745`
- `public/robots.txt` on main already contains:
  - `Disallow: /auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`
  - `Sitemap: https://life-lived-network.lovable.app/api/public/sitemap.xml`
- Draft PR [#129](https://github.com/mattleask373-rgb/life-lived-network/pull/129) further aligns Disallows with `PRIVATE_PATHS` (`/memories`, `/partners`, `/partner-tracker`) and adds a regression test. CI green on current base. Still draft.

## Live origin evidence (fetched 2026-10-17)

| URL | Result |
|-----|--------|
| `https://life-lived-network.lovable.app/robots.txt` | HTTP 200. Platform blanket: `User-agent: Googlebot` / `Bingbot` / `Twitterbot` / `facebookexternalhit` / `*` all `Allow: /`. **Zero Disallow rules. No Sitemap line.** |
| `https://life-lived-network.lovable.app/sitemap.xml` | App 404 page ("Page not found"). |
| `/api/public/sitemap.xml` | Not re-fetched this cycle; prior reports indicated 404. |

## Gap classification

- **Source vs published:** repo `public/robots.txt` is not the content being served by the live origin.
- **Likely cause:** Lovable platform default robots override or static-asset publish step not surfacing `public/robots.txt`. Unknown without platform config inspection.
- **robots.txt is crawler guidance only**, not access control. Private routes remain protected by application auth/RLS regardless of robots.
- **Sitemap:** endpoint appears unimplemented or not published. Do not generate locality/content pages until real public data exists (no fabricated inventory).

## What this does **not** prove

- That any private route has been indexed.
- That the platform robots will or will not be overridden after merge of #129.
- Live crawl behavior, Search Console data, or indexation status (NOT RUN).

## Recommended human actions

1. Confirm how the published Lovable origin selects robots.txt (platform default vs `public/robots.txt`).
2. After any merge of #129 (or equivalent), re-fetch live robots.txt and sitemap to verify the gap closes.
3. Keep #129 draft until the publish path is understood; merging source alone does not close the live gap.
4. No generated public locality pages until useful, consented, non-fabricated data exists.

## Safety

No merge, no deploy, no production data, no credential change, no second discovery engine. place_memories remain owner-only and never feed discovery or sitemaps.

Evidence: this file, Issue #125 comment of the same cycle, live HTTP fetches, repo file contents.
