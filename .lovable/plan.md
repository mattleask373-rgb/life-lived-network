# Read-only Launch and Sync Audit — Real World Atlas (23 Oct 2026)

Nothing was edited, committed, synced, deployed or written to the database.

## 1. Source and Git sync
- Verified: code storage is Lovable-internal only (internal git store plus internal backup). No GitHub remote in the project's git config.
- Verified: project HEAD `7ca12a5900d708014d63b03847f2c922965ea1be`, on a temporary edit branch.
- From the previous checkpoint (GitHub API, not re-fetched today): this SHA equals the head of `Loveable/work/safely` in `mattleask373-rgb/life-lived-network`; main was `1f0a5d2b…`; histories diverged.
- UNVERIFIED: whether Git sync is connected, its repository, branch and direction. Owner checks: **Project Settings → Git** (or chat **+ → Project → GitHub**).
- New: the GitHub API connection secret (`GITHUB_API_KEY`) is no longer linked to this project, so GitHub cannot be re-read from here today.

## 2. URLs
- Production (published): https://life-lived-network.lovable.app — HTTP 200.
- Preview (editor only, needs Lovable sign-in): id-preview--b3293d2a-….lovable.app.
- Custom domain: none attached.

## 3. Live-readiness blockers
| Area | Finding |
| --- | --- |
| Live build is stale | `/sitemap.xml` and `/api/public/sitemap.xml` return 404; `/robots.txt` is generic, with no sitemap line; homepage title is old ("The Living World — … Lisbon"). Exact published commit: UNVERIFIED. |
| Private page | `/life-list` is served (200); whether it carries noindex live was not checked. |
| Secrets (names only) | Present: `LOVABLE_API_KEY`, `LOVABLE_CRON_SECRET`. Missing: `TICKETMASTER_API_KEY`, so live event import stays off. Backend URL and key are provided by Lovable Cloud. |
| Auth providers | UNVERIFIED. Owner checks: **More → Users → Auth settings**. |
| Data | Production code blocks demo fixtures (`fixtures-policy.server.ts`). The last count (8 Oct) showed 0 accounts, listings and needs, so the live site shows an honest empty world. Not re-queried. |
| Security / migrations | PR #320's reporting migration has not been applied or tested on a disposable backend. #164 access matrix, saved_items/needs RLS and #235 are still open. No ruleset on `Loveable/work/safely`. |

## 4. Sequenced checklist to go live (same project, keep the current site up)
1. Owner: confirm repo and branch in **Project Settings → Git**; record on issue #263.
2. Owner: add a GitHub ruleset for `Loveable/*` (PR, verify, no force-push or delete); confirm it is enforced.
3. Reviewer: sort the Lovable-only commits (keep, port or drop).
4. Open a PR merging main into `Loveable/work/safely` (a normal merge, no rebase); verify passes on the exact head; merge; confirm the project HEAD equals that SHA.
5. Exact-head checks in preview: lint, tests, build; `/robots.txt`, `/sitemap.xml`, `/life-list` noindex, key pages.
6. Security gates: #320 tested on a disposable backend, #164 matrix, #235 decision; apply no migration without owner approval.
7. Owner: check auth providers; add `TICKETMASTER_API_KEY` in **Project Settings → Secrets** if events are wanted.
8. Owner: **Publish → Publish changes**, then re-check the live robots, sitemap, title and private pages against the exact SHA.
9. Optional: connect a custom domain under **Project Settings → Domains**.
