# Grok Redesign — Shared Agent Handoff

**Purpose:** Give every AI agent and contributor one canonical place to understand the Grok-inspired redesign, locate the current implementation, and integrate further UI work without replacing the existing Real World Atlas / Life Lived Network application.

**Canonical repository:** https://github.com/mattleask373-rgb/life-lived-network  
**Product:** Real World Atlas / Life Lived Network  
**Current app:** https://life-lived-network.lovable.app  
**Change policy:** Documentation and frontend-only integration by reviewed PR. Do not merge, deploy, change production data, or modify auth/schema/RLS/secrets without explicit owner approval.

## Important distinction: design reference vs. source code

The repository already contains Grok-inspired redesign work. The canonical app and its existing domain logic remain the integration target. Do not create a second product or replace the app with a standalone prototype.

**Source package inventory — checked read-only in the connected Lovable workspace on 21 October 2026:** the two uploaded archives `/mnt/user-uploads/grok-workspace.zip` and `/mnt/user-uploads/grok-workspace-2.zip` were reported byte-identical with SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`. The archive's `.github_repo` points to `mattleask373-rgb/world-s-finder`, not this canonical repository. Its routes/screenshots have been inventoried by filename and metadata, but the screenshots were not visually opened in that inspection and rights for fonts/photos have not been established. The ZIP and binary assets are **not checked into this canonical repository**. Treat the export as a design reference only: do not port its mock data, duplicate state/matching/auth/database layer, build output or development tooling. Add only selected assets after an explicit licensing/provenance review and a human visual check.

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

## Verified integration state — 21 October 2026 (refreshed 00:30 UTC)

This is an evidence snapshot, not a merge/deployment statement. Recheck refs and checks before taking action. It supersedes the older SHA and CI status notes in previous snapshots below.

- **Current main:** 8d79247991187bf64813cf72e3ec75aeb508e2e9. Commit “Added Ask about this place box” adds a disabled, always-unavailable UI and no-answer contract/test to the locality page; it is not a functioning AI assistant. Issue #209 remains the gate for any public assistant.
- **#211 — Grok redesign foundation:** [PR #211](https://github.com/mattleask373-rgb/life-lived-network/pull/211), branch integration/grok-redesign-ui-current-main-2026-10-21, head b492c262d6ea73f0f2028300db96c41ee0b6c289. A normal merge commit brought main 8d79247991187bf64813cf72e3ec75aeb508e2e9 into the branch as first parent and kept prior head e7b732d25cd951f3ab3c1007257442563e361336 as second parent. Current main compared with this branch now reports ahead 24 / behind 0, with the same 13 design/reference files and no overlap with the six files that changed on main. Exact-head Verify passed: [run #39521447625](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521447625) and [run #39521441841](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521441841). Still draft; manual accessibility, responsive, photo-provenance and full visual review remain.
- **#213 — Journey/Road Trip:** [PR #213](https://github.com/mattleask373-rgb/life-lived-network/pull/213), head a96a8f491db47328b886bfde97aff3704afdfe14, refreshed with the current #211 parent using a non-rewriting merge commit. The child diff remains its three route/test files. Exact-head Verify passed in [run #39521649010](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521649010) and [run #39521643610](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521643610). It remains dependent on #211 and draft.
- **#220 — home map/list:** [PR #220](https://github.com/mattleask373-rgb/life-lived-network/pull/220), head 6a50f7d3d390c7e3af33103accf65fc0f340febe, refreshed with current main as first parent and prior head e8fd148fa0223707fd317b80b19a47944c0bf1a2 as second parent. Diff remains three files and does not overlap main’s latest changes. Exact-head Verify passed in [run #39521546086](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521546086) and [run #39521540270](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521540270). It is independent of #211. PR #216 is closed unmerged and superseded.
- **#221 — source-refresh health:** [PR #221](https://github.com/mattleask373-rgb/life-lived-network/pull/221), head 7352f86d464da447a6ba0b579bf98f6cd7ddc338, based on current main 8d79247991187bf64813cf72e3ec75aeb508e2e9. Adds a pure source-refresh-health classifier, deterministic tests, and a status sentence on the existing authenticated admin/moderator-only /sources page. Verify passed in [run #39521313627](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521313627) and [run #39521311442](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521311442). This describes source connection health only; it does not implement scheduled ingestion, live-feed polling, or public real-time guarantees. Manual browser/accessibility review remains.
- **#210 — this handoff:** open draft documentation PR, refreshed to current main by merge commit 51fe0467e680742c868a360baf94e46c9a2d537a. This update is being committed on its isolated branch; it does not write to main.
- **Governance:** repository ruleset #24946178 (“living World - protect main”) currently reports enforcement disabled. A repository administrator must verify and enable required PR/review/check protections. Lovable’s actual Project Settings → Git sync destination has not been verified; do not enter Lovable edit/build mode until its target is confirmed not to be main.
- **Design source:** the reported original grok-workspace.zip and screenshots are not checked into the canonical repository. The previously reported SHA-256 is not independently verified in this environment. The parity matrix below covers observed routes and current implementation work, not complete fidelity to every original screen.



## Redesign parity matrix

The original ZIP has now been inventoried read-only through the originating Lovable workspace; its bytes/screenshots are still not checked into this repository and the screenshots were not visually reviewed. This is a source-informed route/component parity inventory, **not a visual sign-off or a claim of complete parity**. Route mappings marked provisional below must be confirmed against the actual screenshot/content, not inferred from names alone.

| Redesign area | Canonical location | Current status | Next evidence / dependency |
|---|---|---|---|
| Global visual foundation | src/styles.css, src/routes/__root.tsx, shared shell components | **Partial / candidate #211.** Current candidate is now based on current main ancestry; palette/typography and accessible interactions are in the 13-file diff. | Exact-head Verify passed; human visual/contrast/focus checks at the required breakpoints remain. |
| Home/front door | `src/routes/index.tsx`, `possibility-front-door.tsx`, `place-picker.tsx` | **Existing + partial.** A Grok-inspired home is already in main. #220 proposes the next responsive map/list behavior on current main. | Review the current-main three-file diff; validate the rendered journey and manual accessibility. |
| Map and listing panel | src/components/living-map.tsx, src/lib/map-view.ts, src/lib/map-list-sync.ts, src/routes/index.tsx | **Partial / draft #211 + #220.** #211 improves map control hit areas/clustering; #220 adds responsive map/list synchronization on current main. No synthetic pins or additional backend fetch. | Exact-head Verify passed on both; manually check viewport edges, card/pin/detail selection, unpinned records and mobile controls. |
| Entry/listing card | src/components/entry-card.tsx, src/lib/entry-card-view.ts | **Implementation candidate in #211.** Preserves canonical source-backed photos, credits, neutral no-photo states and trust/provenance. | Verify green; keyboard/screen-reader review and real-photo/no-photo inspection still required. |
| Detail sheet/gallery | src/components/entry-sheet.tsx | **Implementation candidate in #211.** Filters unusable photo URLs, labels the photo region, and adapts metadata/actions. | Verify green; close/keyboard behavior, source attribution and small-screen layout remain manual. |
| Place picker | `src/components/place-picker.tsx`, `src/components/place-search.tsx`, `src/lib/places.ts` | **Existing / needs source-parity review.** Canonical place hierarchy and search stay authoritative; an older visual branch #177 is closed unmerged and must not be imported wholesale. | Compare actual current component against original design material, then make a dedicated bounded slice if needed. |
| Journey and road trip | src/routes/journey.tsx, src/routes/road-trip.tsx, src/lib/traveller-visual-foundation.test.ts | **Draft #213, parent refreshed.** Journey/Road Trip route changes remain a separate dependency of #211. | Exact-head Verify passed on the refreshed child; manual journey/form and accessibility QA plus human parent review remain. |
| Locality and service pages | src/routes/$country.$place.index.tsx, src/routes/$country.$place.$service.tsx, locality/service helpers | **Existing functionality.** The locality page now has a disabled, always-unavailable AskThisPlace placeholder; there is no active model endpoint. Visual parity remains unverified against the original screens. | Preserve routing, indexability, provenance and honest quiet states; do not enable assistant before Issue #209 gates pass. |
| Give / Need / Help / Earn / profile and other existing routes | Existing canonical route files and data helpers | **Existing functionality; parity status unverified.** Do not infer designs or copy prototype logic from route names alone. | Inventory the actual screens from the original export, then nominate non-overlapping PRs. |
| Source refresh health | src/routes/sources.tsx, src/lib/source-health.ts, src/lib/source-health.test.ts | **Draft #221.** Adds truthful operational refresh labels only to the authenticated admin/moderator-only sources page. | Exact-head Verify passed; manual internal-panel/accessibility review remains. No scheduler or public live-update claim. |
| Prototype-only routes/data/auth/store | Prototype `/moments`, hardcoded sample cities, mock store/auth | **Explicitly excluded from canonical runtime.** | Port only a future approved interaction concept through canonical app contracts; never use prototype fixture records as supply. |
| Empty/error/loading/accessibility states | Existing route/component state handling and regression tests | **Partially covered by code/CI; manual QA not complete.** | Test quiet and busy localities, keyboard, screen reader, contrast, reduced motion and mobile sheet behavior. |

### Original prototype route mapping — provisional until visual review

| Grok prototype route | Canonical app destination | Current status | Safe porting boundary / question |
|---|---|---|---|
| `/` | `/` — `src/routes/index.tsx` | Existing canonical home; #220 proposes a synchronized map/list layout. | Match visual composition to a reviewed screenshot; keep canonical `WorldEntry` and locality data. |
| `/map` | Existing home map surface; no separate canonical `/map` route verified | Partial / route mismatch. | Use the current map and #220 behavior rather than adding a duplicate prototype route. |
| `/journey` | `/journey` — `src/routes/journey.tsx` | Existing canonical route; #213 is the draft visual follow-up. | Preserve existing canonical trip/journey models; no prototype store or match helpers. |
| `/place/$id` | Likely `/$country/$place` — `src/routes/$country.$place.index.tsx` | Provisional mapping. | Confirm prototype IDs can be resolved to canonical place slugs; never carry prototype IDs or coordinates into production. |
| `/need` | `/need` | Existing canonical route. | Keep current persistence, ownership and matching flow; do not copy prototype form/store. |
| `/give` | `/give` | Existing canonical route. | Preserve canonical offer/availability semantics; do not infer a user is available. |
| `/moments` | Unresolved; `/memories` is a possible concept match only | Deferred pending product review. | Do not map automatically; compare the prototype interaction to the actual canonical memory/privacy model. |
| `/you` | Unresolved; `/profile` is a possible concept match only | Deferred pending product/auth review. | Confirm route purpose, authentication and private/public fields before mapping. |

### Screenshot manifest (filenames and metadata only)

The read-only archive listing reported these design references; **their contents have not been visually inspected in the canonical review**:

| Artifact | Reported dimensions | Intended use / caution |
|---|---:|---|
| `screenshots/app-builder-built.png` | 1280×800 | Desktop home capture; inspect before using as an acceptance reference. |
| `screenshots/app-builder-built-mobile.png` | 390×844 | Mobile home capture. |
| `screenshots/app-builder-preview.png` | 1280×800 | Desktop preview capture. |
| `screenshots/app-builder-preview-mobile.png` | 390×844 | Mobile preview capture. |
| `screenshots/home-mobile-check.png` | 390×844 | Additional mobile home capture. |
| `screenshots/journey-desktop.png` | 1280×720 | Journey desktop capture. |
| `screenshots/map-desktop.png` | 1280×720 | Map desktop capture. |
| `screenshots/map-mobile.png` | 390×844 | Map mobile capture. |
| `.grok/card-raw.png`, `public/og.jpg` | 1200×630 | Sharing/social card; do not assume production asset rights. |
| `.grok/font-test.png` | 1100×360 | Typography reference only. |



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

1. Keep all candidates in draft. A human should review #211 first: its current-main merge has clean scope and green exact-head Verify, but visual/accessibility/photo QA remains required.
2. Review #220 as an independent current-main slice. Its exact-head Verify is green; manually test 375px, 390px, 768px, 1280px and 1440px, viewport edge behavior, card-to-pin selection, details, empty/error/loading states, and unpinned list records.
3. Review #213 after #211’s parent review. Its child branch is refreshed and Verify is green, but it remains dependent on #211 and requires Journey/Road Trip manual QA.
4. Review #221 as internal source-operations functionality. Ensure the wording never equates a successful source refresh with a guarantee that any particular event is still available or unchanged; manually inspect the reviewer-only page.
5. Have a repository administrator enable/check main protection and confirm Lovable’s Git sync target is non-main before allowing Lovable build/edit writes. No agent should merge or deploy.
6. For “Ask about this place”, treat the main-branch component as a disabled placeholder. Continue Issue #209 only after verified record eligibility, source/freshness citations, prompt-injection regression tests, bounded I/O, and approved shared rate/cost controls exist.
7. Obtain the actual Grok archive/screenshots and a verified manifest before declaring full design parity.

## Original design package manifest and exclusion list

**Archive evidence:** read-only commands in the connected Lovable project environment reported both uploads byte-identical with SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`. This hash was obtained by the Lovable agent with `sha256sum` during this inspection; the ZIP bytes themselves have not been committed to this repository. Last source inventory: 21 October 2026.

