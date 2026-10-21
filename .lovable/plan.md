# Independent review: PRs #271, #272, #275, #276 (read-only)

Done on 21 Oct 2026. Nothing besides this note was edited, committed, synced, installed, deployed or queried. The task list was not updated because the request said not to edit files.

## 0. Can this Lovable project prove its sync target and commit SHA?

No.
- The only git remotes are Lovable's internal storage and an internal backup. There is no GitHub remote.
- The local HEAD is `73bcec5…`. That does not match the `main` SHA you gave (`1cf9b21…`), and nothing here links the two.
- The Git sync repository and branch are not readable from this session.
- So the sync target, the synced branch, and whether this project equals any GitHub commit are all **unverified**.

## 1. What was actually inspected

Read through the public GitHub API: each PR's head SHA, base branch, draft state and changed-file list, plus the non-test patches.

| PR | Head (matches the SHA you gave) | Base | State |
|---|---|---|---|
| #271 | `fc264cc` yes | main | draft, open |
| #272 | `e87438c` yes | main | draft, open |
| #275 | `e1de845` yes | main | draft, open |
| #276 | `abfdfc4` yes | main | draft, open |

Not inspected:
- Test file bodies, beyond their names and line counts.
- CI or check results for any of the four heads.
- Files the PRs depend on that are missing from this local snapshot, notably `work-opportunity-presentation.ts`, `geo-bounds.ts` and `locality-indexability.ts`.
- The body of `readBoundedSitemapPages`; the patch output was truncated.

Your report that #276 passed Verify, CodeQL and the dependency audit was **not re-checked**.

## 2. Findings by PR

### #271: route registry and private Life List. Verified correct in direction.
- One registry (`seo-route-policy.ts`) now feeds `seo.ts`, the sitemaps, robots and the live-smoke script, which previously had its own copies.
- `/life-list` moved to `PRIVATE_PATHS`, and the page uses `privatePage` (noindex, no canonical).
- Risk (Medium): nothing forces each route's `head()` to match the registry. A route could still call `publicPage` while listed as private, or the reverse. The old test only checks four hard-coded names.
  - Smallest missing test: for every path in `PRIVATE_PATHS`, render that route's `head()` and assert `noindex` is present with no canonical link. For every path in `PUBLIC_PATHS`, assert the opposite.
- Risk (Low): no test checks that the two lists never overlap.
  - Smallest missing test: assert the intersection of `PUBLIC_PATHS` and `PRIVATE_PATHS` is empty.
- Note: the `/need` prefix in `PRIVATE_PATHS` also covers `/need/$id`, as intended. `privatePage` on `/need/` passes `path: ""`, which is harmless.

### #272: locality scope cap, date-line handling, abort logging
- Fails closed: more than 400 descendant IDs now throws `SCOPE_TOO_WIDE`, instead of silently dropping the place filter. That matches the invariant that a selected locality never silently broadens.
  - The detail containing the count is kept server-side, because the `DataError` constructor uses the fixed message. That was verified locally.
- Risk (High, product): country, region and large-county pages, and any selection whose hierarchy has more than 400 places, now show an error instead of activity. This includes SSR locality pages and the home page.
  - Need: confirm which real places exceed 400 (read-only count on the place list), plus copy and UI that offer smaller places rather than a dead end.
  - Test: a parent with 401 descendants returns `SCOPE_TOO_WIDE`; a parent with 400 still queries; and the UI renders the "choose a smaller place" state with a way forward.
- Abort handling: `observe` re-throws without logging when the signal is aborted or the error is named `AbortError`. Correct.
  - Edge case: supabase-js may surface a cancelled request as an error object whose name is not `AbortError`. In that case the `signal.aborted` branch is what saves it.
  - Test: an abort raised as a plain object `{ message: "AbortError" }` is not logged.
- Date line: `toScreen`, `boundsOf`, `placeInView` and `fitView` now use the shortest longitude offset, and `boundsOf` returns minLng greater than maxLng when the view wraps, matching the server bounds contract.
  - Risk (Medium): `map-list-sync` and `placeEntries` filter on screen position, so they inherit the fix. But any other caller that compares longitudes against `boundsOf` directly (e.g. `lng >= minLng && lng <= maxLng`) now breaks on wrapped views. A repo-wide search is needed; not done this turn.
  - Edge case: `fitView` unwraps points relative to the locality centre. A set of points spanning more than 180 degrees around that centre unwraps the wrong way. Acceptable at locality scale, but should be stated.
  - Tests: points at +179.9 and -179.9 land within a few percent of each other on screen; `fitView` gives a span under 1 degree for that pair; `placeInView` finds a place across the date line.
