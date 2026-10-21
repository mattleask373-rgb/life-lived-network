# Phase 2 integration plan (plan only, no edits)

## Verified baseline (GitHub API, 18:25 UTC)

| Ref | Head | Notes |
|---|---|---|
| main | ccbcc6a | protected: true; rules unreadable (401) |
| integration/phase-2-current-main-2026-10-21 | ccbcc6a | equals main; protected: false |
| Loveable/work/safely (PR #235) | cebd6d6 | only previewAuthStorage.ts; Lovable is still synced here |

| PR | Draft | Base SHA | Head | Mergeable | Files |
|---|---|---|---|---|---|
| #233 Ask-place policy | yes | 8d79247 (stale) | 6b91db1 | clean | ask-place-policy.ts + test (new files only) |
| #214 Route guard tests | yes | 006a98c (stale) | 625341f | clean | route-auth-guards.test.ts |
| #234 Viewport/map-list | no | ccbcc6a (current) | 2751b93 | clean | living-map, data/contract, geo-bounds(+test), map-list-sync(+test), map-view, world.functions, routes/index |
| #195 Detail sheet/map a11y | yes | 14e409e (very stale) | 6624f78 | dirty | entry-sheet, living-map, grounded-matching(+test), touch-targets.test, styles.css |
| #193 Entry card a11y | yes | 14e409e | 5ac6d3d | dirty | entry-card, entry-card-a11y.test, grounded-matching(+test) |
| #197 WorkOpportunity/Adzuna | yes | 14e409e | a4e76f4 | dirty | 27 files: ingest/adzuna*, work-opportunities, listings, world-data, service-page/taxonomy, need-prefill, three routes, roadmap, STATUS |

## Already on main (present in project tree)
- `map-list-sync.ts`, `ask-place.ts` (always unavailable), `route-auth-guards.test.ts`, `work-opportunities.ts` exist. Each PR must be diffed against these, not assumed new. #214 likely modifies the existing test; #197 overlaps an existing module.

## Overlap hot spots
- `living-map.tsx`: #234 and #195.
- `grounded-matching.ts` (+test): #195, #193, #197 — three-way conflict; all three are stale-based at 14e409e.
- `world.functions.ts`/`data/contract.ts`: #234 (viewport input) vs #197 (`listings.ts`, `world-data.ts`) — contract drift risk.
- `$country.$place.index.tsx`: #197 plus earlier Ask-this-place work on main.
- `styles.css`: #195 vs PR #211 token changes.

## Dependency-aware order
1. #233 — new files only, fail-closed policy. Rebase onto integration branch; no wiring into UI; confirm `askPlaceState()` stays "unavailable".
2. #214 — tests only. Rebase; ensure it asserts current guards without weakening.
3. #234 — current base. Review gate: viewport bounds must only filter already-scoped listing retrieval, not `findSupply()`; caps, debounce, stale-request cancel; no inferred coordinates. Needs explicit review because it touches the server data contract.
4. #193 — rebuild on integration after 1–3; resolve grounded-matching by keeping main's version unless the change is ranking-only.
5. #195 — rebuild after #193 and #234 (living-map, grounded-matching).
6. #197 — last, split into: (a) WorkOpportunity presentation/types, (b) Adzuna adapter fixture-only under `src/lib/ingest/` with no scheduler, no secret, no live fetch, no `listings.ts` publishing change. Founder gate for any live activation.

## Gates per PR (exact head)
- Rebase/recreate onto `integration/phase-2-current-main-2026-10-21`; new head SHA recorded.
- `verify` green on that exact head; independent human review; no self-merge.
- Merge into integration branch only; main receives one final PR after full Verify + manual QA (375/1280, keyboard, screen reader).

## Safest first slice
#233 retargeted to the integration branch: two new files, no consumers, fail-closed. Then #214.

## Switching Lovable safely
1. Do not switch while PR #235 is open and unmerged; first merge or close #235 so `Loveable/work/safely` carries nothing pending.
2. Pause Lovable edits; in Project settings → Git pick `integration/phase-2-current-main-2026-10-21` (not main, not Loveable/work/safely).
3. Confirm the sync card shows that branch and 0 ahead / 0 behind at the expected SHA.
4. Prefer keeping Lovable off the integration branch entirely: integrate PRs on GitHub; give Lovable a separate per-slice branch so its auto-commits never land on the integration branch.
5. Protect the integration branch (PR required, `verify` required).

## Blockers
- #235 unmerged; Lovable still on Loveable/work/safely.
- main ruleset bypass list unverified (Issue #133 open).
- Integration branch unprotected.
- #193/#195/#197 stale (14e409e) and dirty; grounded-matching three-way conflict.
- #234 server-contract change needs Founder review.
- #197 live Adzuna use needs credentials and Founder approval; stays fixture-only.
- Issue #209 still gates any Ask-this-place enablement.