**Prototype identity / structure**
- The archive's `.github_repo` points to `mattleask373-rgb/world-s-finder` (not `life-lived-network`).
- TanStack Start/Router + Vite + Tailwind 4; prototype-specific Zustand store, Better Auth/Kysely/PGlite path, `src/router.tsx`, `src/routes/__root.tsx`, `src/routeTree.gen.ts`, `src/styles.css`.
- Shared visual implementation references: `src/components/shell.tsx` and `src/components/bits.tsx` (`CompassMark`, `PageHead`, `EmptyState`, `PlaceCard`, `FeaturedPlace`, `AtlasBoard`, `ChoiceRow`, `SearchField`, among others).
- Prototype routes found: `/`, `/map`, `/journey`, `/moments`, `/need`, `/give`, `/you`, `/place/$id`. Their canonical mapping and screenshot parity must be checked before any route changes.
- Screenshots listed by filename/metadata: built/preview home (desktop/mobile), `home-mobile-check.png`, `journey-desktop.png`, `map-desktop.png`, `map-mobile.png`. The agent did not visually open them; dimensions and page semantics are filename/metadata-based until human review.

**Explicitly exclude from canonical runtime**
- `src/data/atlas.ts` sample listings, moments, needs, named people and hard-coded sample cities (Lisbon, Kyoto, Oaxaca, Cape Town).
- Prototype photos in `public/media/*.jpg`; rights and provenance are unknown.
- `src/lib/store.ts` / `useAtlas`, `src/lib/match.ts` (`suggestHours`, `planTrip`), fixed map positions, and mock matching/inventory paths. They would create a second data store/matcher and violate the canonical `findSupply()` contract.
- Prototype auth/data/multiplayer paths (`src/lib/auth/*`, `src/lib/app-data/*`, `src/lib/multiplayer/*`), `migrations/auth/0001_auth.sql`, PGlite/better-auth schema, generated `.vercel/*` output, `.tanstack/*`, preview bridge, `.grok/*`, scripts, startup/deployment settings and other development machinery.
- Fonts under `.grok/fonts/*.ttf` until their licence is reviewed. Existing Fraunces + Manrope reference notes are already in `docs/design/grok-reference/`; do not create a second token system.

