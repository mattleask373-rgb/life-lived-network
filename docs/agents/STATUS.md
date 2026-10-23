# Agent System Status — 2026-10-23 (live coordination snapshot)

## Authoritative snapshot — verified against GitHub on 23 October 2026

- **Canonical app source for this audit:** `mattleask373-rgb/life-lived-network`, default branch `main` at `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`. The owner has not yet confirmed the app's actual Lovable Git sync repository/branch and deployed build SHA, so source authority and production deployment authority remain separate.
- **PR queue:** 86 open PRs at this refresh. Eleven are based on the exact current `main` SHA: #335, #336, #338, #339, #340, #341, #343, #344, #345, #346, #347. The other 75 use stale bases or stacked branches; do not bulk-merge them. The active main ruleset `24946178` requires one approving review, latest-push approval, resolved review threads, strict status checks and the exact `verify` check; no bypass actors are configured. The branch-protection endpoint separately returned 403, so this is the live ruleset evidence, not a complete admin-settings audit.
- **#335 — sitemap completeness / SEO smoke configuration:** exact-head Verify and CodeQL/dependency audit passed. The branch adds fail-closed source-count/eligibility checks, includes approved work-opportunity categories in service sitemap coverage, and passes optional `SEO_SMOKE_ORIGIN` from a repository variable into the scheduled live smoke. Static robots/sitemap assets and build origin must match the owner-confirmed canonical host. It does not repair a stale deployed build on its own.
- **#340 — AI draft quota concurrency test:** exact-head Verify and CodeQL/dependency audit passed. Verify replayed the complete migration chain against an empty local Supabase database and ran 25 concurrent authenticated quota calls across independent transactions (5 allowed, 15 hourly denials, 5 daily denials), then cleaned the synthetic account. Hosted rollout, per-IP controls, provider hard-spend caps/alerts and an HTTP-level 429 contract remain outstanding.
- **#341 — Life List account-write integrity:** exact-head Verify, CodeQL and locked-dependency audit passed. Signed-in save/delete writes are awaited, mutation races are serialized, account changes are fenced, guest data remains until account merge/read succeeds, and failure is surfaced instead of pretending the UI save succeeded. Independent code review and normal protected merge remain.
- **#343 — email magic-link authentication:** exact-head Verify/CodeQL/dependency audit passed. `signInWithOtp` uses `shouldCreateUser: false`; password login, signup, Google OAuth and recovery remain. Owner must verify provider delivery, site URL and allowed redirect URLs before release.
- **#344 — agent dispatch retry/idempotency:** exact-head Verify replayed all migrations against an empty local Supabase DB, ran SQL security tests and DB lint; CodeQL passed. The additive migration supplies the missing attempt UUID default and validates correlation/task/run/workspace/project/provider binding before replaying an active lease. Independent database/security review remains; this is not a running worker.
- **#336 — bounded worker core:** exact-head Verify/CodeQL/dependency audit passed after a safety fix rejects leases that cannot survive the first heartbeat interval plus a 1-second margin. It remains an opt-in, provider-neutral execution core. A canonical adapter, durable scheduled executor, production-grade heartbeat/lease recovery, operator dashboard/alerts and isolated staging acceptance proof do not yet exist.
- **#338 — rolling year plan:** exact-head Verify/CodeQL/dependency audit passed. Programme phases advance by dependency/evidence gates with no calendar deadlines or time-triggered releases.
- **#339 — independent audit/merge queue:** current-main-based evidence report, including portfolio-level repository inventory and merge dependencies. Exact-head Verify, CodeQL and dependency audit passed on the last confirmed head; re-run if changed.
- **#346 — initial four-locale discovery foundation:** Verify, CodeQL and dependency audit passed. Adds en-GB, pt-PT, es-ES and ja-JP dictionaries, language selector, localized main/mobile nav, layer filter and card formatting. EntrySheet detail labels, all form/profile/auth copy, translated SEO routes/metadata, hreflang and country-specific rules remain out of scope. Treat as partial localization only.
- **#347 — privacy-safe funnel contract:** current-main-based contract/documentation PR adds Need lifecycle events and coarse country/intent dimensions; removes an unused duplicate schema after confirming no callers beyond its own tests. It does not instrument or persist events, so no product analytics/retention funnel is live. CI is pending; privacy/suppression/consent/retention and sink review remain separate gates.
- **#345 — Need lifecycle/freshness:** latest exact-head Verify and CodeQL passed, including full empty local DB migration replay, SQL authorization tests and DB function lint. It remains draft because `local_discovery` scope is enforced by server query filters but the existing anonymous RLS policy permits direct table reads of `local_discovery` rows. Do not call that a privacy boundary without an independent policy/RPC decision. The stale #330 has been closed as superseded by #345.
- **Closed duplicates:** #235 (older preview auth helper regressed `event.source === parentWindow` checks); #326 (Life List work was ported to #341); #327 (magic-link work was ported to #343); #330 (need lifecycle ported to #345); #337 (work-opportunity sitemap parity ported to #335); #342 (duplicate Life List PR). These were closed unmerged; unique fixes/tests were ported where appropriate.
- **Merged prior work:** #291, #294, #297 (documentation only), #289, #302, #304, #305, #299 and other earlier merges must be verified by live records before relying on them. In particular, #305's kill switch is present on main but is not the same as spend controls; #299 migration merge does not prove hosted migration application.
- **Published-site P0 blocker:** [Public SEO Smoke #39948523188](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39948523188) found 19 failures against `https://life-lived-network.lovable.app`: `/sitemap.xml` returned 404 HTML, robots lacked the expected sitemap/private-route directives, `/life-list` lacked visible noindex metadata, and homepage canonical/indexability checks failed. Current source contains routes/assets, so treat this as source/build/hosting divergence. Do not weaken the smoke assertions or claim that merging fixes live SEO.
- **AI quotas / spend:** current main includes emergency stop, durable per-account quota (5 attempts per UTC hour / 20 per UTC day), private aggregate counters and a server-side quota call before provider import. #340 adds local concurrent evidence. Still missing are owner-confirmed hosted/disposable rollout, per-network/account-abuse strategy, provider-side hard budget caps and alert delivery, documented disable propagation, and an HTTP 429 contract if product acceptance requires it. Issue [#290](https://github.com/mattleask373-rgb/life-lived-network/issues/290) remains open.
- **AI operating model:** #344 improves durable dispatch idempotency; #336 is a pure worker-cycle core. These do not yet constitute continuous 24/7 autonomous operation. Scheduled Automations report a daily review cadence, not an always-on worker fleet.
- **Connected repository portfolio:** the sibling `life-lived-network2` is a stale parallel snapshot; other marketing, monetization, compliance, World-Finder and redesign repositories are empty placeholders; `real-world-atlas-agent-orchestration` currently contains only README on main and a documentation-only draft PR without CI. See [independent audit](../programme/INDEPENDENT-REPOSITORY-AUDIT-2026-10-23.md) before distributing code across repositories.

### Dependency-ordered next tasks (no calendar deadlines)

1. Independently review #335, #341, #340, #344, #338 and #339, resolve all threads, then merge through the required protected process. Review #346 as partial localization and #347 as a contract-only measurement proposal after their exact-head CI is green. #335 fixes source correctness but must be paired with an owner-authorized live host/build verification.
2. Review #344's SQL function signatures, role grants, uniqueness/idempotency and lock ordering; merge only after approval and full migration replay evidence.
3. Review #336 as a disabled worker core; then separately design/implement a trusted adapter and durable scheduled executor with dispatch idempotency, heartbeat, cancellation, stale recovery, pause/resume and alerting.
4. Keep #345 draft until the direct anonymous RLS behavior of `local_discovery` is explicitly resolved or formally scoped as a discovery/presentation level rather than a privacy control. Re-run complete DB tests after the decision.
5. Close remaining stale-base duplicates only after verifying whether their unique fixes are already on main or have been ported. Rebase all still-needed work and re-run exact-head checks.
6. Owner/admin Gate 0: confirm the canonical Git sync repo/branch, deployed SHA/hostname, Supabase project/environment and rollback owner. Then authorize any external setting change or deployment needed to make the published SEO smoke pass.
7. Prove a lawful, consented pilot supply → request → response → completion loop; capture useful outcomes, repeat use, freshness, support load, abuse, and unit costs before adding more countries/categories.
8. Stage load/soak/failure/restore tests and establish measured capacity envelopes before any million/billion-user readiness claim.

**Hard boundary:** no production deployment, hosted migration, secret/provider setting, paid spend, provider activation, outbound outreach, or externally consequential AI action is authorized by source-only PR work. The gates must be satisfied with observed evidence, not documentation alone.

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


## Live audit delta — 22 October 2026, 21:45 UTC

This section supersedes earlier embedded snapshots for the facts it covers. All observations below are read-only and do not authorize merge, deployment, hosted-data access or launch.

### Canonical repository, queue and protection

- Current observed main: 86283de035db4d8543cd169f4346e27fa26eadb8. Current API inventory returned **81 open PRs**. Treat the full queue as a convergence/ownership problem, not a reason to create another overlapping PR. Several older PRs are clearly stale by their own recorded base SHAs; compare each head/base/check set before integration.
- Active ruleset 24946178 targets the default branch and requires one approving PR review, dismissal of stale approvals, approval of the latest push, review-thread resolution and the verify check. Raw response shows bypass_actors: [] and current_user_can_bypass: never. The ruleset itself has no deletion rule. Classic branch-protection read returned 403 for this integration; therefore deletion protection is **NOT VERIFIED**, not assumed absent or present.
- Main combined commit-status API returned no legacy status objects. This is not a statement that required checks failed or passed; use exact-head Actions check runs.
- Current-tree metadata lists .env.example, not a root .env; the older open report claiming a tracked root .env is a stale snapshot and should be re-checked before use. Do not retrieve or print secrets.

### Exact-head draft PR truth

- **#304 — bounded opportunity retrieval:** head afc2b544b36a96d64f3b51602532f1c49d1d1313; Verify and CodeQL passed. Draft, no submitted independent review, Supabase Preview skipped. The implementation evaluates a bounded candidate set (max 13 × 60 candidates), not every possible need; user-facing results must not be labelled exhaustive. Manual mobile, accessibility and date-line QA remains.
- **#305 — draft-assist stop:** head 0af4d814c827970d567d16a0afdb5930d978d5f8; Verify and CodeQL passed. Draft, unreviewed. Its DRAFT_ASSIST_DISABLED switch is feature-specific; durable quotas, concurrent/replay protection, provider-side budgets/alerts and distributed immediate kill-switch evidence remain open. Public Ask-this-place remains disabled.
- **#306 — this status documentation PR:** head 2bbd9fbda161d94c02d6c18463556d119c7b126f; recorded Verify and CodeQL passed before this appended delta. Re-run checks after this commit. Draft, unreviewed.
- **#307 — sitemap eligibility parity:** head e7d9a0177c8f062343672fcfc78cb82a57a8cbd4; Verify passed including lint/tests/build and non-traffic k6 parsing; CodeQL/TypeScript analysis and locked dependency audit passed. Draft, no submitted reviews. Not deployed; live-host checks remain red.
- **#308 — Life List failure handling:** head 0081e6b7f5ff8c0b21e09d93f291d8777c5784e6; Verify passed including lint/tests/build and non-traffic k6 parsing; CodeQL/TypeScript analysis and locked dependency audit passed. Draft, no submitted reviews. This is not proof of actual RLS isolation. Signed-in toggle/category writes are still fire-and-forget; persistence failure and optimistic-state recovery should be handled in a separate scoped, regression-tested follow-up before claiming full save durability.
- **#299 — control-plane migration lineage:** head f5ac2728edf52743319b95434e4b484f69fdb715; historical recorded Verify/CodeQL are green, but base SHA a99d09f1517523a7a388245ca6b3d5c1245816cb is stale, GitHub reports non-mergeable, there is no independent review, and Supabase Preview is skipped. Keep separate until the owner confirms the actual Supabase target and migration history; do not apply or reconcile remote migration history in automation.

### Current published-host evidence and divergence

Fresh GET-only checks from 22 October 2026:
- https://life-lived-network.lovable.app/robots.txt returns HTTP 200 and allows all crawlers, but its response lacks the Sitemap: directive present in canonical public/robots.txt.
- https://life-lived-network.lovable.app/sitemap.xml returns HTTP 404 HTML, while current main contains the sitemap index file and server route. The host artifact/source/route mapping is not authoritatively linked; do not assume that merging code alone will change the live host.
- /life-list returns HTTP 200 and generic Life List content. The fetched document did not expose a visible canonical or noindex directive, while current source calls privatePage(). This is a published-output metadata discrepancy and an indexing/privacy hygiene concern—not proof of saved-item exposure or an RLS failure.
- /api/public/sitemap.xml, pages/localities/services feeds and tested service shards also need fresh host checks after the intended build is confirmed.

### Growth, global rollout and human-connection outcomes

- No reliable product-analytics source was retrieved for DAU/WAU, acquisition channel performance, activation, conversion, retention, CAC/LTV, request/response outcomes or offline connection energy. Treat scale values copied from prompts as targets/context only, not telemetry.
- Instrument only privacy-minimal, consented events at each funnel boundary: qualified landing/search impression → intent submitted → canonical eligible supply shown → voluntary request → reply → confirmed outcome. Log unknown/error separately from verified zero, and measure latency, abandonment, eligible-supply coverage and complaint/abuse rates.
- Treat HCR-7 (optional self-report of a real-world interaction facilitated within seven days) as an **unvalidated candidate metric**. Publish denominators, response rates, missingness and opt-in bias; measure reciprocity/continuity and harms separately. Never infer loneliness or vulnerability from scrolling, scrape contacts/messages, or use background location to manipulate engagement.
- The current repository tree contains no ios/, android/ or Capacitor native-project paths. Native build/signing, store listing, privacy disclosures/manifests, account-deletion flow, moderation/report/block controls, release tracks and device QA are therefore not evidenced by this source tree. Google Play's official target-API page states Android 16/API 36 for new apps and updates from 31 August 2026 (with an extension process); verify the current Play Console exception/status for the actual submission. Apple requires appropriate privacy disclosures and account deletion when account creation is supported, and UGC products need robust safety/moderation mechanisms.
- Global market expansion must be supply-led: prove source license/attribution, freshness/withdrawal, local-language taxonomy, correct currency minor units/time zones/DST, verified local coverage, local stewardship, complaint escalation, accessibility and request-to-confirmed-outcome before indexing and growth spend. Avoid doorway pages, fabricated supply and global-live claims.

### Next dependency-ordered actions

1. Maintainer and independent reviewer: inspect and review #307 and #308 fresh combined diffs, including the shared imported-listing lifecycle resolver and the still fire-and-forget signed-in Life List mutations. Keep draft until accepted; no auto-merge.
2. Authorized owner/security: confirm canonical Lovable project/repository/sync branch and deployed build SHA, intended Supabase project/environment, deletion protection and bypass actor evidence; then arrange two-user-plus-anon disposable RLS tests and a separately approved disposable migration replay.
3. Maintainer: re-run #306 exact-head checks; review #304's bounded-not-exhaustive retrieval semantics and #305's narrow kill-switch scope; do not treat skipped Supabase Preview as success.
4. Site owner: repair the host/build/route mapping so sitemap and robots output match source; verify actual live sitemap index and shards, canonical/noindex for private routes, structured-data eligibility and supply-backed pages after controlled deployment.
5. Product/growth owner: approve a privacy-preserving, consent-first measurement protocol and one locally stewarded pilot with verified supply and demand; do not start public-AI traffic, market acquisition spend or mass-market launch until all P0 evidence gates and the relevant human release authorization are closed.

**Status:** source/CI evidence is improving; published-host, database, rights, pilot outcome, native release, durable worker and public-AI launch evidence remain open. No production mutations, merges or deployments are implied by this status section.
