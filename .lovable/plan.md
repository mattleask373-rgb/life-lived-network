# Phase 3 — Reconciliation report and first map slice (staged)

## Baseline (read-only, observed this turn)

| Fact | Evidence | Status |
|---|---|---|
| Project branch | `edit/edt-688caf13-…` (internal Lovable edit branch), clean tree | Observed |
| Project SHA | `3f3831efadadfa984b1fdcf82006542814d46b4e` = merge of PR #208, on top of PR #207 | Observed |
| Local `main` ref | `14e409e…` (stale snapshot; 8 commits behind project HEAD) | Observed |
| GitHub main SHA | Not reachable from sandbox (only internal remotes, no `gh`) | UNKNOWN |
| PR #205 reachable | No #205 merge commit in local history | Not found locally; GitHub state UNKNOWN |
| Lovable GitHub sync destination / branch | Not visible from sandbox | UNKNOWN — blocks edits |
| main protections / `verify` / bot bypass | Not visible | UNKNOWN |

## What already exists

- `LivingMap` (`src/components/living-map.tsx`) used on home and road-trip; pure viewport math in `src/lib/map-view.ts` (zoom/pan/fit, clustering, `placeInView` offers rather than imposes locality changes) with tests.
- Viewport and discovery locality are already kept apart by design.
- `findSupply()` is need-centred (need + people + entries); it has **no bounding-box input**. Map entries come from public listing retrieval in `world.functions.ts` / `listings.ts`, scoped by locality.
- Ingestion contract `src/lib/ingest/contract.ts` (`SourceEvent`, `SourceRow`, `SourceAdapter.parse`), plus dedupe, freshness, normalise, a Ticketmaster adapter and a fixture source.
- No geolocation usage anywhere in `src/`.

## Missing capabilities

- Desktop map/list split and mobile bottom sheet tied to one selection state.
- Opt-in "Locate me".
- Server-side viewport querying (would be a contract change — proposal only).
- ICS/civic adapter; grounded AI filter contract (design only).

## Gate

Because the sync destination cannot be proven non-main, **no code is edited** until the owner supplies a screenshot of Lovable Project Settings → Git showing the repository `mattleask373-rgb/life-lived-network`, the exact non-main sync branch, and connected status — plus confirmation that GitHub `main` requires a PR and `verify` with no bot bypass.

## Proposed smallest safe slice (after gate clears)

"Map and list stay in sync" on the home locality view, frontend only:
1. Desktop 1280px+: map beside the existing entry list; list shows only entries currently placed in the viewport (the same locality-scoped records already loaded — no new fetch, no global inventory pull), with an exact count "N of M here are in view".
2. Mobile: map above a peekable list panel with a real button to expand/collapse (no swipe-only control), 44px targets.
3. Selecting a card highlights its pin and vice versa; entries without coordinates are listed as "Location not pinned" and never placed at the locality centre.
4. Separate states: loading, load failure, quiet locality, nothing in this view (with "Show whole locality").
5. Reduced-motion respected; no EntryCard internal changes (PR #193 overlap).

Not in this slice: Locate me, new filters, viewport server queries, ingestion, AI.

## Follow-on (separate PRs, proposal only)

- Opt-in Locate me: centres map in browser only, not stored or sent; denial/timeout fallbacks.
- Typed bounding-box proposal for listing retrieval (not `findSupply()`), with caps, debounce and stale-request tests.
- One fixture-only ICS adapter against the existing `SourceAdapter` contract.
- Grounded filter schema validated against the service taxonomy, feature-flagged off.
- Agent lanes recorded in `docs/agents/SPECIALIST-LANES.md`; no new framework.

## Technical details

- New pure helper `src/lib/map-list-sync.ts` (in-view filter, counts, unpinned split) with vitest tests: viewport change, unpinned exclusion, selection sync, empty-in-view.
- Edit `living-map.tsx` to accept `selectedId` / `onSelect` / `onViewChange`; edit home route layout only.
- Checks: `bunx vitest run`, lint, typecheck, build; Playwright at 375 and 1280 for overflow and console errors. Manual keyboard/screen-reader QA marked NOT RUN unless performed by a person.
