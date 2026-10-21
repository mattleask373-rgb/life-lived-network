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

## Phase 3 integration state — 21 October 2026 (dependency chain refreshed)

This is an evidence snapshot, not a merge/deployment statement. Recheck refs and checks before taking action. It supersedes the older SHA and CI status notes in previous snapshots below.

- **Current main:** 8d79247991187bf64813cf72e3ec75aeb508e2e9. Commit “Added Ask about this place box” adds a disabled, always-unavailable UI and no-answer contract/test to the locality page; it is not a functioning AI assistant. Issue #209 remains the gate for any public assistant.
- **Live SEO endpoints (read-only, checked 2026-10-21 00:40:17–00:40:18 UTC):** `/robots.txt` returned `200 text/plain` (160 bytes) without a `Sitemap:` directive; `/sitemap.xml` returned **404 `text/html`** (13,803-byte HTML shell, no XML `<urlset>`); homepage returned `200 text/html` with title, description and social-card metadata but no canonical or robots meta, and `og:image` points to an `r2.dev` asset. Critically, current repository `main` already contains `public/robots.txt` with private-path disallows + a sitemap directive and a minimal static `public/sitemap.xml`. The live origin did not serve those expected assets at the time checked, pointing to a hosting/publish/CDN/rewrite boundary gap. #222 adds the shared fail-closed page gate and dynamic sitemap route, but **no PR is a production fix until a human-approved release is followed by live GET verification** of `/robots.txt`, `/sitemap.xml`, and `/api/public/sitemap.xml`.
- **#211 — Grok redesign foundation:** [PR #211](https://github.com/mattleask373-rgb/life-lived-network/pull/211), branch `integration/grok-redesign-ui-current-main-2026-10-21`, head `b492c262d6ea73f0f2028300db96c41ee0b6c289`. A normal merge commit brought current main `8d79247991187bf64813cf72e3ec75aeb508e2e9` into the branch as first parent and kept prior head `e7b732d25cd951f3ab3c1007257442563e361336` as second parent. Current main comparison: 24 commits ahead / 0 behind, 13 unique changed files. Exact-head Verify passed in [run #39521447625](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521447625). Source screenshots were opened by a read-only agent; visible source issues include blank prototype image areas, home mobile overflow, clipped Journey title/control sizing, desktop map chip clipping and mobile pin-label/list overlap. These are source reference observations, **not tests of the rendered PR branch**. Human browser/keyboard/screen-reader review is still outstanding.
- **#231 — Journey/Road Trip:** [PR #231](https://github.com/mattleask373-rgb/life-lived-network/pull/231), head `0e5f0f1a8ce746b3090ae0ecfcbd4aaa063c9d1c`, is the active refreshed three-file child of #211. It covers Journey and Road Trip visual hierarchy, 44px controls, and source-backed photo fallback/credit. Exact-head Verify passed in [run #39522486798](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39522486798). It remains a draft and requires human responsive, keyboard/screen-reader, zoom/reduced-motion and real-photo/no-photo review after #211. **#213 is closed unmerged and superseded by #231**; do not reopen or merge #213.
- **#220 — home map/list:** [PR #220](https://github.com/mattleask373-rgb/life-lived-network/pull/220), head 6a50f7d3d390c7e3af33103accf65fc0f340febe, refreshed with current main as first parent and prior head e8fd148fa0223707fd317b80b19a47944c0bf1a2 as second parent. Diff remains three files and does not overlap main’s latest changes. Exact-head Verify passed in [run #39521546086](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521546086) and [run #39521540270](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521540270). It is independent of #211. PR #216 is closed unmerged and superseded.
- **#221 — source-refresh health:** [PR #221](https://github.com/mattleask373-rgb/life-lived-network/pull/221), head 7352f86d464da447a6ba0b579bf98f6cd7ddc338, based on current main 8d79247991187bf64813cf72e3ec75aeb508e2e9. Adds a pure source-refresh-health classifier, deterministic tests, and a status sentence on the existing authenticated admin/moderator-only /sources page. Verify passed in [run #39521313627](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521313627) and [run #39521311442](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521311442). This describes source connection health only; it does not implement scheduled ingestion, live-feed polling, or public real-time guarantees. Manual browser/accessibility review remains.
- **#225 — manual locality refresh (superseded):** [PR #225](https://github.com/mattleask373-rgb/life-lived-network/pull/225) is **closed unmerged**; its isolated implementation was ported by a contributor into #228 on top of the SEO/indexability gate. Preserve #225 for audit and do not merge or reopen it. Its own exact-head Verify passed in [run #39521481713](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521481713), but #228 is now the active candidate.
- **#215 — WorkOpportunity contract:** [draft PR #215](https://github.com/mattleask373-rgb/life-lived-network/pull/215), refreshed head `047b9cc830a4929a0de96f000770a582c1f2b512`, now based on current `main` `8d79247991187bf64813cf72e3ec75aeb508e2e9`. Direct diff is five contract files (`service-taxonomy`, `work-opportunities`, `world-data` and tests), 9 commits ahead / 0 behind. Exact-head Verify passed in [run #39525518931](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525518931). Human review of policy/eligibility edge cases remains required.
- **#223 — Adzuna staging bridge:** [draft PR #223](https://github.com/mattleask373-rgb/life-lived-network/pull/223), refreshed head `e4e1b7d66c3fbc7ae75bcc714d323363559b83d3`, stacked on #215 head `047b9cc830a4929a0de96f000770a582c1f2b512`. Direct diff is six parser/adapter/test files. Exact-head Verify passed in [run #39525559104](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525559104). It remains fixture/staging-only: no HTTP, credentials, schedule, persistence or live provider activation; source rights and policy approval precede any live feed.
- **#219 — WorkOpportunity surfaces:** [draft PR #219](https://github.com/mattleask373-rgb/life-lived-network/pull/219), refreshed head `39dd142e7650f614c80b81f32e1fa7e3776194d1`, stacked on refreshed #215. Direct diff remains 12 presentation/Need-prefill files, 13 commits ahead / 0 behind. Exact-head Verify passed in [run #39525605892](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525605892). No opportunities become public unless the existing publication/rights/policy predicate passes.
- **#222 — SEO indexability + sitemap gate:** [draft PR #222](https://github.com/mattleask373-rgb/life-lived-network/pull/222), refreshed head `03e81aba9a4f0e1974a17c48afb78931747f8b49`, stacked on refreshed #219 head `39dd142e7650f614c80b81f32e1fa7e3776194d1`. Direct diff has zero commits behind its parent and contains the fail-closed indexability gate, canonical public-data sitemap adapter, conservative structured data and tests. Exact-head Verify passed in [run #39525688153](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525688153). Its sitemap index route `/api/public/sitemap.xml` points to `/api/public/sitemap-pages.xml`; route names are aligned in the branch. Human policy/URL review and post-deploy live checks remain mandatory.
- **#228 — locality refresh on gated pages:** [draft PR #228](https://github.com/mattleask373-rgb/life-lived-network/pull/228), refreshed head `dcfaf299db2186e5d9110ceead48a66e6d7beea1`, stacked on refreshed #222 head `03e81aba9a4f0e1974a17c48afb78931747f8b49`. Direct diff remains four files; it calls only `router.invalidate()` and keeps the indexability gate/disabled AskThisPlace panel. Exact-head Verify passed in [run #39525738594](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525738594). Human responsive, keyboard and screen-reader QA remains required.
- **#230 — quiet service → Need prefill:** [draft PR #230](https://github.com/mattleask373-rgb/life-lived-network/pull/230), refreshed head `90cd6d98f4ab205bbd8ca568f1bbe062c7e2a69a`, stacked on the same refreshed #222 head. Direct diff remains four files; location/category prefill is an editable draft and never submits a Need automatically. Exact-head Verify passed in [run #39525756267](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525756267). Human signed-in/signed-out and unknown-place review remains required.
- **#229 — public source-check timestamp (dependent):** [draft PR #229](https://github.com/mattleask373-rgb/life-lived-network/pull/229), branch `feat/public-source-last-checked-2026-10-21`, head `ae6c2b58face1086fecd6ee709b368b8701632de`, stacked on #211 at parent head `b492c262d6ea73f0f2028300db96c41ee0b6c289`. It carries `last_checked_at` into `WorldEntry` for source/confirmed records and displays “Source last checked …” in the redesigned entry detail only for non-demo source records. It does not claim event availability, recalculate expiry, add polling, or change eligibility. Exact-head Verify passed after switching the absolute fallback to a deterministic UTC date in [run #39523136027](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39523136027): frozen install, lint, tests and build all passed. Manual QA remains. Do not merge before #211 is approved; then rebase/retarget to main and rerun Verify. **Integration collision to resolve before merge:** #215/#219 also update `WorldEntry` and `rowToEntry()` via `src/lib/world-data.ts` and `src/lib/listings.ts`; after the relevant parent(s) land, rebase/retarget this PR and prove both `workOpportunity` and `lastCheckedAt` survive together with a combined regression test.
- **#210 — this handoff:** [open draft documentation PR](https://github.com/mattleask373-rgb/life-lived-network/pull/210). It keeps the single shared parity/ownership document and the `docs/agents/STATUS.md` snapshot. Recheck its latest head/Verify after this Phase 3 update; all edits stay on the isolated docs branch.
- **Governance:** repository ruleset #24946178 (“living World - protect main”) currently reports enforcement disabled. A repository administrator must verify and enable required PR/review/check protections. Lovable’s actual Project Settings → Git sync destination has not been verified; do not enter Lovable edit/build mode until its target is confirmed not to be main.
- **Design source:** read-only inspection in the connected Lovable workspace on 2026-10-21 found `grok-workspace.zip` and `grok-workspace-2.zip` byte-identical by `sha256sum`: `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`. Their `.github_repo` points to `mattleask373-rgb/world-s-finder`, not this repo. A read-only Lovable agent opened five screenshots; visual notes appear in #211. These are reference-screen observations, not tests of the rendered PR branch and not a human accessibility sign-off. The archive is not in the canonical repo; font/photo rights remain unknown.



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
