# Grok Redesign — Shared Agent Handoff

**Purpose:** Give every AI agent and contributor one canonical place to understand the Grok-inspired redesign, locate the current implementation, and integrate further UI work without replacing the existing Real World Atlas / Life Lived Network application.

**Canonical repository:** https://github.com/mattleask373-rgb/life-lived-network  
**Product:** Real World Atlas / Life Lived Network  
**Current app:** https://life-lived-network.lovable.app  
**Change policy:** Documentation and frontend-only integration by reviewed PR. Do not merge, deploy, change production data, or modify auth/schema/RLS/secrets without explicit owner approval.

## Important distinction: design reference vs. source code

The repository already contains Grok-inspired redesign work. The canonical app and its existing domain logic remain the integration target. Do not create a second product or replace the app with a standalone prototype.

This handoff does **not** claim that the original Grok workspace export, complete source project, or all design assets have been copied into this repository. Only files that are actually available in the shared workspace/repository can be checked in. If an agent has the original Grok export, screenshots, Figma/design links, or ZIP, add the original files under `design/grok-redesign/source/` (when licensing and file size permit) and update this page with a manifest, origin, date, and checksums. Until then, treat the existing app implementation and PRs linked below as the inspectable reference—not as proof that every original source asset is present.

## Where to look first

- [Grounded AI and Global Platform Integration](../ai/GROUNDED-ASSISTANT-AND-GLOBAL-INTEGRATION.md) — canonical architecture, guardrails, global readiness, and agent coordination.
- [Grok integration audit and phased plan](../../.lovable/plan/grok-design-integration-read-only-audit-and-phased-plan-2026-10-20.md) — known surfaces, blockers, and proposed migration sequence.
- [Agent status](../agents/STATUS.md) — latest cross-agent status; update it when evidence or blockers change.
- [Home route](../../src/routes/index.tsx) and [app shell](../../src/routes/__root.tsx) — home and global navigation.
- [Entry card](../../src/components/entry-card.tsx), [detail sheet](../../src/components/entry-sheet.tsx), [living map](../../src/components/living-map.tsx) — key shared UI surfaces.
- [Styles](../../src/styles.css), [place picker](../../src/components/place-picker.tsx), [place search](../../src/components/place-search.tsx) — design tokens, typography, and place selection.
- [Grounded matching](../../src/lib/grounded-matching.ts) and [supply engine](../../src/lib/supply-engine.ts) — preserve these domain/data paths when changing presentation.

## Existing review work to reconcile