- Overlap: this touches `world.functions.ts`, `map-view.ts` and `index.tsx`, the same files as #238 and #242. `assertQueryableGeoBounds` comes from a version of `geo-bounds.ts` not visible here. Merge order matters; rebase on whichever lands first and re-run.

### #275: published work opportunities and Need prefill
- No contact without the user submitting: verified in the diff. `RequestMatchLink` is a plain link to `/need` with search params. The Need form only calls `createNeed` on submit. No source is messaged, and the helper text says so.
- Publication gate (cannot verify): both new surfaces rely on `hasPublicWorkOpportunity`, whose body is not available here.
  - The locality page filters with it, but it does **not** separately exclude expired, cancelled or demonstration entries. The service page does, via `servicePageListings`.
  - Test: an entry that passes `hasPublicWorkOpportunity` but is expired, cancelled or a demonstration does not appear on the locality page.
- Category truth (Medium): the link passes the category **label** (e.g. "Cleaning"). The form lowercases it into `category` and `required_skills`, which feed `findSupply()` matching.
  - If people's capabilities are stored as slugs or other words, the prefilled request could match nobody, or match the wrong people.
  - Test: the prefilled value equals what the canonical taxonomy stores for that category.
- Service page change (Medium): `servicePageListings` now includes work opportunities alongside services. That changes what the service page counts and possibly whether it is indexable, if indexability reads that count.
  - Test: a service page whose only listing is a work opportunity keeps the same indexability decision as before, or the change is made deliberately.
- Accessibility:
  - Prefill only reaches the form when signed in. Signed-out users likely lose `from` and `category` through the sign-in redirect; not verified.
  - The link reads "Request a match" with no context. Several on one page are ambiguous to screen readers. Add the opportunity title to its accessible name.
  - Seeded values are editable (`useState(categorySeed)`), but they are read only on first render. Changing search params on the same page does not refresh them. Minor.
  - Tests: the link's accessible name includes the title; the category field shows the prefill and stays editable; no request is sent before submit.

### #276: sitemap page scanning
- The place read is now paginated in pages of 1000, ordered by `id`, with a 5,000 cap enforced by `readBoundedSitemapPages`.
  - Stable ordering by a unique key is correct.
  - The helper body was not seen, so these could not be verified: (a) going over the cap throws instead of truncating; (b) a short page ends the loop; (c) a read error stops the whole sitemap rather than returning partial URLs.
  - Tests: exactly 5,000 rows passes or fails as documented, 5,001 throws, and an error on page 3 gives a failure response with no URLs.
- Gap: the listing scan (`LOCALITY_SITEMAP_LISTING_SCAN_LIMIT`) was not visibly changed. Confirm it is paginated and fails closed the same way. Otherwise localities whose activity sits past the first page could be wrongly treated as empty or eligible.
- Offset paging is not a consistent snapshot: rows inserted mid-scan can shift pages. That is acceptable for an hourly cache, but should be noted.

## 3. Cross-cutting risks
1. Four drafts all branch from `main` and overlap with #238, #242, #247, #249, #252, #253 and #261. Without one agreed merge order, the registry and the map files will conflict, or quietly undo each other's fixes.
2. Locality scope (#272) and sitemap eligibility (#276) both decide whether a place counts. A place over 400 descendants could be in the sitemap yet show an error page. Test: no indexable locality path gives `SCOPE_TOO_WIDE`.
3. Because the sync target is unverified, nothing here should be accepted into this project directly. Land these on GitHub through review first.

## 4. Cannot verify from here
- Git sync target and branch.
- CI on any of the four heads.
- The bodies of `hasPublicWorkOpportunity`, `readBoundedSitemapPages`, `assertQueryableGeoBounds` and `evaluateLocalityIndexability`.
- How many places have more than 400 descendants.
- Live production behaviour.
- Whether the `saved_items` and `needs` row-level security rules behave as intended.
