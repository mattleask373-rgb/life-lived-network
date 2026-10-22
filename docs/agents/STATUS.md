# Agent System Status — 2026-10-22 (current-main coordination snapshot)

## Authoritative snapshot — live refresh 22 October 2026, 18:34 UTC

- **Canonical main:** `a99d09f1517523a7a388245ca6b3d5c1245816cb`. A historic pass is not a substitute for exact-head checks. Main has not been modified by this audit.
- **Open queue:** live REST inventory is **79 open PRs (41 drafts / 38 non-drafts), 14 targeting non-main base branches, and 76 with base SHA different from main**. Convergence remains the critical path.
- **Hierarchy completeness / new global-scale blocker:** current main `src/lib/place-index.server.ts` requests `.limit(5000)`, ignores the Supabase error field and builds an index from `data ?? []`. Client `fetchPlaces()` in `src/lib/places.ts` caps at 2,000 rows and does not paginate; `WorldProvider` derives `placeIds` from that partial index and passes them to `getWorld()`. `world.functions.ts` trusts a non-empty client-supplied `placeIds` list instead of recomputing descendants from the canonical server index. An incomplete client list can make a true >400-descendant locality appear under the server filter cap, causing incomplete results instead of the intended `SCOPE_TOO_WIDE`. This is a confirmed code-path risk, not evidence the current place table exceeds either cap or that data leaked. #291's current head does NOT fix this yet; add error propagation, sentinel/deterministic pagination or an authoritative count, server-derived scope, explicit incomplete-index state, and exact-cap/cap+1/late-page-error tests before claiming global locality completeness.
- **Place metadata validation:** current `places` DDL has no `CHECK` on `kind`, permits empty `country_code`, and defaults timezone/currency; `toPlace()` silently maps unknown kinds to `city`, while `buildPlaceIndex()` treats missing parents as roots. This is a schema/type/data-validation gap, not evidence existing rows are invalid (no hosted rows were queried). Before adding markets, validate kind, ISO country/currency, IANA timezone, coordinate ranges, parents/cycles and migration/backfill; do not invent live-data counts.
- **Combined SEO/locality/map/viewport/source-lifecycle candidate:** [#291](https://github.com/mattleask373-rgb/life-lived-network/pull/291), head `81424beac00a4055ae6598ba2aeb5cf6bfcbd1a4`, includes public/private/noindex route policy, live GET-only SEO checks, fail-closed locality scope, date-line corrections, capped viewport pagination and source freshness/keyset paging. Exact-head Verify, CodeQL, TypeScript analysis and locked dependency audit passed. Supabase Preview is skipped by repository configuration. The PR remains draft/unmerged pending independent review and owner release gates.
- **New P0 gaps identified by exact-head cross-audit (not fixed in #291):** (A) `getOpenNeeds(placeId)` in `src/lib/needs.functions.ts` still filters descendants only when count is 2–400; >400 runs unfiltered and can show needs outside the selected locality. (B) `src/routes/need.index.tsx` maps failed/missing results to an empty list and `src/routes/$country.$place.index.tsx` hardcodes zero open needs; query error/loading must be distinct from a verified zero. (C) sitemap eligibility counts raw published rows with separate cancellation/time filters rather than the canonical `getWorld()` source/origin lifecycle decision, and the >400 locality fallback uses global-first-page rows. These need caller-level tests and one shared server-side public-eligibility policy before review acceptance.
- **Duplicate cleanup:** #271 and #295 are closed **without merge** after their unique changes were ported into #291; neither closure modified main. The combined #291 branch is the only active candidate for these overlapping SEO/locality/viewport changes.
- **Pagination residual:** #291 now fetches one look-ahead row and uses deterministic ID ordering, manual load-more/retry and a five-page cap. Offset paging is not a transaction-wide snapshot; concurrent insert/remove/reorder can still skip items. Review must accept this stated limitation or require a separately designed keyset/snapshot path before claiming strict completeness.
- **Source lifecycle:** [#293](https://github.com/mattleask373-rgb/life-lived-network/pull/293), head `40e533bf6689c6c5cea2a5aba27660baea214958`, consolidates freshness and bounded source-record scans using the immutable UUID primary key. Verify, CodeQL, TypeScript and dependency audit passed on that exact head. It does not claim transaction-wide snapshot isolation. Duplicate #292 is closed unmerged.
- **AI request/spend:** #289 head `ee7937da4b3600b1fbac0ff637fa657778a710ad` has recorded green checks but remains unmerged. #290 still requires durable account-level limits, multi-instance concurrency/replay proof, provider spend caps/alerts and an operator kill switch.
- **Plan/status PR:** [#294](https://github.com/mattleask373-rgb/life-lived-network/pull/294) currently points to plan head `a2efe12a91ae362960728fd16c7308c7bb3aef41`; its last observed Verify was still running while CodeQL, TypeScript and dependency audit passed. This snapshot refresh makes those earlier results stale; exact-head checks must finish again after this write. Keep the documentation PR draft.
- **Control-plane lineage:** main has only the tail migrations that remove an unfenced heartbeat and replace the fenced release RPC; their required table/function creation chain is absent from main migration history. The candidate chain is on `phase3-supervisor-reconciliation`, 108 commits ahead and 639 behind main. Do not merge it wholesale. [The migration reconciliation audit](https://github.com/mattleask373-rgb/life-lived-network/blob/agent/chatgpt/year-one-plan-current-main-2026-10-22/docs/agents/CONTROL-PLANE-MIGRATION-RECONCILIATION.md) documents dependencies and clean-replay vs already-applied-remote paths. #116/#117 remain blocked on owner-confirmed remote history/project identity and disposable proof.
- **Ruleset:** active #24946178 has `verify`/latest-push/thread protections, but the live API reports `required_approving_review_count: 0` and did not return a deletion-protection rule. An administrator must correct/re-fetch the settings; independent approval is not proven enforced.
- **Lovable identity:** project metadata revision `7ca12a5900d708014d63b03847f2c922965ea1be`; actual Settings → Git repository/branch and production backend/build SHA remain unverified. No write/sync until owner confirms a protected non-main target.
- **Published SEO:** last direct workflow evidence [#39774993859](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39774993859) failed on the checked host with HTML 404 at `/sitemap.xml`, incorrect robots policy and homepage canonical/robots metadata failures. Current live probe could not be refreshed because the connected scrape service was rate-limited; do not infer a fix. This is not proof that private saved data leaked.
- **Access control / Life List / public AI:** #164/#194 need a disposable-DB matrix covering roles/default ACLs/RLS/storage/functions/connection authorization plus migration replay/rollback evidence. The source migration for `saved_items` defines owner policies using `auth.uid() = user_id`, but `useLifeList()` reads without an explicit `user_id` filter and treats read errors as `data ?? []`; effective hosted ACL/RLS must be tested with two authenticated users plus anon, and UI must surface read errors/session changes. This is not proof of a leak; `noindex` is not access control. Public “Ask about this place” remains disabled pending #209. No hosted DB/ACL/RLS/grant/schema/data change was made.
- **Localization readiness:** current main has no i18n/locale message files and no localization/Intl-formatting dependency in package.json; 29 route files remain the active route surface. This is a source-structure observation, not a full runtime translation audit. The existing place model carries country/timezone/currency metadata but UI text, plural rules, localized URLs/SEO/hreflang, per-locale content/safety copy and translation QA are not proven complete. Before any second-language/new-country launch, define locale negotiation/fallback, message catalogs, date/number/currency formatting, localized metadata/URLs, right-to-left support decision, untranslated-content indicators and native-speaker QA.
- **Pilot/outcomes/runtime:** no verified current evidence here proves consenting supply, completed exchanges, human-only funnel measurements, measured staging capacity or a durable authenticated 24/7 worker/heartbeat with fencing/recovery/cost controls. Daily coordinators are not continuous workers.

### Dependency-ordered next tasks

1. Repair P0-A/B/C on #291: fail closed for >400 open-needs scope, keep failed/loading counts unknown rather than zero, and make sitemap eligibility match the canonical public-discovery/source-lifecycle policy; add caller-level tests. Also fix the 5,000-row server / 2,000-row client place-index completeness gap and stop trusting partial client-supplied descendant IDs. Then obtain independent review and complete keyboard/screen-reader/mobile QA.
2. Review #293 source-provenance completeness and concurrent mutation behavior; keep imported records fail-closed on errors/overflow.
3. Reconcile #116 migration lineage on a current-main candidate; only after owner confirmation, run #117 hostile-role/fencing/idempotency/rollback tests against a confirmed disposable Supabase project.
4. Finish #164/#194 security evidence and #289/#290 durable AI abuse/spend controls.
5. Prove one opt-in pilot supply → consented enquiry → response → completion loop with bot-filtered outcomes before market replication/spend.
6. Keep administrator/owner decisions last: ruleset enforcement, actual Lovable/backend identity, #281 relation semantics, legal/commercial review, recruitment/outreach, source activation, budget and production release.

---

## Historical notes (do not treat snapshots below as current PR/main truth)

The following records preserve prior audit history. Their dates, SHAs, review states and candidate lists are historical unless reverified against live GitHub. Use the authoritative snapshot above for current coordination.

# Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA at the latest integration update: `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3` (verified as the base of current-main draft branches on 2026-10-21 at approximately 19:30 UTC). The earlier phase-3 queue below is a historical snapshot; use the latest update appended below for current candidate states.
- Since the earlier `006a98c...` baseline, three commits (`fea27ff`, `8801a50`, `30c2877`) improved PlacePicker/PlaceSearch, then three more (`eb54b10`, `9c4a9e9`, `8d79247`) added an explicitly unavailable “Ask about this place” placeholder and its no-answer contract/test to the locality page. It remains a disabled placeholder, not an active assistant endpoint.
- **Historical governance finding (superseded by the latest live read below):** an earlier audit observed the ruleset disabled and misconfigured required-check labels. The latest GitHub ruleset GET on 2026-10-21 shows it is now `active`, requires the exact `verify` status check with strict checks, one approving review, stale-review dismissal, approval of the latest push, resolution of review threads and no bypass actors. Keep the live ruleset read authoritative; do not reintroduce the old disabled-state claim. Lovable Project Settings → Git target remains UNKNOWN; require a human to confirm repo + non-main sync branch before write-mode edits.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.

## Foundation confirmed on main

- Canonical place model and hierarchy: src/lib/places.ts and server-side place/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Single possibility/discovery authority: findSupply() in src/lib/supply-engine.ts.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; doSomethingToday uses it through src/lib/intents.ts.
- Public listing retrieval and normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Generic locality route and generic service-locality route exist on main. The remaining SEO task is to reconcile the explicit fail-closed indexability gate and ensure page metadata and sitemap enumeration use the same decision.
- Existing AI draft assistant: src/lib/draft-assist.functions.ts and src/lib/draft-assist.server.ts. It is signed-in, schema-bounded and saves no draft automatically.
- A disabled “Ask about this place” placeholder and an always-unavailable state contract now exist on the locality page. They make no model call and carry no answer; no active read-only assistant endpoint is confirmed. Grounded matching is not an LLM assistant.
- Australia is not live. No rights-cleared pilot inventory should be implied by staging work.

## Design direction and active integration queue — 21 October 2026, current audit

This snapshot reflects the latest verified GitHub main comparison at `8d79247991187bf64813cf72e3ec75aeb508e2e9`. Review candidates are still drafts, not production baselines.

### Design and accessibility
- #211 — Grok foundation, open draft; head `b492c262d6ea73f0f2028300db96c41ee0b6c289`, 13-file diff against current main. Verify passed [#39521447625](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521447625). Manual visual/keyboard/screen-reader and source-photo review remain.
- #220 — home map/list synchronization, open draft; head `6a50f7d3d390c7e3af33103accf65fc0f340febe`, exactly three changed files relative to current main. Verify passed [#39521546086](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521546086). Independent of #211; manual map/list QA remains. #216 is closed unmerged/superseded.
- #231 — Journey/Road Trip, open draft; head `0e5f0f1a8ce746b3090ae0ecfcbd4aaa063c9d1c`, child of #211. Verify passed [#39522486798](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39522486798). #213 and #212 are superseded/closed unmerged.
- #229 — source `last_checked_at` display, open draft; head `ae6c2b58face1086fecd6ee709b368b8701632de`, child of #211. Verify passed [#39523136027](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39523136027). Resolve its `WorldEntry`/`rowToEntry` overlap with #215/#219 and add a combined regression test before merge.
- #232 — private-route guard tests, open draft, head `f4a98108eb79b40874afc420d790b86c7950913c`; Verify passed [#39522559252](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39522559252). Test-only.
- #233 — fail-closed Ask-this-place policy, open draft, head `6b91db1717cbbc63e1f586a1d4be322f2f546cbb`; Verify passed [#39526369799](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39526369799). Policy and tests only; public assistant endpoint remains absent.

### Work opportunities, ingestion, SEO and locality
- #215 contract `047b9cc...` — Verify [#39525518931](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525518931).
- #219 opportunity surfaces `39dd142...` — Verify [#39525605892](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525605892).
- #223 Adzuna staging bridge `e4e1b7d...` — Verify [#39525559104](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525559104); fixture/staging-only, no credentials or live feed.
- #222 indexability/sitemap gate `03e81aba...` — Verify [#39525688153](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525688153), child of #219.
- #228 manual locality refresh `dcfaf299...` — Verify [#39525738594](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525738594), child of #222; calls client router invalidation only.
- #230 quiet-service Need prefill `90cd6d98...` — Verify [#39525756267](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39525756267), child of #222; draft only, no submission.
- #221 source-refresh health `7352f86...` — Verify [#39521313627](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521313627); authenticated admin/moderator status labels, not a scheduler or real-time feed.

### Launch, security and autonomy gates
- Current main includes the home visual redesign, place-picker/search improvements, and a disabled “Ask about this place” placeholder. The Ask UI makes no model call. Grounded matching backs `doSomethingToday`; `findSupply()` remains the sole discovery authority.
- Current source appears to correct the issue #130 fixture bug: `fixturesAllowed()` is unconditionally false in production and tests cover `WORLD_FIXTURES=true`; issue #130 remains open for maintainer reconciliation.
- #164 remains an open database default-ACL least-privilege finding; no grant/RLS change without a matrix and disposable-environment proof.
- #133 remains an open incident about a Lovable read-only request causing a direct main write to generated Supabase types. Lovable Project Settings → Git sync target remains unverified; do not send write-capable requests until a human confirms the connected repository and a non-main sync branch. The earlier disabled-ruleset finding is historical; the latest GitHub ruleset GET reports the `main` ruleset is active with review and `verify` gates.
- Latest logged live probe in Issue #125 around 09:08 UTC reported live `/robots.txt` still platform-default Allow and `/sitemap.xml` returning HTML 404 while repository assets/routes are aligned. This chat could not independently refetch the live URLs; human-approved republish/hosting diagnosis plus fresh GET verification remains a launch gate.
- Issue #121 and #116–#119 define a future durable 24/7 agent control plane. **No verified persistent executor heartbeat/always-on worker is evidenced.** Do not claim autonomous 24/7 operation.
- Original `grok-workspace.zip` / `grok-workspace-2.zip` were reported byte-identical by the Lovable read-only scan (reported SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`); source archive remains outside canonical repo, and font/photo rights are unknown. Five screenshot observations are source-reference evidence, not browser QA of PR branches.

## Next actions

1. Repository administrator: confirm Project Settings → Git repo + synced branch, switch to non-main if necessary, and verify enforced main protections/required checks.
2. Human UI reviewer: inspect #211 at 375/390/768/1280/1440px; run keyboard, screen-reader, contrast, 200% zoom, reduced-motion and source-photo/no-photo checks. Human approves/merges only after evidence is recorded.
3. Frontend reviewer: review #220 map/list selection both ways, viewport edge cases and unpinned list items; rerun exact-head Verify after #211 changes the map foundation if merged first.
4. Data/security owners: review #232, #233 and #229; reconcile freshness with WorkOpportunity normalization; keep Ask-this-place disabled until endpoint prerequisites pass.
5. Product/release owners: review #215→#219 with #223 staging and #222→#228/#230 children, verify live robots/sitemap after an authorized release, and stage the 24/7 control-plane proof in a confirmed disposable environment.
 
## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.


## Latest integration execution update — 2026-10-21 19:33 UTC

**This section supersedes the candidate-status and next-action lists above.** Earlier notes recorded the state around 00:23 UTC and must not be treated as current PR merge/state truth. The connected GitHub workspace reports current `main` as `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3` for this integration pass. No candidate below was merged or deployed.

### Current-main draft PRs and exact-head Verify

- **[#242 — bounded viewport discovery](https://github.com/mattleask373-rgb/life-lived-network/pull/242):** draft, based directly on current `main`; Verify passed on exact head via [run #39662081945](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39662081945). It adds validated viewport bounds (1.5° latitude / 2.1° longitude), antimeridian-aware server filtering, cancellable reads, and map/list synchronization with honest broad/error/stale states. Manual responsive, keyboard and map-edge QA remains open.
- **[#241 — source freshness + approved WorkOpportunity terms](https://github.com/mattleask373-rgb/life-lived-network/pull/241):** draft, based directly on current `main`; Verify passed on exact head via [run #39661782432](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39661782432). It carries the real source check timestamp only for sourced/confirmed non-demo records, adds a tested label formatter, gates optional WorkOpportunity payloads with `isPublishableWorkOpportunity()`, and presents explicit terms in the entry detail sheet. It does not create a database column or assert that live persisted payloads exist; no work inventory is added by this PR.
- **[#243 — Journey/Road Trip editorial redesign](https://github.com/mattleask373-rgb/life-lived-network/pull/243):** draft, based directly on current `main`; Verify passed on exact head via [run #39662311756](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39662311756). It is a UI/accessibility presentation slice (larger headings, clearer editorial surfaces, improved touch targets, and source-backed photo or honest no-photo states). Manual 375px/1280px and accessibility QA remains open.
- **[#244 — fixture-first Adzuna staging adapter](https://github.com/mattleask373-rgb/life-lived-network/pull/244):** draft, based directly on current `main`; Verify passed on exact head via [run #39662509662](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39662509662). Pure parser/bridge/composition and fixture tests only. No HTTP, credentials, persistence, scheduler, live provider activation, or published inventory.
- **[#245 — fail-closed Ask-this-place policy](https://github.com/mattleask373-rgb/life-lived-network/pull/245):** draft, based directly on current `main`; Verify passed on exact head via [run #39662605731](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39662605731). It adds a pure eligibility policy and tests only; no UI wiring, retrieval endpoint, model call, or public assistant activation.
- **[#239](https://github.com/mattleask373-rgb/life-lived-network/pull/239) is closed unmerged**, superseded by #242 because #242 carries the viewport work directly onto current `main`.

### Confirmed integration collisions — 2026-10-21 live PR comparison

- **Map/viewport discovery: #242 vs #234.** The returned patches overlap across the map component, discovery contract, geo-bounds helper/tests, listing read path, map/list synchronisation, map view logic, server function and index route. #242 adds more guardrails/cancellation work, but both branches are open. Do not merge both. A reviewer should compare complete commits and coverage, choose one authoritative implementation, then mark the other superseded only after checking for unique fixes.
- **Ask-this-place policy: #245 vs #233.** Both returned patches contain the same policy and test paths (`src/lib/ask-place-policy.ts` and `src/lib/ask-place-policy.test.ts`) with matching patch sizes. #245 is the current-main draft with exact-head `verify` success; #233 is an older competing PR. Do not merge both. Compare full commits and review history, retain the current-main candidate if no unique change exists, and close/deprecate the duplicate only after human review.
- **Source freshness: #241 vs #240.** Both touch the freshness label and entry-sheet display; #241 extends this into reviewed WorkOpportunity presentation and contract-gated tests. Treat #241 as a consolidation candidate, not an automatic replacement: compare the unique assertions in #240 before deciding whether to close or port anything.
- **Work-opportunity ingestion: #244 alongside #197/#199.** The newer Adzuna adapter is deliberately fixture-only and staging-only. Reconcile the strict contract and dependent surface integration before merging parallel work; do not activate a provider, publish opportunities, or imply that a market is live based on parser tests.

Exact-head `verify` succeeded for #241–#246 in the live GitHub check-runs reads. This status document was then updated in commit `6bb53cf39d34235e8e7056a4441a8e7fdb1cc489`; its final Verify run also succeeded: [#39663181614](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39663181614) and [#39663173204](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39663173204). The Supabase Preview jobs were skipped, not passed as a live environment proof. Green checks establish code verification only; they do not establish Lovable target correctness, live API rights, hosted Supabase adversarial proof, visual QA, production readiness, or a human review.

Each candidate is still draft pending independent review and relevant manual evidence. A green Verify is not a human accessibility/security sign-off and does not authorize a merge or release.

### Remaining owner/release gates

1. **Lovable continuity:** Project Settings → Git repository + sync branch remain unverified. Issue [#133](https://github.com/mattleask373-rgb/life-lived-network/issues/133) records a prior direct-main write during a nominally read-only Lovable turn. Do not send write-capable implementation prompts until an owner verifies a non-main sync branch.
2. **Branch protection:** the latest live GET for ruleset [#24946178](https://github.com/mattleask373-rgb/life-lived-network/rules/24946178) reports `enforcement: active`. It targets the default branch, prevents deletion/non-fast-forward updates, requires the exact `verify` check (strict), one approving review, latest-push approval and review-thread resolution, and shows no bypass actors. Re-check before a release because settings can change; never bypass the required human approval.
3. **Authentication storage:** [PR #235](https://github.com/mattleask373-rgb/life-lived-network/pull/235) remains a separate security-review track; do not merge it with product/UI work.
4. **Ask-this-place:** keep the public UI disabled. Issue #209's server-side canonical retrieval, eligibility evidence, isolation, citation/freshness, prompt-injection, shared rate/cost limits, observability, and independent release gate remain prerequisites.
5. **Adzuna/work data:** the parser remains staging-only; source terms, canonical locality, freshness, market policy, compensation/engagement evidence and human publication approval remain prerequisites. No country/source is marked live.
6. **Robots/sitemap:** current source files and tests include private-path disallows and static/dynamic sitemap routes, but this pass could not independently reach the live Lovable endpoints with the available web verifier. Live host behavior therefore remains **unverified**; require a fresh owner-authorized GET check after any approved republish/hosting diagnosis.
7. **Visual QA:** #241/#242/#243 require real browser checks at mobile/desktop breakpoints, keyboard-only operation, visible focus, screen-reader names, zoom/reduced-motion, map/list interactions, sourced-photo/no-photo states and honest quiet/error/freshness states.

## Confirmed technical SEO gap — sitemap coverage

A fresh source-level read of current `main` found a concrete mismatch between existing public routes and crawler discovery:

- Canonical locality and service route files exist: `src/routes/$country.$place.index.tsx` and `src/routes/$country.$place.$service.tsx`. The locality page becomes indexable only when it has at least three non-demonstration entries; the service page delegates to `servicePageIndexable()`.
- The public sitemap lists only the six static paths in `PUBLIC_PATHS` (home, journey, road trip, life list, give, make). `src/routes/api/public/sitemap-pages[.]xml.ts` also lists only those paths, and `src/routes/api/public/sitemap[.]xml.ts` currently indexes only that one child sitemap.
- The committed `public/robots.txt` points crawlers at root `/sitemap.xml`, and `public/sitemap.xml` contains those same six static paths. No locality/service sitemap generator was found in the current route inventory. A dynamic `/robots.txt` handler exists, but live endpoint behaviour could not be independently verified because the public host was inaccessible to the available verifier.
- This means locality/service pages may be canonical and conditionally indexable yet remain undiscoverable through the declared sitemap. Do not solve this with mass-generated thin URLs.

**Next implementation slice:** derive locality sitemap candidates from the canonical place source, reuse the same route canonicalisation and page indexability rules, include only genuinely eligible localities/services, paginate or shard safely, add those child sitemaps to the index, and test that sitemap inclusion agrees with page `robots` metadata. Verify static-vs-server hosting precedence and `robots.txt` against the real deployed host before claiming the fix is live. No public host or indexation success is currently verified.

## Connected-repository inventory — live GitHub read, 2026-10-21

The authenticated GitHub listing exposed multiple similarly named repositories. This is a source-of-truth risk; names alone do not prove which code is deployed or connected to Lovable.

- **`mattleask373-rgb/life-lived-network`** — active primary candidate; public; default branch `main`; observed main SHA `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3`; has the app source, tests, migrations and active PR queue. This is the repository used for the current audit, but the Lovable project/sync target still requires owner verification.
- **`mattleask373-rgb/life-lived-network2`** — non-empty second application-shaped repository (README, package manifest, source, docs, Supabase, lockfile), but its `main` points to initial commit `8c02f1714a88` dated 2026-10-09. Its README contains a lengthy product master prompt. Do not merge, overwrite, or treat as deployed/canonical until compared and confirmed by the owner.
- **`mattleask373-rgb/mattleask373-rgb-life-lived-network`** — empty repository; no source files returned.
- **`mattleask373-rgb/real-world-atlas-agent-orchestration`** — README-only repository (one file, 168 bytes; initial commit 2026-10-09). It is not evidence of a separately deployed scheduler or running agent fleet.
- **`mattleask373-rgb/real-world-atlas-marketing`**, **`real-world-atlas-monetization`**, and **`real-world-atlas-compliance`** — each README-only (one small file; initial commits 2026-10-09). Treat them as placeholders, not completed strategy, revenue or compliance implementations.
- **`mattleask373-rgb/Grok-redesign-app`** and **`World-Finder`** — empty repositories; no source files returned.
- **`mattleask373-rgb/world-s-finder`** — README-only repository (one 16-byte file); not a usable app implementation based on the current listing.

**Required owner action:** confirm the production/Lovable GitHub repository, deployed commit and sync branch in project settings. Until then, continue PR-only in the active app repository, do not sync or migrate between similarly named repositories, and do not claim the sidecar agent/marketing/monetisation/compliance repositories implement working systems.

The canonical invariants remain unchanged: `findSupply()` is the sole possibility/need-discovery authority; no fabricated supply, no publication from unknown rights/review evidence, no public assistant activation, and no merge/deployment/production mutation without the relevant human approval.


## Follow-up integration audit — Grok one-year prompt and SEO sitemap slice

This update follows the 19:33 UTC integration snapshot above. It records new draft candidates created after that snapshot; it does not supersede the need to verify current PR state on the next work cycle.

### New draft PRs and final-head verification

- **[#248 — rolling one-year Grok Dream Team master prompt](https://github.com/mattleask373-rgb/life-lived-network/pull/248):** draft, documentation only. Current document head \`541c8c82c9e8feec9d51e855a5c1058d08dcf654\` passed exact-head Verify via [run #39666859630](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39666859630). The prompt covers a rolling one-year plan with no fixed completion deadline; project-specific engineering invariants; autonomy levels; real 24/7 task-queue/heartbeat/monitoring/kill-switch requirements; governed AI and user support; APIs, SEO, growth, partnerships and monetization; and budget controls. It treats one billion daily users as an aspirational north star, not a forecast. It includes an official-source-checked capability/billing matrix for The X Subscription, Grok Bot, Cursor, web/X search, code execution, Collections, connectors/MCP, Imagine and multi-agent features. It does not configure those services or create an always-on agent by itself.
- **[#252 — fail-closed locality/service sitemap integration](https://github.com/mattleask373-rgb/life-lived-network/pull/252):** draft, current-main based. Exact-head Verify passed on \`5e6db8c403a767c2209a456c975664789ee7d936\` via [run #39666595390](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39666595390). Adds a shared locality/service indexability gate, canonical-data-backed candidate enumeration, bounded numbered sitemap shards, dynamic sitemap index entries and static/generated robots.txt references. It uses the canonical public listing read and fails closed on incomplete scans. No new inventory, schema, RLS/grant, auth, credentials, provider activation, production data or deployment was changed.
- All PRs #241–#245, #248 and #252 are reported as still open draft candidates at the time of this update. Green exact-head CI is not equivalent to independent review, visual/accessibility QA, security sign-off, merge, deployment or live-host verification.

### Remaining gates and overlap guidance

- The public Lovable endpoints \`/robots.txt\`, \`/sitemap.xml\`, \`/api/public/sitemap.xml\` and generated child sitemaps have **not** been live-verified. The source and CI are evidence of intended behavior only. Owner-approved hosting verification is required before claiming SEO has been fixed in production.
- Lovable Project Settings → Git target still needs owner confirmation. Do not issue write-capable Lovable instructions until the connected repository and non-main sync branch are verified. Similar repository names are not proof of the deployed source of truth.
- PR #235 remains an independent authentication-storage security review. Keep it separate from product/SEO/UI work and do not merge around it.
- Compare overlapping open candidates before merging: #242 vs #234 (viewport/map-list); #241 vs #240 (source freshness); #245 vs #233 (Ask-this-place policy); #244 vs earlier work-opportunity/Adzuna chains. Preserve unique review findings and do not merge duplicate implementations.
- Keep public Ask-this-place disabled pending Issue #209. The fail-closed policy helper alone does not authenticate attestations or provide an eligible server-side retrieval source.
- No PR merge or deployment was performed in the work represented by this update. The one-year prompt requires the eventual persistent executor to be separately implemented and tested; this documentation is not proof that a 24/7 runner is alive.

The core invariants remain: \`findSupply()\` is the single discovery authority; user/private memories never become public supply; demo and unreviewed/rights-uncleared content is not published or indexed; and protected release/production actions require the appropriate human authority.


## Current execution order refresh — 22 October 2026, 19:00 UTC

This snapshot supersedes earlier queue/check claims in this file for the PRs below. Re-fetch current main and exact heads on the next run.

- Canonical main remains `a99d09f1517523a7a388245ca6b3d5c1245816cb`; no main merge or direct-main write was performed.
- **#291** is the first combined correctness candidate, head `70831fc20603afa2c88fef4c9c9456f00f8f415c`, based on current main. Successful exact-head Verify run: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39835902770/job/120024176957 (78 test files passed, 1 skipped); CodeQL, TypeScript and locked dependency checks passed at that head. A separate exact-head Verify attempt was cancelled; Supabase Preview skipped. Still draft and no human review submission. Must complete independent review and manual accessibility/mobile/date-line QA before merge.
- **#298** is a new stacked draft for open-needs unknown-vs-zero UX, head `e3c18e5722e77087e191c042c784c1566364f4d0`, based on #291's head. It must not merge before #291; after #291 merges, retarget/rebase to current main and rerun exact-head CI/review. Initial check read showed Supabase Preview skipped only; refresh all other checks.
- **#297** is a draft documentation-only port of the least-privilege proposal, head `2ed1c5bc71a41b5a8e9e71bae16224b0aefe8fd7`, based directly on main. Verify, CodeQL, TypeScript and locked dependency audit passed; Preview skipped. No review submission. #194 is closed as superseded/unmerged. The proposal is not SQL approval; project target identity remains unverified.
- **#294** is the current Year-One plan/status reconciliation, head was `8e18433fbc8cce7202a886642cadad293418dd3f` before this update; this append triggers new checks and changes the final head. Prior exact-head Verify, CodeQL, TypeScript and locked dependency audit passed, but that does not apply to the new content until checks finish. Remains draft/no review.
- **#289** input-validation hardening has prior green checks at `ee7937da4b3600b1fbac0ff637fa657778a710ad`, no human review submission. It does not implement durable per-user/IP rate limiting or cost caps. Keep public AI disabled until separate rate-limit/budget/kill-switch and grounded-retrieval acceptance gates pass.
- Active ruleset #24946178 is enabled, but raw `required_approving_review_count=0`; deletion protection is not established by the returned ruleset. Administrator must require at least one approval and verify deletion protection.
- Published SEO blocker remains: latest direct endpoint evidence found HTML 404 for `/sitemap.xml`, incorrect/incomplete `robots.txt`, and Life List noindex metadata on the observed host; deployed host/build identity is still unconfirmed. Do not claim live SEO fixed from PR tests.
- New required next engineering slice: verify PR #291 after latest head; merge only following effective governance gate, independent review and manual QA; then integrate/rebase #298; review/merge #294 and #297 after fresh exact-head checks; review #289 separately. Next, run #164 least-privilege work only in a confirmed disposable DB, reconcile #100/#116 control-plane migration lineage, and prove a real authenticated durable worker before any 24/7 claim.

### Non-negotiable release gates

No autonomous merge, deployment, live host mutation, hosted DB/schema/RLS/grant change, source/feed activation, paid spend, provider/user outreach, or public AI activation. Owner/admin must first confirm the Lovable Git destination/non-main branch, deployed host/build SHA, Supabase project identity, effective main ruleset approval/deletion controls, and the intended stage/production isolation. Use concurrent agent capacity for read-only research, isolated PR work, deterministic tests and documentation, not to bypass these gates.


## Consolidation correction — 22 October 2026, 19:12 UTC

- #291 remains the single combined correctness candidate. Latest observed head `1f40d6d5337cbc138b71db391e0bc4f20402b148`; exact-head Verify was queued at the 19:10 UTC check read, with Preview skipped and other checks not yet all registered. Formatting issues reported by the prior Verify were corrected on the branch, but this is not yet proof the newest head passes.
- The latest PR #291 includes the exact-count reconciliations for keyset scans (needed because a short response can be caused by a server response cap rather than end-of-data), fail-closed local scope and source eligibility, shared SEO/noindex policy, bounded viewport pagination, plus the unknown-not-zero open-needs status and retry wiring.
- PRs #296, #298, #300, #301 and stale-base #194 are closed unmerged. Their intended changes were either ported to #291 or replaced by current-main #297. Do not list these as merge candidates.
- Merge sequence is now: human/admin Gate 0 → review/merge #294 after fresh checks → review/merge #291 after exact-head checks + manual QA → review-only documentation #297 → separately review #289. PR #297 is not executable ACL remediation; #289 is not rate limiting.
- Still unresolved at Gate 0: raw main ruleset requires zero approving reviews; deletion protection is not proven; Lovable Git target/deployed host/backend project identity remains unverified. Live sitemap and robots failures remain until owner-approved production verification.
- Do not claim 24/7 coding from the three enabled daily audit automations. True unattended development remains blocked on a verified durable executor with task persistence, least-privilege capabilities, leases/fencing, idempotency, cancellation, budgets, monitoring, alerts and a tested kill switch.


## Additional P1 work package — wide-area opportunity completeness (22 Oct 2026)

Code review found that `getMyOpportunities()` in `src/lib/needs.functions.ts` drops its place filter for descendant sets over 400, then scans only the globally newest 60 public/local-discovery needs before handing them to `findOpportunitiesForPerson()`. That evaluator still filters by actual geography, so this is **not evidence of a privacy disclosure**; it can silently omit legitimate matches before evaluation. Add a separately reviewed work package after #291: compare hierarchy-aware RLS-respecting database retrieval with bounded chunk/keyset merge and explicit partial-result semantics; preserve stable order, block/visibility/own-need filters and opted-in journey rules; add 400/401, >400, duplicate, tie, fail/partial read and “relevant match beyond newest 60” tests. Never issue an unbounded full-table read or claim a truncated candidate set is complete. Any RPC/index/migration/RLS change stays human-gated and Supabase Preview is currently skipped.

### Exact-head correction

- Current #291 head as last rechecked: `aff961724e6f4ab5ea62200636a4851b14abd481`. CodeQL and dependency audit passed; Verify and TypeScript analysis were still running; Preview skipped. Re-fetch on next pass—never rely on this snapshot if the head moves.
- #294 current documentation branch head before this update: `8865c93e8f2f9113758242607769952175d6190c`; prior exact-head Verify, CodeQL, TypeScript and locked-dependency audit passed, Preview skipped. This new status entry triggers fresh checks.
- Ruleset #24946178 is active but approval count remains zero; deletion protection still unproven. No production/merge authority was changed.


## Latest status correction — 22 October 2026, 19:17 UTC

- New #302 draft https://github.com/mattleask373-rgb/life-lived-network/pull/302 records the next P1 wide-area opportunity completeness contract. Exact head `a51e738ffd465ba4d7c5481a29bf7c8152822c89`; Verify and TypeScript analysis were in progress, dependency audit passed, Supabase Preview skipped. It is documentation-only and cannot authorize RPC/schema/RLS/grant work.
- #291 current observed head `aff961724e6f4ab5ea62200636a4851b14abd481`, base main `a99d09f...`; Verify/TypeScript were in progress after the last lint correction; locked-dependency audit passed; Preview skipped. Do not call CI green until checks complete on this exact head and CodeQL is refreshed.
- #294 latest head is now `166fd912307f4e3af507db0e15cf9b18dc1cc8c3`; this status/plan append triggers fresh checks. The preceding head passed Verify, CodeQL, TypeScript and dependency audit, Preview skipped.
- Current main stays `a99d09f1517523a7a388245ca6b3d5c1245816cb`. Main ruleset remains active but requires zero approving reviews; deletion protection is unproven. These human/admin controls remain the first gate.
- The wide-area issue is completeness/ranking bias, not a confirmed privacy breach: a global newest-60 candidate query is later geography-filtered by the canonical evaluator but may omit a relevant opportunity before evaluation.
- Do not merge, deploy, alter hosted DB permissions, activate AI/feed/provider integrations, spend, or communicate externally without the existing owner gates. Daily audits are not a persistent 24/7 executor.


## Re-audit checkpoint — 22 October 2026, 19:23 UTC

- Main remains `a99d09f1517523a7a388245ca6b3d5c1245816cb`. GitHub returned 81 open PRs; merge only a narrow, explicitly reviewed queue. Many old control-plane/24-7 proposals are stacked on older or non-main bases.
- #291 current head `415bfff7456ef32540f5f04b3b49578f6ec20e65`: Verify, CodeQL, TypeScript analysis and dependency audit pass; Supabase Preview skipped. Still draft and no independent review recorded. Manual mobile/accessibility/date-line QA remains outstanding.
- #294 current head `53f304e32ed7dff30444b55967d3a55ab1b52da1`: Verify, CodeQL, TypeScript and dependency audit passed; Preview skipped; draft/no review. This appended snapshot changes its head and requires fresh checks.
- #297 current head `2ed1c5bc71a41b5a8e9e71bae16224b0aefe8fd7`: green Verify/CodeQL/TypeScript/dependency audit, Preview skipped; documentation only, no review.
- #302 current head `a51e738ffd465ba4d7c5481a29bf7c8152822c89`: latest success for Verify/CodeQL/TypeScript/dependency audit; a second Verify was cancelled; Preview skipped; documentation only, no review.
- #299 current head `f5ac2728edf52743319b95434e4b484f69fdb715`: green Verify/CodeQL/TypeScript/dependency audit recorded, another Verify cancelled, Preview skipped. Adds 13 SQL migrations / 15 files, including SECURITY DEFINER RPCs, RLS/policies, role grants/revokes and DROP FUNCTION overloads. Static tests do not prove SQL replay/remote-history compatibility. Block merge pending independent security review and exact replay on an explicitly named disposable DB; no hosted DB changes.
- #289 request-input validation head `ee7937da4b3600b1fbac0ff637fa657778a710ad` passed checks; still requires independent review. It is not rate/cost limiting or public AI authorization.
- #270 hourly scheduled repository-doc probe is stale-base and read-only. It does not dispatch work, call a model or prove a persistent executor.
- Fresh public reads: robots.txt HTTP 200 but wildcard/crawler rules only allow all and no Sitemap directive; /sitemap.xml is HTML 404; /life-list is HTTP 200 and presents “Only you see this” but extraction did not surface robots/canonical fields. This flags an SEO signalling mismatch, not evidence of another user's saved data exposure. Connected Lovable project/deployed host/build SHA remains human-unverified.
- Ruleset #24946178 active, but required review count 0 and deletion protection not established. Owner/admin Gate 0 still blocks merging/production release.
- Existing “Living World Fleet Control” is daily read-only oversight; #270 is a draft repo probe. Neither constitutes 24/7 coding. Need durable queue/provider execution, authenticated identity, persistent heartbeats/leases, fencing/idempotency/recovery, budgets, cancellation, monitoring/alerts and kill switch proved in non-production first.


## Automation inventory correction — 22 October 2026, 19:28 UTC

Current automation inventory shows three enabled daily tasks: Living World Fleet Control (read-only), Daily Security & Release Audit (read-only), and Year-One Safe Build Loop (write-blocked pending authoritative Lovable repo/non-main branch proof and owner authorization). Each is configured daily at approximately 08:00 Europe/Amsterdam beginning 23 Oct; latest run times were around 19:22–19:23 UTC. The API reports `next_run_time: null` for all three, so next dispatch is not independently confirmed.

Draft PR #270 is only an hourly read-only documentation probe, not an executor. No persistent coding runtime has been proven. No extra automation was created. Human owner must reconcile the automation's write-gate prompt with the explicit PR-only workflow before enabling agents to push further implementation; Lovable direct sync to main remains prohibited until Settings are verified.