**Safe reference treatment**
- Current canonical reference notes: `docs/design/grok-reference/README.md`, `prototype-styles.css`, `prototype-ui-patterns.md` on the #211 candidate branch. They preserve palette/typography/pattern descriptions, not a complete prototype app.
- Screenshots could be copied to `docs/design/grok-reference/screenshots/` only after human visual inspection and rights/provenance approval. They were not imported by this update.
- Reuse the idea, not the prototype runtime: map every screen to canonical routes/components, use canonical data/server functions, and preserve source/freshness/trust and honest empty states.

| Source item | Location / origin | Status |
|---|---|---|
| `grok-workspace.zip` | Lovable workspace upload; SHA-256 above | Inventoried read-only; not copied into repository |
| `grok-workspace-2.zip` | Lovable workspace upload; same SHA-256 | Byte-identical duplicate according to read-only hash check |
| Desktop/mobile screenshots | Listed in source ZIP | Dimensions reported; visual review and rights check pending |
| Fonts and public/media photos | Source ZIP | Do not port until licences and provenance are checked |
| Canonical visual reference | `docs/design/grok-reference/` on PR #211 branch | Notes only; not a deployed source application |

## Agent start prompt

> Read this handoff and `docs/ai/GROUNDED-ASSISTANT-AND-GLOBAL-INTEGRATION.md` first. Inspect current `main` and relevant open PRs before editing. Make the smallest reviewable frontend-only change that integrates the Grok-inspired design into the existing app. Preserve canonical data and safety contracts; do not introduce prototype data, a parallel app/backend, or production/auth/database changes. Report exact base/head SHAs, changed files, tests, screenshots/manual checks, conflicts, and outstanding owner decisions.
