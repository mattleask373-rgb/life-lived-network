# Grok Redesign — Shared Agent Handoff

**Purpose:** Give every AI agent and contributor one canonical place to understand the Grok-inspired redesign, locate the current implementation, and integrate further UI work without replacing the existing Real World Atlas / Life Lived Network application.

**Canonical repository:** https://github.com/mattleask373-rgb/life-lived-network  
**Product:** Real World Atlas / Life Lived Network  
**Current app:** https://life-lived-network.lovable.app  
**Change policy:** Documentation and frontend-only integration by reviewed PR. Do not merge, deploy, change production data, or modify auth/schema/RLS/secrets without explicit owner approval.

## Important distinction: design reference vs. source code

The repository already contains Grok-inspired redesign work. The canonical app and its existing domain logic remain the integration target. Do not create a second product or replace the app with a standalone prototype.

**Source package inventory — checked read-only in the connected Lovable workspace on 21 October 2026:** the two uploaded archives `/mnt/user-uploads/grok-workspace.zip` and `grok-workspace-2.zip` were reported byte-identical with SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`. The archive's `.github_repo` points to `mattleask373-rgb/world-s-finder`, not this canonical repository. A read-only Lovable agent opened and visually inspected five source screenshots in temporary scratch space outside the app; the findings are recorded in PR #211's Phase 3 review section below. This was **source-reference inspection, not browser testing of PR #211 and not human accessibility sign-off**. The ZIP and binary assets are **not checked into this canonical repository**. Font/photo rights are unknown. Treat the export as a design reference only: do not port its mock data, duplicate state/matching/auth/database layer, build output or development tooling. Add only selected assets after explicit licensing/provenance review and human approval.

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

## Phase 3 integration state — 21 October 2026 (fresh audit)

This is a review snapshot, not a merge/deployment statement. **Canonical main is `8d79247991187bf64813cf72e3ec75aeb508e2e9`**, also the latest commit reported by the connected Lovable project. Issue #125's latest logged coordination probe is at approximately 09:08 UTC. Recheck every PR head, base and Verify run before any merge.

- **Main / Lovable control:** the actual Project Settings → Git target is still unknown. A read-only command in the connected Lovable workspace reported local branch `edit/edt-9c3ef14e-ad19-4b75-9eb7-684df9790107`, HEAD `8d79247...`, clean tree; that is not proof of the configured sync target. Issue #133 records a read-only Lovable turn writing `src/integrations/supabase/types.ts` directly to main. Do not send write-capable prompts to Lovable until a human verifies that edits are isolated on a non-main sync branch. Earlier audit reported ruleset #24946178 disabled; current enforcement still needs administrator confirmation.
- **#211 — design/accessibility foundation:** [open draft](https://github.com/mattleask373-rgb/life-lived-network/pull/211), head `b492c262d6ea73f0f2028300db96c41ee0b6c289`. Current-main comparison says 24 commits ahead / 0 behind and 13 unique files. Exact-head Verify passed in [#39521447625](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521447625). It improves EntryCard semantics/focus, source-photo handling, detail-sheet presentation, map controls/clustering and shared styling. Manual visual, keyboard, screen-reader, contrast, reduced-motion, zoom and source-photo review remain outstanding.
- **#220 — home map/list synchronization:** [open draft](https://github.com/mattleask373-rgb/life-lived-network/pull/220), head `6a50f7d3d390c7e3af33103accf65fc0f340febe`. Current compare uses main `8d79247...` as merge base, 4 commits ahead / 0 behind, with exactly three changed files: `src/routes/index.tsx`, `src/lib/map-list-sync.ts`, and its tests. Exact-head Verify passed in [#39521546086](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521546086). It synchronizes the existing map and loaded records, retains unpinned entries in the list and labels the broad mode “Show all loaded records.” Manual map-edge, selection, viewport, responsive and accessibility QA remain. **#216 is closed unmerged and superseded by #220.**
- **#221 — source-refresh health:** [open draft](https://github.com/mattleask373-rgb/life-lived-network/pull/221), head `7352f86d464da447a6ba0b579bf98f6cd7ddc338`. Exact-head Verify passed in [#39521313627](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521313627). It provides truthful health labels in the authenticated admin/moderator sources panel. It is not a scheduler, feed poller, or public “real-time” guarantee.
- **#229 — sourced-entry last checked:** [open draft](https://github.com/mattleask373-rgb/life-lived-network/pull/229), head `ae6c2b58face1086fecd6ee709b368b8701632de`, stacked on #211. Exact-head Verify passed in [#39523136027](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39523136027). It passes real `last_checked_at` through the public listing normalizer and displays it only for eligible non-demo sourced entries. It does not prove event availability or implement polling/refresh. Before merge, reconcile overlapping `WorldEntry` and `rowToEntry()` work in #215/#219 and test that both the opportunity fields and `lastCheckedAt` survive.
- **#231 — Journey/Road Trip styling:** [open draft](https://github.com/mattleask373-rgb/life-lived-network/pull/231), head `0e5f0f1a8ce746b3090ae0ecfcbd4aaa063c9d1c`, stacked on #211. Exact-head Verify passed in [#39522486798](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39522486798). Manual form, touch target, keyboard/screen-reader, zoom and reduced-motion QA remain. **#213 is closed unmerged and superseded by #231.**
- **#232 — private-route guard tests:** [open draft](https://github.com/mattleask373-rgb/life-lived-network/pull/232), head `f4a98108eb79b40874afc420d790b86c7950913c`, test-only. Exact-head Verify passed in [#39522559252](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39522559252). Independent human review remains.
- **#233 — Ask-this-place fail-closed policy:** [open draft](https://github.com/mattleask373-rgb/life-lived-network/pull/233), head `6b91db1717cbbc63e1f586a1d4be322f2f546cbb`. Exact-head Verify passed in [#39526369799](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39526369799). It adds a pure policy seam and tests only; no model call or public assistant endpoint. Main's `AskThisPlace` UI remains disabled and explicitly says “Coming soon.”
- **Work-opportunity/data chain:** #215 contract (`047b9cc...`, Verify [#39525518931](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525518931)) → #219 surfaces (`39dd142...`, Verify [#39525605892](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525605892)) and #223 Adzuna staging (`e4e1b7d...`, Verify [#39525559104](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525559104)) → #222 indexability/sitemap gate (`03e81aba...`, Verify [#39525688153](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525688153)) → #228 manual locality refresh (`dcfaf299...`, Verify [#39525738594](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525738594)) and #230 quiet-service Need prefill (`90cd6d98...`, Verify [#39525756267](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525756267)). All are drafts and require human review. Adzuna remains fixture/staging-only; no live provider activation, credentials, schedule or public inventory is implied.
- **Source archive findings:** Lovable's read-only inspection reports `grok-workspace.zip` and `grok-workspace-2.zip` have SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`; this hash is reported by that tool, not independently recalculated in this repository. Five screenshots were visually inspected. They show blank prototype photo/city-tile areas, mobile home overflow, a clipped Journey heading and undersized controls, desktop map chip clipping, plus overlapping mobile pins and a list row behind bottom navigation. Prototype data/photos/fonts are not production-ready; photo/font rights are not evidenced. The archive remains outside the canonical repository.
- **Launch / SEO:** the latest logged unauthenticated probe in [Issue #125 comment #6312312814](https://github.com/mattleask373-rgb/life-lived-network/issues/125#issuecomment-6312312814), around 09:08 UTC, reports live `/robots.txt` still serving platform-default blanket Allow (no Disallow/Sitemap) and `/sitemap.xml` returning an HTML 404 while repository assets/routes are aligned. A fresh HTTP refetch was not available through this chat's web tool, so this is the latest logged evidence, not a new probe. Human-authorized republish/hosting diagnosis followed by live GET verification remains a release blocker.
- **Fixture policy:** Issue #130 is still open, but current main's `fixtures-policy.server.ts` returns false whenever `NODE_ENV=production` (even if `WORLD_FIXTURES=true`), `world.functions.ts` merges fixtures only when `fixturesAllowed()`, and tests cover the production override. The reported old source defect appears corrected; reconcile/close the issue only after maintainer review of the current code and tests.
- **Remaining security/autonomy risks:** #164 remains open for broad default ACLs and needs a least-privilege matrix + disposable environment proof before any privilege change. #133 remains open for the Lovable direct-main write. Issue #121 and #116–#119 describe the 24/7 agent-control-plane work; no verified durable executor heartbeat or continuously running worker is evidenced in this audit. Do not describe the service as autonomous/24-7 yet.
- **Source of truth:** `findSupply()` remains the sole discovery authority. `groundedMatch()` ranks supplied entries; it does not itself prove rights/publication eligibility. The existing signed-in draft-assist is review-before-submit. No public Ask-this-place endpoint is enabled.

### Recommended next order

1. Human repository owner confirms Lovable Project Settings → Git (repository + branch), establishes a non-main sync destination, and an administrator verifies/enables required main protections/checks. Do not delegate code edits to Lovable until this is proven.
2. Human reviewer completes real browser QA for #211; then approve/merge through the protected process. #220 is independent, but re-run its exact-head checks and manual map/list QA against the resulting main/map component.
3. Review/merge the independent #232 route-guard tests and #233 policy seam after independent code review; keep Ask-this-place disabled until a bounded server endpoint has auth, server-side eligible retrieval, citation/freshness, prompt-injection tests, rate/cost caps and an explicit feature gate.
4. Reconcile #229 with #215/#219 before integrating provenance/freshness; use “last checked” honestly, not “live”/available. Keep #223 staging-only until source rights and live activation have explicit approval.
5. Diagnose/re-authorize the live publish path for robots/sitemap and verify the live responses after the release. Start 24/7 executor proof separately in a confirmed disposable/non-production environment under Issues #116–#121.

## Redesign parity matrix

The original ZIP has been inventoried read-only through the originating Lovable workspace; its bytes/screenshots remain outside this repository. Five screenshots have been visually reviewed by an AI inspection agent, but **the PR's own rendered output has not been browser-tested and a human visual/accessibility sign-off is still missing**. This is a source-informed route/component parity inventory, not a claim of complete parity. Route mappings marked provisional below must be confirmed against actual implementation and product semantics, not inferred from names alone.

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
| `/journey` | `/journey` — `src/routes/journey.tsx` | Existing canonical route; #231 is the active draft visual follow-up. #213 is closed as superseded. | Preserve existing canonical trip/journey models; no prototype store or match helpers. |
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



## Phase 3 integration security gate — administrator action required

Read-only GitHub API check on 21 October 2026 confirms ruleset [#24946178 — living World - protect main](https://github.com/mattleask373-rgb/life-lived-network/rules/24946178) currently has `enforcement: disabled`. The configured Lovable Project Settings → Git destination is **UNKNOWN**: the connected agent can see a local `edit/*` branch/HEAD matching current main, but cannot read the Settings page. Do not permit write-mode Lovable editing until an administrator verifies its Git destination.

The ruleset already expresses useful requirements (1 approving review, dismiss stale approvals, approval of the latest push, resolved review threads, prevent deletion/non-fast-forward, no bypass actors), but its required status list is not safe to enable verbatim:
- `verify` from GitHub Actions (integration id 15368) is the observed successful check-run name.
- `.github/workflows/verify.yml,` contains an apparent trailing comma and is not an observed check-run name.
- `Verify` is also not an observed check-run name in current commits.
Before enabling enforcement, a repository administrator must edit required status checks to the exact observed context `verify` (GitHub Actions app/integration id 15368), remove the two stale/malformed contexts, then enable the ruleset. Require PR review, dismiss stale approvals, require last-push approval/thread resolution, and no bypass. The connected GitHub tool supports ruleset **reads only** and cannot perform this admin write; this handoff does not claim protection has been enabled.

## Ownership and handoff queue

These are role proposals, not confirmed individual assignments.

| Task | Proposed owner role | File / contract scope | Depends on | Completion evidence |
|---|---|---|---|---|
| Review #211 design foundation | Human integration reviewer | Files listed in #211; avoid parallel edits to those files | Current main `8d792479…` is an ancestor of head `b492c262…` | Review decisions, exact-head Verify and manual accessibility QA |
| Review #220 map/list behavior | Frontend reviewer + product owner | `src/routes/index.tsx`, `src/lib/map-list-sync.ts`, its tests | Current-main base already verified; no #211 dependency | Exact-head Verify, viewport edge tests, mobile/desktop visual and keyboard review |
| Review #231 Journey/Road Trip | Frontend owner | `src/routes/journey.tsx`, `src/routes/road-trip.tsx`, `src/lib/traveller-visual-foundation.test.ts` | Latest #211 parent; independent of #220 file scope. #213 is closed unmerged. | Current-base diff, passing exact-head Verify and manual journey/form QA |
| Review #215 → #223/#219 → #222 → #228/#230 | Work/SEO integration reviewer | Contract, adapter/surface, indexability/sitemap and locality/Need files listed in the PRs | Branches refreshed in order; each direct compare has 0 commits behind its parent | Exact-head Verify on each, human contract/policy/URL review, and post-approved-release live checks |
| Reconcile #229 freshness with WorkOpportunity | Data-contract integrator | `src/lib/world-data.ts`, `src/lib/listings.ts`, and related tests | #229 parent is #211; #215/#219 also change WorldEntry/listing normalization | Combined tests prove `workOpportunity` and `lastCheckedAt` both survive `rowToEntry()` and current-main rebasing |
| Recover source provenance | Design-source owner | Original ZIP/screenshots/manifest only | Actual archive or accessible share supplied | File exists, origin/date/checksum verified, screen manifest populated |
| Confirm repository controls | Repository administrator | Main branch/ruleset and Lovable Git settings | Human permission | Current screenshots/API evidence of non-main sync, enforced PR + required checks |
| Continue source/SEO verification | SEO/release owner | Existing SEO code and hosted response path only | Access to fresh live HTTP evidence | Timestamped robots/sitemap responses; do not change publish settings without approval |

## Current recommended order

1. Keep all candidates in draft. A human should review #211 first: its current-main merge has clean scope and green exact-head Verify, but visual/accessibility/photo QA remains required.
2. Review #220 as an independent current-main slice. Its exact-head Verify is green; manually test 375px, 390px, 768px, 1280px and 1440px, viewport edge behavior, card-to-pin selection, details, empty/error/loading states, and unpinned list records.
3. Review #231 after #211’s parent review. Its three-file child diff is freshly ported against the current #211 head and Verify is green. #213 is closed unmerged to remove a duplicate candidate; Journey/Road Trip manual QA remains.
4. Review #221 as internal source-operations functionality. Ensure the wording never equates a successful source refresh with a guarantee that any particular event is still available or unchanged; manually inspect the reviewer-only page.
5. Have a repository administrator enable/check main protection and confirm Lovable’s Git sync target is non-main before allowing Lovable build/edit writes. No agent should merge or deploy.
6. For “Ask about this place”, treat the main-branch component as a disabled placeholder. Continue Issue #209 only after verified record eligibility, source/freshness citations, prompt-injection regression tests, bounded I/O, and approved shared rate/cost controls exist.
7. Have a human reviewer open a rendered PR #211 preview at all required breakpoints and perform keyboard, screen-reader, 200% zoom/reduced-motion and source-photo checks. The original screenshots have been visually inspected by an AI agent, but the implementation branch has no reachable preview, so its manual QA is still NOT PERFORMED.

## Original design package manifest and exclusion list

**Archive evidence:** read-only commands in the connected Lovable project environment reported both uploads byte-identical with SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`. This hash was obtained by the Lovable agent with `sha256sum` during this inspection; the ZIP bytes themselves have not been committed to this repository. Last source inventory: 21 October 2026.

**Prototype identity / structure**
- The archive's `.github_repo` points to `mattleask373-rgb/world-s-finder` (not `life-lived-network`).
- TanStack Start/Router + Vite + Tailwind 4; prototype-specific Zustand store, Better Auth/Kysely/PGlite path, `src/router.tsx`, `src/routes/__root.tsx`, `src/routeTree.gen.ts`, `src/styles.css`.
- Shared visual implementation references: `src/components/shell.tsx` and `src/components/bits.tsx` (`CompassMark`, `PageHead`, `EmptyState`, `PlaceCard`, `FeaturedPlace`, `AtlasBoard`, `ChoiceRow`, `SearchField`, among others).
- Prototype routes found: `/`, `/map`, `/journey`, `/moments`, `/need`, `/give`, `/you`, `/place/$id`. Their canonical mapping and screenshot parity must be checked before any route changes.
- Screenshots listed in the archive: built/preview home (desktop/mobile), `home-mobile-check.png`, `journey-desktop.png`, `map-desktop.png`, `map-mobile.png`. A read-only Lovable agent opened five source screenshots and reported blank prototype image/tile regions, mobile home overflow, a clipped Journey heading, desktop map-chip clipping, and mobile pin-label/list overlap. These observations describe the source screenshots only; no rendered PR branch was available to test, and no human accessibility sign-off has occurred.

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
| Desktop/mobile screenshots | Listed in source ZIP | Five original screenshots visually reviewed by a read-only AI agent; rendered PR preview and human review pending |
| Fonts and public/media photos | Source ZIP | Do not port until licences and provenance are checked |
| Canonical visual reference | `docs/design/grok-reference/` on PR #211 branch | Notes only; not a deployed source application |

## Agent start prompt

> Read this handoff and `docs/ai/GROUNDED-ASSISTANT-AND-GLOBAL-INTEGRATION.md` first. Inspect current `main` and relevant open PRs before editing. Make the smallest reviewable frontend-only change that integrates the Grok-inspired design into the existing app. Preserve canonical data and safety contracts; do not introduce prototype data, a parallel app/backend, or production/auth/database changes. Report exact base/head SHAs, changed files, tests, screenshots/manual checks, conflicts, and outstanding owner decisions.
