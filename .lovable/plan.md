# Read-only Release Readiness Audit — Real World Atlas (23 Oct 2026)

Nothing was edited in the app, committed by hand, synced, deployed or written to the database. The only file written was this plan note.

## 1. Git sync — UNVERIFIED
- I can't read Project Settings → Git from this session. Repository, branch, direction and freshness: **UNVERIFIED**.
- Owner screen: **Project Settings → Git** (desktop: project name → Settings → Git; or chat **+ → Project → GitHub**).
- Verified: code storage is Lovable-internal only (internal git store plus backup). The local git config has no GitHub remote.
- The GitHub API connection is no longer linked to this project, so GitHub main could not be re-read today.

## 2. URLs and domain
- Production: https://life-lived-network.lovable.app (HTTP 200). Preview: the id-preview address, which needs a Lovable sign-in.
- Custom domain: **none attached** (project URL lookup).

## 3. Revision
- Project HEAD now: `cdc16f29f12ef36670af926f1b5d1ab769b26ee6`. It was `7ca12a5…` earlier today; the change is this plan note only. No uncommitted work.
- How it relates to GitHub main: **UNVERIFIED today**. The last owner-supplied check showed `7ca12a5` diverged from main `1f0a5d2…`.
- The commit the live site is built from: **UNVERIFIED**.

## 4. Build, runtime and environment
- Framework: TanStack Start v1 on Vite 7. Target: Cloudflare-Workers-style edge hosting (template `tanstack_start_ts_current`).
- Environment variable names:
  - Provided by the backend: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
  - Project secrets present: `LOVABLE_API_KEY`, `LOVABLE_CRON_SECRET`.
  - Missing: `TICKETMASTER_API_KEY`, so event import is off.
  - Optional: `VITE_SITE_ORIGIN`, `WORLD_FIXTURES`.

## 5. Backend, auth and data
- Lovable Cloud backend: one instance serves both preview and production.
- Auth provider settings: **UNVERIFIED**. Owner screen: **More → Users → Auth settings**.
- Fixtures: the code refuses them in production (`fixturesAllowed()` returns false when NODE_ENV=production). This is proven in code, not live.
- Real data: **no proof**. The last count (8 Oct) was 0 accounts, listings and needs. It was not re-queried, because that would mean reading the database, which you excluded.

## 6. SEO and privacy blockers
| Item | Source | Live |
| --- | --- | --- |
| robots.txt | Lists 11 Disallow rules and a Sitemap line | Generic Googlebot/Bingbot allow-all, 0 Disallow rules, no sitemap — **stale** |
| sitemap.xml | Static file plus a server route | **404** (also `/api/public/sitemap.xml`) |
| /life-list | Marked as a public page (`publicPage`), listed in PUBLIC_PATHS and in the sitemap, not disallowed in robots | Served with 200 and no robots meta. Says "Only you see this" but is indexable — **P1** (fix is in open PRs #253/#271, not in this project) |
| Homepage title | — | Old "The Living World — … Lisbon" |

## 7. Safe sequence (same project, keep the current site up)
1. Owner: read **Project Settings → Git**; record the repo, branch and direction on issue #263.
2. Owner: put a ruleset on that sync branch (PR required, verify, no force-push or delete); confirm it is enforced.
3. Reviewer: sort the Lovable-only commits (keep, port or drop).
4. On GitHub, open a normal merge PR from main into the sync branch; verify must pass on the exact head; merge. Confirm the project HEAD equals that SHA.
5. Land the life-list privacy fix (#271 or #253) through review.
6. In preview at the exact SHA: lint, tests, build; check robots, sitemap, the `/life-list` noindex and key pages.
7. Security gates: test #320 on a disposable backend; #164 matrix; decision on #235. No production migration without owner approval.
8. Owner: confirm auth providers; add the optional secrets.
9. Owner: **Publish → Publish changes**. Re-check the live endpoints against that SHA.

## Smallest next step (not applied)
Owner opens **Project Settings → Git** and posts the repository, branch and direction on issue #263.
