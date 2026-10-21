# Read-only audit: repository linkage, Life List privacy, and the safest next task

Done as a read-only check on 21 Oct 2026. No files besides this note changed. Nothing was committed, synced, deployed or queried in production. The task list was not updated because the request said not to edit files.

## 1. What can and cannot be verified from this project

| Item | Status | Evidence |
|---|---|---|
| The project's own git remotes | Verified | Only Lovable's internal storage and an internal backup. Neither is a GitHub address. |
| The current editing branch | Verified | An internal edit branch (`edit/edt-2039…`), latest commit `93d9b75`. |
| GitHub repo `mattleask373-rgb/life-lived-network` | Verified via the public API | Default branch is `main`, and the repo is public. |
| PR #262 (the 12-month plan) | Verified | Merged, merge commit `520a622`. |
| Issue #263 (task board) | Verified | Open. Its Step 1 asks the owner to confirm the Lovable target repo and a non-main sync branch. |
| Which repo Lovable Git sync points at | Not verifiable | Sync settings are not readable from here. |
| Which branch Lovable syncs to | Not verifiable | Same reason. |
| Whether the main ruleset is actually enforced | Not verifiable | Issue #263 itself flags conflicting records. |
| Live production robots.txt, meta tags and sitemap | Not checked | No production fetch was made this turn. |

## 2. Life List privacy and search-engine indexing

The promise on the page (`src/routes/life-list.tsx`) is "Only you see this."

What the code actually does:
- The page uses `publicPage(...)`, so it is indexable and carries a canonical URL.
- `/life-list` appears in `PUBLIC_PATHS` (`src/lib/seo.ts:97`), so it is listed in the sitemaps.
- `public/sitemap.xml` contains `/life-list`.
- `robots.txt` does not disallow it.

Actual data exposure appears low:
- The list is read from the device's local storage, or from the account's `saved_items` once signed in.
- A crawler would only see the empty "Nothing saved yet" state with sample suggestions.
- `saved_items` row-level security was not re-checked this turn.

Conclusion: no personal data leak was found, but the page's search-engine signals contradict its privacy promise. That is a P1 honesty mismatch, which is what issue #263 Step 3 targets.

An existing fix is open: PR #253, "fix(seo): keep private life list out of indexing and sitemaps".
- Head `aa2a865`, open, not a draft.
- It touches `robots.txt`, `sitemap.xml`, `seo.ts`, `seo.test.ts`, `sitemap-privacy.test.ts` and `life-list.tsx`.
- Its CI and review state, and whether it overlaps #247, #249 and #252, were not checked this turn.

## 3. Risk: project edits syncing to main

- GitHub's default branch is `main`. Lovable Git sync normally targets the default branch unless someone switched it.
- The synced branch cannot be seen from here, so any accepted Lovable edit may land directly on `main`. That would violate the "never commit to main" rule.
- Until the owner confirms a non-main sync branch (issue #263, Step 1), treat every Lovable edit as possibly going straight to `main`.
- Safe default: make code changes only through GitHub PRs, or through a Lovable draft that opens a PR. Do not make direct edits in this project.

## 4. Recommended single next task

Review and converge PR #253. Do not write a new Life List fix, because that would duplicate #253.

Scope:
- Re-fetch the exact head of #253, its checks and its changed lines.
- Compare it with the SEO PRs #247, #249 and #252 so only one place decides which pages are public or private.
- Record the result as an independent review on GitHub. The owner or reviewer posts it; Lovable does not.

Acceptance criteria:
1. `/life-list` uses `privatePage(...)` and outputs `robots: noindex, nofollow`, with no canonical link.
2. `/life-list` is in `PRIVATE_PATHS`, not `PUBLIC_PATHS`. A test fails if it ever appears in both lists or in any sitemap: static, `/sitemap.xml` route, or `/api/public/sitemap*.xml`.
3. `robots.txt` has `Disallow: /life-list`, and a test keeps `robots.txt` in step with `PRIVATE_PATHS`.
4. The copy still says "Only you see this", and the signed-out (this device only) and signed-in (your account) behaviour is described accurately.
5. The `verify` check passes on #253's final head SHA. No other SEO PR changes the same lists in a conflicting way.
6. No database, row-level security, or sync-settings changes are bundled into this task.

Manual checks once the owner approves a publish:
- Fetch the live `/life-list`, `/robots.txt`, `/sitemap.xml` and the API sitemaps with plain GET requests.
- Confirm `noindex` is present and `/life-list` is absent from every sitemap.

## 5. Blockers needing a human
- Confirm Lovable's sync repo and a non-main branch. This blocks any direct edits here.
- Verify that the main branch ruleset is actually enforced.
- Run a separate read-only check of `saved_items` row-level security, under the issue #164 access matrix.
