# PR #238 review — "cap and cancel viewport discovery requests" (read-only)

Evidence: live diff read from GitHub at head `6276097`, base `integration/phase-2-current-main-2026-10-21`, draft. 5 files (+118/-15). Check runs on exact head: `verify` success (x2), `Supabase Preview` skipped. Installed libs checked locally: `@tanstack/react-start` 1.168.60, `@supabase/supabase-js` ^2.116. No files, branches, GitHub state or settings were changed. This document is the review only; approving it authorises nothing.

## Verdict
Directionally correct and safe to keep as draft. Not yet approvable: one High finding carried over from #237 is unaddressed, and boundary/cancellation tests are thin.

## Findings (prioritised)

### High
1. Refresh failures still hidden. `mapError = viewportBounds ? viewportError && !viewportPage : worldError` (index.tsx:163). A failed refresh with cached data shows no warning or retry. This was review comment 2 on #237 and is not addressed here.
2. Silent truncation at 200. Viewport read uses `limit: MAX_LIMIT` and never follows `nextCursor`; `hasMore` is ignored. A busy 1.5-degree window can drop records with no "more exist" signal, ordered by `starts_at`, so undated items are cut first. Pre-existing, but the cap makes it the main remaining honesty gap. Needs at least a "showing first 200 — zoom in" state.

### Medium
3. Server cap is correct, including antimeridian. `assertViewportQueryBounds` runs in the `inputValidator`, measures wrapped longitude as `360 - minLng + maxLng`, rejects >1.5 on either axis. Client `isViewportQueryAllowed` checks raw spans and normalised bounds. Note: the map aspect (~1.4) means the longitude limit binds first, so the effective latitude window is about 1.07 degrees. Fine, but should be stated as intended.
4. Broad zoom sends no query, with honest copy. Too-wide view sets `viewportBounds` to null, which disables the query and falls back to locality records, with the "Zoom in… no broad-area query was sent" status. Gaps: (a) `viewportTooWide` updates instantly while bounds update after 300ms, so for that window the previous viewport page can still be merged under a "too wide" message; (b) the notice sits only in the list content; verify it is perceivable on the map surface on mobile.
5. Abort errors may be logged as failures. When the client cancels, `.abortSignal(signal)` rejects; `asDataError` maps it to DATA_UNAVAILABLE and `observe("world.page")` likely records it as an error. Treat `AbortError` as cancelled, not failed, to keep the observability numbers honest.
6. Server-side signal reliability on Workers is unverified. `getRequest().signal` is the right API in this version, but whether workerd aborts it on client disconnect has not been shown. Client-side cancellation stops the wasted browser work either way; server savings are best-effort until proven.

### Low / confirmed OK
7. Signal plumbing is valid. TanStack Query `queryFn({ signal })` goes to `fetchWorld(ctx, { signal })` goes to `getWorld({ data, signal })`. 1.168.60 types accept `signal?: AbortSignal`, and the client fetcher honours it. All five Supabase reads on the path take `.abortSignal(signal)`. The locality path (`loadPlaceIndex`) is not signalled, but the bounds path skips it.
8. Repeated `.or()` is correct. The installed postgrest-js uses `searchParams.append`, so the antimeridian `or`, the time `or` and the optional `endTime` `or` are all sent and ANDed. This resolves the open concern from the #237 review, where my earlier overwrite reading was wrong for this version.
9. Null coordinates. Viewport `gte/lte` on lat/lng excludes nulls server-side. Unpinned locality records survive through `mergeViewportEntries(..., all)` and `partitionMapList`. OK.
10. Locality vs viewport stay separate. Bounds take precedence over place filters in the query only. `setPlaceSlug` and the selected locality are untouched. `findSupply()` is not touched.
11. `getRequest` is imported from `@tanstack/react-start/server` in a `.functions.ts` module. The build passes on CI. Confirm the client bundle does not include it (the import is handler-only, so it should be stripped).

## Additional tests needed
- Exact boundary: span 1.5 allowed, 1.5000001 rejected, on both axes, client and server.
- Wrapped boundary at exactly 1.5 (e.g. 179.25 to -179.25), and a ±180 normalisation case.
- Validator-level test that `getWorld` input with broad bounds throws before any query (call the validator, or mock the client and assert it is never called).
- `fetchWorld` forwards `signal` (mock `getWorld`).
- Builder test that a wrapped viewport plus `startTime` plus `endTime` produces three `or` params.
- Abort is classified as cancelled, not DATA_UNAVAILABLE (after the fix in 5).
- Refresh-failure-with-cache warning plus retry (after the fix in 1).

## Manual checks
- Mobile (~470px): zoom out past the cap; the notice is visible, the network panel shows no `getWorld` bounds request, and locality records remain.
- Rapid pan/zoom: earlier requests show as cancelled, and the final list matches the final map.
- Pan across the Pacific antimeridian at a small span: records from both sides appear.
- Throttle offline after the first load, then pan: currently no warning (confirms 1).
- A dense area: confirm whether 200 rows are returned and nothing tells the user (confirms 2).

## Recommended author actions before review approval
Fix 1 and 2. Treat aborts as cancelled (5). Close the 300ms stale-merge gap (4a). Add the tests above. Re-confirm `verify` on the final head SHA. Keep #236 and #235 sequencing unchanged.
