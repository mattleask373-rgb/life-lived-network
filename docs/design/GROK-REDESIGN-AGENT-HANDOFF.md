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

- **Current verified GitHub main at 2026-10-21 00:14:24 UTC:** `30c2877f93ee0218e7fee5e365ee55101f8b3afd` ([commit](https://github.com/mattleask373-rgb/life-lived-network/commit/30c2877f93ee0218e7fee5e365ee55101f8b3afd)). Since the integration branches were created from `006a98c...`, three commits have reached main: `fea27ff`, `8801a50`, and `30c2877`. Their observed source changes are limited to `src/components/place-picker.tsx` and `src/components/place-search.tsx`. Those are outside #211/#216's changed files, but both branches are three commits behind main and must be rechecked/rebased/retargeted after the dependency is accepted. This is evidence of concurrent Lovable-style commits; the editor's configured sync destination still needs an owner screenshot/confirmation.
- **#210:** this handoff PR; open draft, documentation-only. It is not part of main.
- **#211 — accessible redesign foundation:** [PR #211](https://github.com/mattleask373-rgb/life-lived-network/pull/211), branch `integration/grok-redesign-ui-current-main-2026-10-21`, head `023eac1cc6789db783836443c3bb9041a780a8e0`, originally based on `006a98c...`. Exact-head Verify succeeded in run [#39519544983](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39519544983). It remains a draft; manual visual/accessibility review is outstanding. Current main is now three commits ahead, affecting PlacePicker/PlaceSearch only in the observed diff; confirm mergeability and rerun Verify at the reconciled head.
- **#216 — responsive map/list synchronization:** [PR #216](https://github.com/mattleask373-rgb/life-lived-network/pull/216), branch `integration/grok-map-list-sync-2026-10-21`, latest head `83434f54c2bdbc0c4830803740d12750271479c1`, based on #211 head `023eac1...`. Exact-head Verify passed in [run #39520456514](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39520456514): frozen install, lint, 46 test files / 347 tests, and build. Seven lint warnings; zero errors. The view defaults to the existing `meaningfulVariety()` selection, with an explicit “Show all loaded records” mode that switches map and list together to the already-loaded, filtered set. It does not claim the entire database locality was fetched. Still draft and dependent on #211.
- **#212 — previous Journey/Road Trip branch:** its recorded Verify [run #39519498330](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39519498330) failed at lint/Prettier in `src/lib/map-view.test.ts`; tests/build were skipped. Treat it as historical/superseded rather than the active candidate.
- **#213 — current Journey/Road Trip candidate:** [PR #213](https://github.com/mattleask373-rgb/life-lived-network/pull/213), branch `integration/grok-traveller-current-main-2026-10-21-v2`, head `ed04b8c3778b87b60739625043033f5fd1e84d0f`, base #211 head `023eac1...`. Exact-head Verify passed in [run #39519664036](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39519664036). It changes only Journey/Road Trip routes and their focused visual-foundation test. Still draft and dependent on #211.
- **Branch protection:** a prior repository audit reported main unprotected. This connector has not produced a fresh ruleset/branch-protection result in this cycle; a repository administrator must verify current enforcement and fix it through the approved human process.

## Redesign parity matrix

The original Grok ZIP/screenshots are not currently checked into this repository or directly retrievable by this handoff process. The empty `Grok-new-design` reference file is not the source app. Therefore this is a parity inventory of observable canonical routes and current integration work, **not a claim of complete parity against every original screen**.

| Redesign area | Canonical location | Current status | Next evidence / dependency |
|---|---|---|---|
| Global visual foundation | `src/styles.css`, `src/routes/__root.tsx`, shared shell components | **Partial / reused.** Warm tokens and typography are in the current implementation; #211 has reviewed code and reference notes for further alignment. | Compare against the actual source export once supplied; manual contrast and responsive checks. |
| Home/front door | `src/routes/index.tsx`, `possibility-front-door.tsx`, `place-picker.tsx` | **Existing + partial.** A Grok-inspired home is already in main. #216 proposes the next responsive map/list behavior. | Review #211, then #216; validate the rendered journey. |
| Map and listing panel | `src/components/living-map.tsx`, `src/lib/map-view.ts`, `src/lib/map-list-sync.ts` | **Partial.** Existing map projection/pan/zoom/clustering remain canonical; #211 adjusts map controls; #216 adds in-view/out-of-view/unpinned partitioning and mobile/desktop layout. No server viewport query is added. | #211 approval and merge first; then retarget/test #216; manual edge-of-viewport checks. |
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
| Review #216 map/list behavior | Frontend reviewer + product owner | `src/routes/index.tsx`, `src/lib/map-list-sync.ts`, its tests | #211 approved/merged first | Exact-head Verify, viewport edge tests, mobile/desktop visual and keyboard review |
| Review #213 Journey/Road Trip | Frontend owner | `src/routes/journey.tsx`, `src/routes/road-trip.tsx`, `src/lib/traveller-visual-foundation.test.ts` | #211 approved/merged first; independent of #216 file scope | Current-base diff, passing exact-head Verify and manual journey/form QA |
| Recover source provenance | Design-source owner | Original ZIP/screenshots/manifest only | Actual archive or accessible share supplied | File exists, origin/date/checksum verified, screen manifest populated |
| Confirm repository controls | Repository administrator | Main branch/ruleset and Lovable Git settings | Human permission | Current screenshots/API evidence of non-main sync, enforced PR + required checks |
| Continue source/SEO verification | SEO/release owner | Existing SEO code and hosted response path only | Access to fresh live HTTP evidence | Timestamped robots/sitemap responses; do not change publish settings without approval |

## Current recommended order

1. Keep #211, #216 and #213 as drafts until the parent/child chain is reviewed. Passing exact-head CI is necessary, not sufficient; manual QA remains.
2. After #211 is approved and merged by a human, retarget/rebase #216 and #213 onto current main (one PR at a time) and rerun Verify against each exact head; both have distinct route scopes.
3. Treat #212 as the historical failed branch; do not revive it if #213 remains the selected Journey/Road Trip candidate.
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