- [PR #193 — accessible entry cards](https://github.com/mattleask373-rgb/life-lived-network/pull/193): keyboard access and semantic behavior. Re-check the latest head and CI before relying on earlier checks.
- [PR #195 — detail sheet and map controls](https://github.com/mattleask373-rgb/life-lived-network/pull/195): detail-sheet/map accessibility and visual refinements. It overlaps shared grounded-matching files with other work; resolve overlap against current `main` before integrating.
- Do not assume an open PR is integrated. Compare every branch with current `main`, inspect its exact diff and exact-head CI, and salvage unique changes rather than merging stale branches blindly.

## Integration rules for every agent

1. **One product, one source of truth.** Work in this repository and existing app; Grok is the design direction, not a separate runtime or duplicate backend.
2. **Inspect before editing.** Record the current base SHA, changed files, owning PRs, dependencies, and overlap. Avoid concurrent edits to the same component or contract.
3. **Frontend first.** Preserve existing props, routes, server functions, data retrieval, taxonomy, trust/provenance indicators, demo labels, empty states, and publication gates. Do not port prototype sample places, mock activity, or prototype-only stores into production.
4. **No invented facts.** Missing local details stay missing. Never manufacture prices, availability, dates, addresses, sources, rights, or publication status.
5. **Accessibility is acceptance criteria.** Check keyboard-only operation, visible focus, meaningful screen-reader names, no nested interactive controls, adequate contrast, reduced motion, and touch targets of at least 44px where applicable.
6. **Responsive verification.** Review at 375px mobile and 1280px desktop; capture before/after screenshots when possible. Test quiet and busy locality states, not just the home page.
7. **Tests and evidence.** Run the project’s relevant lint, typecheck, unit tests, build, and CI on the exact PR head. Report actual results and remaining manual checks; do not infer success from source inspection.
8. **Security/data boundaries are separate gates.** No production deploy, schema/RLS/grant/auth changes, data publication, secrets, or live partner activation without explicit owner approval.
9. **Leave an agent handoff.** Each PR description should state goal, non-goals, base SHA, touched surfaces, tests/evidence, conflicts, rollout/rollback, and human decisions needed. Update `docs/agents/STATUS.md` when the state changes.

## Verified integration state — 21 October 2026

This section is an evidence snapshot, not a deployment or merge statement. Recheck head SHAs and checks before acting.

- **Current verified GitHub main at 2026-10-21 00:23:29 UTC:** `8d79247991187bf64813cf72e3ec75aeb508e2e9` ([commit](https://github.com/mattleask373-rgb/life-lived-network/commit/8d79247991187bf64813cf72e3ec75aeb508e2e9)). Three later commits since `30c2877...` add the disabled, always-unavailable “Ask about this place” UI/contract/test and connect it to the locality page; they do not change the home route `src/routes/index.tsx`, the file changed by #220. #220 was tested against `30c2877...`; GitHub currently reports it mergeable, but its branch is now three commits behind main and must be rechecked/rebased or otherwise brought current, then exact-head Verify rerun, before merge. #211 and #213 descend from older `006a98c...` / `023eac1...` ancestors and require base reconciliation. The readable repository ruleset endpoint confirms `living World - protect main` (ruleset #24946178) has `enforcement: disabled`; the direct legacy branch-protection endpoint returned 403 to this connector. A repository administrator must verify/enable the intended PR, review and Verify controls. The actual Lovable Project Settings → Git destination remains unverified; matching main/project SHAs do not prove its configured branch.
- **#210:** this handoff PR; open draft, documentation-only. It is not part of main.
- **#211 — accessible redesign foundation:** [PR #211](https://github.com/mattleask373-rgb/life-lived-network/pull/211), branch `integration/grok-redesign-ui-current-main-2026-10-21`, latest head `e7b732d25cd951f3ab3c1007257442563e361336`, originally based on `006a98c...`. Latest commit adds a source-package/current-main checkpoint to the reference README only; exact-head Verify passed in [run #39520719116](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39520719116). Still draft, based on older main ancestry; human visual/accessibility QA and reconciliation against current main (`8d792479...`) are outstanding. Changes since its old base include PlacePicker/PlaceSearch and the disabled place-assistant/locality page slice; those paths are not in #211's recorded diff, but merge checks must still be rerun after reconciliation.
- **#216 — first map/list candidate, superseded and closed:** [PR #216](https://github.com/mattleask373-rgb/life-lived-network/pull/216), branch `integration/grok-map-list-sync-2026-10-21`, had an earlier head `83434f54...` with Verify success in [run #39520456514](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39520456514). After a further invalid-coordinate test commit `ed749bc...`, the moving #211 parent made the PR non-mergeable and that final head did not receive a fresh Verify before closure. It was closed unmerged after #220 passed; use #220 as the only active map/list review target.
- **#220 — current-main map/list synchronization:** [PR #220](https://github.com/mattleask373-rgb/life-lived-network/pull/220), branch `integration/grok-map-list-sync-main-2026-10-21`, original base `30c2877f93ee0218e7fee5e365ee55101f8b3afd`, head `e8fd148fa0223707fd317b80b19a47944c0bf1a2`. Exact-head Verify passed in [run #39520945717](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39520945717): frozen install, lint, 45 test files / 342 tests and production build. Seven lint warnings, zero errors. Current main has since advanced three commits, but the observed delta only changes `src/components/ask-this-place.tsx`, `src/lib/ask-place.ts`, its test, and `src/routes/$country.$place.index.tsx`, not #220's `src/routes/index.tsx`/map helper/test. GitHub reports mergeable=true; nevertheless, rebase/retarget or refresh the current-main merge result and rerun exact-head Verify before any merge.
- **#212 — previous Journey/Road Trip branch:** its recorded Verify [run #39519498330](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39519498330) failed at lint/Prettier in `src/lib/map-view.test.ts`; tests/build were skipped. Treat it as historical/superseded rather than the active candidate.
- **#213 — Journey/Road Trip candidate:** [PR #213](https://github.com/mattleask373-rgb/life-lived-network/pull/213), branch `integration/grok-traveller-current-main-2026-10-21-v2`, head `ed04b8c3778b87b60739625043033f5fd1e84d0f`, still draft. Exact-head Verify passed in [run #39519664036](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39519664036) before the #211 base branch advanced from `023eac1...` to `e7b732d...`. Its route files are distinct from #220, but it must reconcile to the current parent and rerun Verify before review.
- **Branch protection:** a prior repository audit reported main unprotected. This connector has not produced a fresh ruleset/branch-protection result in this cycle; a repository administrator must verify current enforcement and fix it through the approved human process.

## Redesign parity matrix

The original Grok ZIP/screenshots are not currently checked into this repository or directly retrievable by this handoff process. The empty `Grok-new-design` reference file is not the source app. Therefore this is a parity inventory of observable canonical routes and current integration work, **not a claim of complete parity against every original screen**.

| Redesign area | Canonical location | Current status | Next evidence / dependency |
|---|---|---|---|
| Global visual foundation | `src/styles.css`, `src/routes/__root.tsx`, shared shell components | **Partial / reused.** Warm tokens and typography are in the current implementation; #211 has reviewed code and reference notes for further alignment. | Compare against the actual source export once supplied; manual contrast and responsive checks. |
| Home/front door | `src/routes/index.tsx`, `possibility-front-door.tsx`, `place-picker.tsx` | **Existing + partial.** A Grok-inspired home is already in main. #220 proposes the next responsive map/list behavior on current main. | Review the current-main three-file diff; validate the rendered journey and manual accessibility. |
| Map and listing panel | `src/components/living-map.tsx`, `src/lib/map-view.ts`, `src/lib/map-list-sync.ts` | **Partial.** Existing map projection/pan/zoom/clustering remain canonical; #211 adjusts map controls; #220 adds in-view/out-of-view/unpinned partitioning and mobile/desktop layout on current main. No server viewport query is added. | #220 exact-head Verify plus manual edge-of-viewport checks; #211 remains a separate visual/accessibility candidate. |
| Entry/listing card | `src/components/entry-card.tsx`, `src/lib/entry-card-view.ts` | **Partial / implementation candidate.** Source-backed photos, credits, neutral no-photo state and trust/provenance are kept. #211 separates semantic article content from a named full-card action and adds tests. | Human keyboard/screen-reader review; inspect real source-backed photo and no-photo cases. |
| Detail sheet/gallery | `src/components/entry-sheet.tsx` | **Partial.** #211 filters unusable image URLs and aligns layout/control styling without inventing media. | Review close/keyboard behavior, photo provenance, 375px/1280px presentation. |
| Place picker | `src/components/place-picker.tsx`, `src/components/place-search.tsx`, `src/lib/places.ts` | **Existing / needs source-parity review.** Canonical place hierarchy and search stay authoritative; an older visual branch #177 is closed unmerged and must not be imported wholesale. | Compare actual current component against original design material, then make a dedicated bounded slice if needed. |
| Journey and road trip | `src/routes/journey.tsx`, `src/routes/road-trip.tsx`, `src/lib/traveller-visual-foundation.test.ts` | **Partial, draft #213.** Current isolated v2 candidate has passing exact-head Verify; #212 is the older failing branch. | Review #213 against #211, then run manual journey/form/accessibility QA; retarget after the parent lands. |
| Locality and service pages | `src/routes/$country.$place.index.tsx`, `src/routes/$country.$place.$service.tsx`, locality/service helpers | **Existing functionality; visual parity not yet audited against original screens.** | Later surface-by-surface PR; preserve routing, indexability, provenance and honest quiet states. |
| Give / Need / Help / Earn / profile and other existing routes | Existing canonical route files and data helpers | **Existing functionality; parity status unverified.** Do not infer designs or copy prototype logic from route names alone. | Inventory the actual screens from the original export, then nominate non-overlapping PRs. |
| Prototype-only routes/data/auth/store | Prototype `/moments`, hardcoded sample cities, mock store/auth | **Explicitly excluded from canonical runtime.** | Port only a future approved interaction concept through canonical app contracts; never use prototype fixture records as supply. |
| Empty/error/loading/accessibility states | Existing route/component state handling and regression tests | **Partially covered by code/CI; manual QA not complete.** | Test quiet and busy localities, keyboard, screen reader, contrast, reduced motion and mobile sheet behavior. |

## Ownership and handoff queue

These are role proposals, not confirmed individual assignments.

| Task | Proposed owner role | File / contract scope | Depends on | Completion evidence |
|---|---|---|---|---|
| Review #211 design foundation | Human integration reviewer | Files listed in #211; avoid parallel edits to those files | Current-main base `006a98c…` | Review decisions, exact-head Verify and manual accessibility QA |
| Review #220 map/list behavior | Frontend reviewer + product owner | `src/routes/index.tsx`, `src/lib/map-list-sync.ts`, its tests | Current-main base already verified; no #211 dependency | Exact-head Verify, viewport edge tests, mobile/desktop visual and keyboard review |
| Review #213 Journey/Road Trip | Frontend owner | `src/routes/journey.tsx`, `src/routes/road-trip.tsx`, `src/lib/traveller-visual-foundation.test.ts` | Reconcile with latest #211 parent; independent of #220 file scope | Current-base diff, passing exact-head Verify and manual journey/form QA |
| Recover source provenance | Design-source owner | Original ZIP/screenshots/manifest only | Actual archive or accessible share supplied | File exists, origin/date/checksum verified, screen manifest populated |
| Confirm repository controls | Repository administrator | Main branch/ruleset and Lovable Git settings | Human permission | Current screenshots/API evidence of non-main sync, enforced PR + required checks |
| Continue source/SEO verification | SEO/release owner | Existing SEO code and hosted response path only | Access to fresh live HTTP evidence | Timestamped robots/sitemap responses; do not change publish settings without approval |

## Current recommended order

1. Keep #211, #220 and #213 as drafts until reviewed. #220 is based directly on current main and does not depend on #211; #216 is now closed as superseded. Passing exact-head CI is necessary, not sufficient; manual QA remains.
2. Human review #211 against current main `8d792479...`; complete manual visual, keyboard, screen-reader and photo QA, and rerun Verify after the base is reconciled. After it is accepted, reconcile #213 to that current parent and rerun exact-head Verify; do not allow overlapping route changes.
3. Run manual QA on #220 at mobile/tablet/desktop widths, then review its exact three-file diff. Treat #212 as the historical failed branch; do not revive it if #213 remains the selected Journey/Road Trip candidate.
4. Obtain the actual Grok export/screenshots and record a verified manifest before claiming complete screen parity.
5. Only after these gates, plan dedicated locality/service and Give/Need/Help/Earn/profile visual slices. Keep AI, ingestion, SEO hosting changes, backend contracts and production settings outside this UI integration unless explicitly scoped and separately approved.

## Original design package manifest

Status: **original ZIP bytes are not checked into the canonical repository and are not directly retrievable through the connected tool in this run**. Lovable project history reports an uploaded `grok-workspace.zip` with SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`. That hash is reported provenance only; it has not been independently recalculated because the archive bytes are unavailable. The empty `Grok-new-design` branch file is not the source application.

When the source package is available, record each item here:

| Item | Path or URL | Origin / date | Notes |
|---|---|---|---|
| Original Grok export / project ZIP | Reported `grok-workspace.zip`; no canonical file yet | Reported in Lovable project history; SHA-256 above is not independently verified here | Obtain actual bytes or a durable accessible share; add only if licensing and size permit |
| Design screenshots / reference links | Pending | Pending | Include mobile and desktop states |
| Design tokens / component inventory | Pending | Pending | Map to existing components before adding duplicates |
| Prototype-only dependencies/data | Pending | Pending | Document and exclude unless explicitly approved |

## Agent start prompt

> Read this handoff and `docs/ai/GROUNDED-ASSISTANT-AND-GLOBAL-INTEGRATION.md` first. Inspect current `main` and relevant open PRs before editing. Make the smallest reviewable frontend-only change that integrates the Grok-inspired design into the existing app. Preserve canonical data and safety contracts; do not introduce prototype data, a parallel app/backend, or production/auth/database changes. Report exact base/head SHAs, changed files, tests, screenshots/manual checks, conflicts, and outstanding owner decisions.
