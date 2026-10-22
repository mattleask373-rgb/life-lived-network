# Agent System Status — 2026-10-21 (Grok redesign integration / global integration phase)

## Canonical baseline

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

## Canonical integration checkpoint — 2026-10-22

**This is the latest verified checkpoint and supersedes all earlier candidate-status, repository-SHA, queue-count and release-gate snapshots above.** Historical entries are retained for audit context only. Always re-read the live PR head and exact-head checks before acting. The repository default branch `main` was independently compared to `1cf9b21b6fae9fef2b504b2993d37d2f99766d6d` and is identical at this checkpoint. This status refresh is a documentation-only review candidate; it does not merge or publish any product code.

### Connected Lovable project and canonical source of truth

- Main code repository: `mattleask373-rgb/life-lived-network`, public, default branch `main`.
- Connected Lovable project: `Real World Atlas`, ID `b3293d2a-3218-4206-ab04-af8e984023ac`, reports published; its exact production URL is not returned by the connector.
- Latest Lovable working commit observed: `44ce3286112220273db1ead1add860893ea6eed6`. Comparison to main shows merge base `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3`, 16 commits unique to Lovable and 161 commits behind main. This is a divergent working lineage, not a safe sync target.
- A user prompt explicitly requested a read-only audit / plan-only turn; the subsequent Lovable change committed an update to `.lovable/plan.md`. Combined with the earlier generated-Supabase-types write recorded by #133, plan/read-only prompts are not a technical guarantee against project-file writes. The latest plan-file change is not on main and is not evidence of a production deployment.
- **HUMAN GATE:** verify Git repository, non-main sync branch, connected Supabase project reference and production hostname in the Lovable owner dashboard. Until verified, do not use write-capable Lovable turns, sync branches, reset history or merge between similarly named repositories.

### Fixture guard issue reconciliation

Issue #130 was closed as completed on 22 October 2026 after verifying the production fixture guard and regression test on current `main`; the closure explicitly does not claim production deployment verification. See [issue #130 closure evidence](https://github.com/mattleask373-rgb/life-lived-network/issues/130#issuecomment-6328959614). The earlier historical line saying #130 remains open is retained only as an old snapshot and is superseded by this dated update.

### Live database readiness — read-only aggregate/catalog queries

The connected Lovable Supabase database reports:

- `places`: 221; `listings`: 0; `profiles`: 0; `source_records`: 0; `sources`: 2.
- Both configured sources have no recorded `last_run_at`; one is `ready` + enabled and one is `requires_credentials` + disabled.
- Therefore the product currently has a canonical geographic foundation but no recorded real marketplace inventory, and no locality can yet be called a proven, active market. Do not imply source-backed opportunity coverage from fixtures or source configuration alone.
- No user or private listing rows were queried; these are aggregate counts only. No database writes were performed.

### Security P0 — effective grants remain unproven

Fresh catalog-only reads against the linked Lovable database found:

- 22/22 public tables have RLS enabled; 0/22 have FORCE RLS. All are owned by `postgres` in this snapshot.
- Table grants include INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER for `anon` on 21/22 tables and `authenticated` on 22/22; SELECT was reported for 19 anon and 20 authenticated tables.
- Default ACLs for `postgres` and `supabase_admin` include broad table privileges for client roles; default sequence and function privileges are broad too. RLS row policies may still deny ordinary row access, so these metadata results are not standalone proof of a reachable breach. RLS policies do not restrict TRUNCATE.
- Public routine metadata showed `touch_updated_at()`, `update_updated_at_column()`, `has_role(uuid, app_role)`, and `is_safety_reviewer(uuid)`; none was marked SECURITY DEFINER in the current query.
- The actual Supabase project identity has **not** been reconciled with repository `supabase/config.toml`. No hosted permissions or policies were changed.

**Security disposition:** #164 remains P0. Draft PR #194 contains a refreshed docs-only least-privilege proposal, including the current metadata counts and routine inventory. Its exact head `cde99f26c87c7eb789b96fe57d6c532c58178c08` passed Verify [#39692978104](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39692978104) and CodeQL [#39692978246](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39692978246). These checks validate the proposal code/document, not the hosted permissions. Before any migration: confirm DB identity, complete table/column/routine/view access matrix, test anon/authenticated roles in a disposable DB/PostgREST environment, test future default ACLs and rollback, obtain independent review and explicit owner approval.

### Current integration candidates — exact-head evidence observed

These are review candidates, not deployed features. Check their latest metadata again before acting.

- **#271 — canonical route policy and private Life List:** head `fc264cc1791884a90fd09951533b1fbdbd427e2d`; Verify and CodeQL passed. Draft; independent privacy/SEO review and live host checks remain.
- **#272 — fail-closed selected-locality scope + antimeridian map behavior:** head `ff9ffac2e91a377cf8313d1698bbefcbfb1cb234`; Verify and CodeQL passed. Draft; manual mobile/desktop, keyboard and map/date-line QA remain.
- **#274 — source lifecycle in canonical public discovery:** head `9b8aad5b0c400b2da67c681c64cd9575f785b647`; Verify and CodeQL passed. Draft; it does not by itself establish sitemap eligibility parity.
- **#275 — reviewed WorkOpportunity to locality/Need flow:** head `e1de845fae91d46d01661dbb3f48e21ab034df21`; Verify and CodeQL passed. Draft; no external provider contact, autonomous save or real inventory is implied.
- **#276 — complete locality sitemap source pagination:** head `abfdfc408fea82227fac453aa55ac077526b27ac`; Verify and CodeQL passed. Draft; depends on privacy/source eligibility being consistent with rendered pages.
- **#277 — interim sitemap source-proof guard, stacked on #276:** head `6af0d59b1cf3831a7c4096ce662c4896069986f6`; Verify passed [#39688821918](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39688821918). CodeQL was not observed on this stacked head. Draft; it conservatively excludes imported rows from qualifying sitemap paths until source lifecycle proof is available, and may under-index some eligible imported pages. It does not close #255.
- **#280 — profile relationship correctness:** head `7e78bc220bf98fba2a0255612761ef2cf92d1548`; Verify [#39692812605](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39692812605) and CodeQL [#39692812191](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39692812191) passed. Draft; UI separately preserves `serves`, `available_in`, and `travelling_through`; server input validates and avoids delete-first replacement. Live schema has no unique `(user_id, place_id)` key, so concurrent multi-tab replacements are not atomic and may duplicate rows; any unique-constraint/transaction fix requires a separate reviewed migration. No matcher, hosted schema/row, RLS or deployment changed.
- **#281 — available_in vs service-area matching semantics:** open product/engineering decision. Current `needs.functions.ts` includes both `serves` and `available_in` in canonical `serviceAreaPlaceIds`, while UI defines `available_in` as “I'm around here.” Resolve with an approved relation × intent matrix and regression tests before starting the services pilot. Do not silently change `findSupply()` or introduce a second matcher.
- **#282 — privacy-minimised outcome measurement contract:** head `cd9e556d3dc42af7e4db317052b0665078a2f40a`; Verify [#39693813175](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39693813175) and CodeQL [#39693813167](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39693813167) passed. Draft only. Defines day-bucketed coarse metrics and rejects raw queries, user/session/target/connection IDs, contact details, messages, URLs and coordinates. It does **not** instrument or persist production events; a lawful purpose, privacy notice, sink, access/retention policy and separate schema/RLS review are prerequisites.
- **#194 — least-privilege proposal:** docs-only, both Verify and CodeQL passed, still draft pending human review and disposable DB proof.
- **#263 — this execution board** remains the durable release gate register. The latest verified status and blocker comments are in the GitHub issue, but the live Lovable target and production host remain owner-gated.

### Growth evidence and external-site research

- Lovable analytics for 2026-09-22–2026-10-21 report 845 visitors / 852 pageviews, with 99% reported bounce, aggregate session duration 0, and page counts dominated by sitemap endpoints. Treat this as an unvalidated traffic baseline; it may include bots/technical requests, and this aggregate report cannot prove which visits were humans. North star is a verified useful outcome, not raw traffic.
- Official ICO sources checked: data minimisation and privacy by design/default (https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/ and https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default). The measurement spine #30 now records the need for coarse events, retention/access controls and no invasive tracking. Official direct-marketing guidance was updated 28 April 2026 (https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/direct-marketing-guidance/); no autonomous provider/customer outreach is authorized.
- Ticketmaster’s official Discovery API and API terms were reviewed (https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/ and https://developer.ticketmaster.com/support/terms-of-use/). The provider remains disabled pending key/terms approval; respect quotas, attribution, event changes/removals and the 24-hour removal requirement on owner request. Event listings are not ticket availability.
- Adzuna’s official API terms and search docs were reviewed (https://developer.adzuna.com/docs/terms_of_service and https://developer.adzuna.com/docs/search). Before live publication, confirm the appropriate licence/request limits, required “Jobs by Adzuna” attribution, and never present predicted salary as employer-stated pay.
- GOV.UK’s current England short-term-let guide states the national registration scheme is not yet in force and is expected to begin in 2026; local planning authority rules can apply (https://www.gov.uk/guidance/letting-out-a-self-catering-holiday-home-in-england-rules-and-regulations). London has a separate 90-night framework (https://www.gov.uk/guidance/when-is-permission-required). This is a market-risk screen only, not legal advice or proof that a host is compliant.

### Current release sequence

1. Owner confirms Lovable sync repository/branch, actual backend identity, production hostname and GitHub ruleset state; do not enable Lovable write-mode before the sync target is verified.
2. Independent reviewers compare the current SEO/map/source/work candidates as dependency families; do not merge competing implementations in parallel. Perform manual privacy/accessibility/browser checks separately from CI.
3. Complete #164's disposable-DB security evidence and approve any future SQL separately.
4. Decide #281 semantics; validate the service profile and one end-to-end real-data journey. No real listing/profile/source records exist in the linked product DB today.
5. Implement a reviewed measurement sink only after the privacy contract is approved; #282 alone does not count real-world outcomes.
6. Activate Ticketmaster/Adzuna only after credentials, current terms/licence, source lifecycle, attribution, rights removal, publication review and verified market demand are approved.
7. Verify live `robots.txt`, sitemap index/children, canonical metadata and actual deployed SHA against the owner-confirmed host after a separately authorized release.

### New first-party service-offer candidate — PR #284

- **#284 — explicit first-party service-offer flow:** draft PR https://github.com/mattleask373-rgb/life-lived-network/pull/284, branch `agent/chatgpt/first-party-service-offer-flow-2026-10-22`. Adds explicit shared-taxonomy selection, self-declared provider details, typical price/free declaration, locality currency, an “by arrangement / timing not confirmed” state, safe external booking-link validation, and tests preventing commercial service offers from entering personal activity/journey planning.
- It uses existing listing columns and RLS only; no schema/permission/provider/deployment changes. It does not verify provider credentials, booking availability, service areas outside the selected listing locality, or customer demand. `findSupply()` remains the single match authority.
- The last queue snapshot before opening #284 showed 92 open PRs (53 drafts, 39 non-drafts, 29 reported non-mergeable); opening #284 implies 93 unless another PR changed state. Re-fetch the current list before any triage decisions.
- **Validation gate:** PR #284 remains draft until Verify (lint/test/build) and CodeQL are observed green on the latest exact head. A failed test run was seen on a prior head while the service/profile/journey changes were being refined; do not rely on any earlier run after a subsequent commit. Manual signed-in mobile/desktop and accessibility QA remains required.
- **Pilot gates remain:** #281 owner-approved semantics for `available_in` vs `serves`, #164 disposable-DB role testing and reviewed least-privilege plan, confirmed Lovable repository/non-main sync target + backend + production hostname, and real opt-in service supply. The linked database still has zero listings, profiles and source records.

### Portfolio and limitations

After closing proven duplicates #273, #197 and #199 unmerged, the latest PR list returned **92 open PRs** in the main repository: 53 drafts, 39 non-drafts, 29 reported non-mergeable. The orchestration repository has one extra open draft. This is a triage queue, not proof every stale PR is obsolete. PR #273 was closed unmerged after a file-by-file comparison with #271: its Life List privacy behavior is covered by the shared route-policy registry and live SEO smoke, and the Life List route itself was byte-identical. #197/#199 were closed unmerged after confirming #244's adapter is already merged, their model files were older than current-main semantics, and #275 is the newer main-based surface port; the only unconsumed date-coverage helper is retained as a follow-up question on #184. Compare unique diffs, preserve unique fixes, then close or supersede with links; do not bulk-close by age or mergeability.

No production writes, hosted permissions changes, provider activations, source ingestion, autonomous merge, or deployment was performed. The available workspace did not expose a connected `@Sites`/Firecrawl connector; official public websites were researched via the available web interface, not through a connected site automation. Public production endpoints were not independently reachable through the available verifier, so live SEO/deployment behavior remains **unverified**.

### Non-negotiable invariants

- `findSupply()` is the sole possibility/Need matching authority.
- Residence is not service area; capability is not willingness; capability is not availability; a journey is not live location.
- Unknown remains unknown; no fabricated providers, events, jobs, inventory or outcomes.
- Draft/CI-green does not mean independently reviewed, merged, published or deployed.
- No hosted security changes, provider activation, AI assistant enablement, external outreach, or production deployment without the applicable human approvals.



## Latest autonomous verification checkpoint — 2026-10-22

**This is the newest checkpoint and supersedes older statements about current main, PR queue size, k6 state, and live-host verification above. Older snapshots remain history, not current truth.**

### Canonical repository and queue
- Current inspected repository: `mattleask373-rgb/life-lived-network`.
- Current `main` observed at `d02459a384cb8ffcc6201839d45645e178ef0b2b`; latest merged change is PR #284, the explicit first-party service-offer flow. Its merge does not establish that any live supply or market demand exists.
- Live GitHub pull request query returned **89 open PRs**. The queue remains well above the plan's maximum of ten; avoid opening more parallel branches and reconcile existing overlap families before broadening work.
- Similar application-shaped/placeholder repositories still exist. The repo shown above is an active source candidate, but the exact Lovable sync target, production project identity and deployed build SHA are not independently established. Do not bulk-sync divergent `Loveable/work/safely` history.

### CI blocker and focused repair
- At `d02459a384cb8ffcc6201839d45645e178ef0b2b`, the Verify run [#39698450412](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39698450412) passed dependency installation, lint, tests, build and k6 setup; it failed at **Parse k6 script without sending traffic**.
- Existing draft PR [#285](https://github.com/mattleask373-rgb/life-lived-network/pull/285) has been updated as a focused two-file fix on current `main`, new head `f7a7bcaa5012a78155a8f4bd5b41295335218ce1`. It moves load-test target validation inside the VU function and runs `k6 inspect` without synthetic target flags. The run cannot send traffic; actual test execution still validates the target before the first request.
- Exact-head [Verify passes](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39711933886); [CodeQL and locked-dependency audit pass](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39711933943). Supabase Preview was **skipped**, not passed as a database-environment proof. PR #285 remains draft, unmerged and undeployed. The fix is not yet in `main`.
- PR #286 also contains a k6 fix but bundles a Supabase migration and connection-state changes. Its own Verify/CodeQL passed, but Supabase Preview was skipped and the migration was not exercised against hosted Postgres. Keep the schema/connection component behind separate independent security review; the focused #285 fix intentionally excludes it.

### Fresh live SEO endpoint evidence
A fresh read-only scrape of the currently named Lovable origin, `https://life-lived-network.lovable.app`, returned:
- `GET /robots.txt` → **HTTP 200**, `text/plain`. The actual response says `Allow: /` for Googlebot, Bingbot, Twitterbot, Facebook's crawler and `User-agent: *`; it contains **no private-path Disallow directives and no Sitemap directive**.
- `GET /sitemap.xml` → **HTTP 404**, `text/html`, application 404 page rather than sitemap XML.
- `/api/public/sitemap.xml` and child sitemap endpoints were not verified in this checkpoint.
These are observations of that URL, not proof that this is the owner-confirmed production origin. They nevertheless show that the public origin currently checked is not serving the intended robots and sitemap behavior. Treat this as a launch blocker. A robots file is crawler guidance, not access control; private routes still require real authorization and noindex policy.

### Current product and trust constraints
- A recent read-only aggregate note recorded 221 places, zero listings, zero profiles and zero source records; two source configurations had no recorded runs. Reconfirm before reuse. Do not call any locality live or imply real inventory based on fixtures/source configuration.
- RLS/default ACL finding #164 remains P0: table and default privilege metadata need an access matrix and disposable two-user/anonymous tests before any hosted change. No permission/schema/security change was applied by this checkpoint.
- Keep public “Ask this place” disabled until server-side canonical retrieval via `findSupply()`, eligibility proof, citations/freshness, prompt-injection handling, isolation, rate/cost controls, observability and independent release review are demonstrated.
- No capacity claim is evidenced by the k6 parser verification; no real staging load smoke ran, because no isolated approved staging host/backend was verified.
- No human approval was bypassed: no merge, deployment, production write, provider activation, hosted database mutation or Lovable project-setting change occurred.

### Next bounded actions
1. Re-run exact-head checks whenever #285 changes; independent reviewer and required branch review remain necessary before merge.
2. Confirm the true published host, Lovable repository/non-main sync branch and backend identity; only then authorize deployment or host-level diagnosis.
3. After an approved publish/hosting fix, re-check robots, sitemap index and every child sitemap with a normal HTTP GET; compare page metadata/indexability to sitemap inclusion.
4. Prioritise the dependency-aware PR triage and security/accessibility evidence; do not reduce 89 PRs by bulk closure or parallel merges.


## Additional live-host probe — 2026-10-22

A later read-only probe also checked the API sitemap index:
- `https://life-lived-network.lovable.app/api/public/sitemap.xml` returned **HTTP 404** with `text/html` and the app's 404 page, not XML.
- Together with the root sitemap 404 and allow-all robots response recorded above, the checked published origin is not exposing the intended current sitemap stack.
- Current-main source contains `public/robots.txt` with disallows and a Sitemap directive, `public/sitemap.xml` indexing pages/locality/eight service shards, and dynamic/API sitemap handlers. The discrepancy is consistent with a stale or different published source/build, but the exact deployed commit cannot be inferred from the HTTP response alone.
- Existing PR #271's latest focused head is `8b0e12643275917e8f5ba10b14f730054fec9b74`, based on the #285 k6-fix branch. It adds a shared route registry and makes the personal Life List noindex/private; exact-head Verify is running after a formatting-only repair. This does not resolve the deployed-origin mismatch.
- The currently checked child sitemap routes have not yet been verified. Do not claim the route stack is live, correct or indexed until the owner-confirmed production deployment is checked.


## Lovable lineage, analytics and final checks — 2026-10-22

### Read-only Lovable project identity
- Lovable project `Real World Atlas`, ID `b3293d2a-3218-4206-ab04-af8e984023ac`, reports `is_published=true`, `creation_status=completed`, latest working commit `44ce3286112220273db1ead1add860893ea6eed6`, last edited `2026-10-21T23:04:05Z`. The connector does not expose the deployed SHA or confirm its public origin.
- Its project branch compared against GitHub main `d02459a384cb8ffcc6201839d45645e178ef0b2b` is **diverged**: 270 commits on the main side that are absent from the Lovable branch, and 16 commits on the Lovable branch absent from main; merge base `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3`. This is not a safe direct sync/publish.
- Read-only files at the Lovable commit show `public/sitemap.xml` is an old six-URL urlset containing `/life-list`, while current GitHub main has the newer sitemap index / locality / eight-shard architecture. Its tracked `public/robots.txt` has some private rules but no `/life-list` disallow. The public origin's actual responses are still worse/different: all-crawler allow-all, root sitemap 404, API index 404, and fixed-pages sitemap 404. No Lovable project writes or deployment were attempted.

### Analytics quality caveat — aggregate only
- Lovable's legacy analytics endpoint for 2026-09-22 through 2026-10-22 reports 897 visitors, 904 pageviews, 1.01 pageviews/visit, session duration 0, and bounce rate 99%.
- Top paths are crawler/sitemap-heavy: `/sitemap.xml` 512, `/api/public/sitemap.xml` 273, homepage 73, `/api/public/sitemap-pages.xml` 19, `/life-list` 4. Source summary: Direct 841, Google 50, Bing 6.
- These numbers are **not DAU, not verified human activity, and not outcomes**. The path mix and zero duration make bot/technical traffic contamination plausible. Do not use them to claim product-market fit. A consent-/privacy-reviewed outcome instrument and genuine attended/met/contributed confirmations are still absent/unproven.

### Security metadata re-check
- Catalog-only SQL against the Lovable-linked Supabase project (no application rows) again returned 22/22 public base tables with RLS enabled and 0/22 FORCE RLS; 68 policies on 22 tables. Direct table-grant counts include `anon` with INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on 21/22 and `authenticated` on 22/22; SELECT is present on 19/22 and 20/22 respectively.
- This supports the existing P0 least-privilege/default-ACL finding #164. It does not prove an exploitable endpoint because policies may restrict ordinary row operations. RLS does not constrain table-level TRUNCATE. No writes or private-row reads were made. The project ref in repository `supabase/config.toml` has not been reconciled to this Lovable project's actual database identity.

### Exact-head checks now available
- PR #285 `f7a7bcaa5012a78155a8f4bd5b41295335218ce1`: Verify pass [run 39711933886](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39711933886); CodeQL/dependency audit pass [run 39711933943](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39711933943). Draft and unmerged.
- PR #271 `8b0e12643275917e8f5ba10b14f730054fec9b74`: Verify pass [run 39712621495](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39712621495). It remains draft and stacked on #285; CodeQL is not a complete human/privacy sign-off and should be rerun after it returns to `main`.
- PR #283 `ae9a079a5c3d30beba9abed843808dc3cb866505`: Verify pass [run 39712703599](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39712703599). Draft, docs-only, stacked on #285.
- These results prove branch verification only. Supabase Preview was skipped where reported; no capacity/load traffic, deployment, merge or hosted permission change was performed.

### Order after human gates clear
1. Confirm the Lovable sync target, intended repository/branch, actual backend/project reference and production hostname/build.
2. Review/merge #285 after independent review; then retarget/rebase #271 and #283 to main and rerun exact-head Verify/CodeQL. Do not merge either stacked draft directly into main while its base is a feature branch.
3. Only after owner-authorized publish/host work, rerun root robots, root sitemap, index and all children with real HTTP GETs and compare them to the published SHA.
4. Resolve #164 using a confirmed database identity, complete policy/function/column/default ACL inventory, disposable anonymous/user-A/user-B/moderator tests and rollback rehearsal before any hosted migration.


## Latest read-only security and SEO evidence — 2026-10-22

This addendum supersedes any older count or live-endpoint status above where they differ. Detailed sanitized grant matrix and test plan are recorded in [Issue #164 comment](https://github.com/mattleask373-rgb/life-lived-network/issues/164#issuecomment-6331424442); the connection-specific review note is on [PR #286](https://github.com/mattleask373-rgb/life-lived-network/pull/286#issuecomment-6331435780).

### Fresh connected-project catalog results

- Read-only catalog SQL was executed through the Lovable connector against the project named Real World Atlas. It returned database `postgres`, execution role `postgres`, PostgreSQL `17.6`; no user rows, private messages, report content or credentials were read, and no data or schema was changed.
- **22/22 public base tables have RLS enabled; 0/22 have FORCE RLS; 68 policies cover the 22 tables.** All are owned by `postgres`.
- **19/22 tables have all table-level privileges granted to `anon`**, including TRUNCATE. The `sources` and `source_records` tables lack table-level SELECT but still carry client write/admin privileges; `place_memories` has no anon table grant. **20/22 tables grant authenticated the full table-level privilege set**; source tables again lack table-level SELECT but retain client write/admin privileges. Column grants are also broader than the desired role matrix.
- Default ACLs for new public tables under both `postgres` and `supabase_admin` include broad rights for client roles; `postgres` defaults also grant broad sequence rights and function EXECUTE to client roles. These results confirm a critical least-privilege remediation need in the connected project. They do not by themselves prove that a corresponding PostgREST endpoint is reachable or exploitable.
- **Project identity mismatch remains unresolved.** Repository `supabase/config.toml` names `csgngcnaqeoxyopvnzjo`; the Lovable project ID is not itself the Supabase project reference, and the matching backend reference has not been confirmed. Do not apply any SQL until that is reconciled.
- `private.people_are_blocked(uuid,uuid)` currently appears SECURITY DEFINER with execute granted to owner and `service_role` only, while connection RLS policies call it. Test authenticated evaluation on a disposable database; do not widen EXECUTE without reviewing privacy and RPC exposure.
- Detailed comments on #164 and #286 specify the target per-table access classes, explicit-default revocation proposal (marked NOT TO APPLY), and anonymous/two-user/reviewer/service-role regression suite.

### Fresh read-only public-host confirmation

- A fresh GET of `https://life-lived-network.lovable.app/robots.txt` returned HTTP 200 / `text/plain`, but its body permits all paths to major crawlers and `User-agent: *`; it has no intended private-route `Disallow` rules and no `Sitemap:` directive.
- A fresh GET of `https://life-lived-network.lovable.app/sitemap.xml` returned HTTP 404 / `text/html` with the application 404 page, not sitemap XML.
- Current GitHub main has a tracked private-route robots file and static sitemap-index file, but the checked public response does not match current source. Lovable's working branch is materially divergent and its deployed SHA/production origin have not been established. Do not sync or republish to “fix” this until the owner confirms the repository, branch, backend and hostname. After an approved host change, re-check the index and every known child sitemap.

### Exact PR security disposition

- #285 focused k6 CI repair passes Verify, CodeQL and locked-dependency audit on `f7a7bcaa5012a78155a8f4bd5b41295335218ce1`; it remains draft and unmerged pending independent review.
- #271 shared crawler-route policy / Life List privacy fix passes Verify on stacked head `8b0e12643275917e8f5ba10b14f730054fec9b74`; it remains draft, stacked on #285, and needs CodeQL once rebased back to main after the CI fix has been human-approved/merged.
- #283 remains a docs-only status candidate stacked on #285. Its exact head should be rechecked after every further update. None of these is deployed.


## Governance enforcement and PR queue snapshot — 2026-10-22

### Main-branch ruleset (read-only)
GitHub reports active repository ruleset **`living World - protect main`** (ruleset ID `24946178`, updated 2026-10-22):
- Target: default branch; non-fast-forward updates prohibited.
- Required check: `verify`, with strict base-branch policy.
- Pull requests required; review-thread resolution and last-push approval required.
- **`required_approving_review_count: 0` and `require_code_owner_review: false`.** The ruleset therefore does not require a positive number of approving reviews or CODEOWNERS review. This setting alone does not enforce the plan's “different agent reviews each PR” + “human sign-off on gated areas” requirements. The `require_last_push_approval` flag is enabled.
- Direct branch-protection API inspection returned 403 for the connected integration; no attempt was made to modify rulesets or bypass restrictions.
- Human action: decide positive approval count and CODEOWNERS policy, then change rules through the repository's approved admin workflow. No change made here because branch-protection changes are a human gate.

### Queue health
Latest read-only open-PR query returned:
- **89 open PRs**: 45 draft and 44 non-draft.
- **57** not updated for more than seven days; **32** not updated for more than fourteen days.
- **76** target `main`; **13** target another feature/phase branch. The non-main set includes #271 and #283 stacked on #285, and older dependent control-plane, visual-language and ingestion chains.
- This exceeds the plan's limit of ten open PRs overall. Do not reduce the count by bulk closing or blind merges: the plan requires unique findings to be ported first.
- Next autonomous triage should classify overlap families by changed-file overlap, merge base, unique behaviour/tests, exact-head CI and dependency edges, then produce ordered keep/rebase/merge-after-parent/close-with-findings-carried-forward recommendations. No closures or merges were performed.

### Exact-head status for the current checkpoint
- #285 `f7a7bcaa5012a78155a8f4bd5b41295335218ce1`: Verify, CodeQL, locked-dependency audit pass; draft and unmerged.
- #271 `8b0e12643275917e8f5ba10b14f730054fec9b74`: Verify passes; draft and stacked on #285; CodeQL should be rerun after it is retargeted to main.
- #283 had Verify pass on earlier head `ae9a079a5c3d30beba9abed843808dc3cb866505`; any subsequent append creates a new run. Check its newest exact head before calling the status candidate verified.


### Expanded live sitemap GET verification — 2026-10-22

Fresh read-only GET checks against the same public Lovable origin returned:

| Endpoint | HTTP | Content type | Observed body |
|---|---:|---|---|
| `/robots.txt` | 200 | `text/plain` | Allow-all crawler rules; no private-path disallows or `Sitemap:` directive |
| `/sitemap.xml` | 404 | `text/html` | Application 404 page, not XML |
| `/api/public/sitemap.xml` | 404 | `text/html` | Application 404 page, not XML |
| `/api/public/sitemap-pages.xml` | 404 | `text/html` | Application 404 page, not XML |
| `/api/public/sitemap-localities.xml` | 404 | `text/html` | Application 404 page, not XML |
| `/api/public/sitemap-services/1.xml` | 404 | `text/html` | Application 404 page, not XML |

These are current observations for `life-lived-network.lovable.app`; they do not prove it is the owner-confirmed production origin. They establish a public crawler-route failure on the host inspected. A robots allow-all file is not authorization, but it is wrong for the intended crawler policy. Root sitemap/index/children cannot be considered released or operational until the owner confirms the actual published source and an approved release/host correction yields successful XML responses. Do not use a Lovable sync or deployment to fix this before repository, branch, backend and host are verified.


## ADR-004 / ADR-005 added on this draft branch

Two proposed ADRs have been added without overwriting the repository's existing accepted ADR-001 and ADR-002:
- `docs/adr/004-canonical-backend-and-migration-authority.md`: backend identity, safe treatment of the divergent Lovable branch, one migration authority and owner-controlled portability.
- `docs/adr/005-million-dau-capacity-model.md`: explicit request arithmetic, measured workload fields, staged staging-only tests and cost formulas.

These are **proposed**, not accepted decisions. ADR-004 requires owner verification of repository/backend/host and migration authority; ADR-005 does not claim capacity has been measured. There are two existing files named ADR-003 in the repository; this addition intentionally avoids duplicating their numbering and records that numbering collision for future documentation hygiene.


## Latest canonical PR / coordination reconciliation — 2026-10-22 03:22 UTC

This addendum supersedes earlier PR queue snapshots above. GitHub's canonical REST records, rather than stale connector snapshots, are used for the merged/closed status below.

### Merged product/security foundations (already on current main)

- **#274 — source lifecycle in public discovery:** merged at 00:11:23 UTC. All three changed-file blob SHAs (source-lifecycle-policy.ts, its tests, world.functions.ts) match current main. No new merge performed by this review.
- **#275 — WorkOpportunity locality and editable Need flow:** merged at 00:13:40 UTC.
- **#276 — locality sitemap pagination:** merged at 00:11:41 UTC.
- **#277 — fail-closed imported sitemap evidence:** merged at 00:12:02 UTC, stacked on #276.
- **#280 — profile service-area / journey relation separation:** merged at 00:13:19 UTC.
- **#282 — privacy-minimised outcome event contract:** merged at 00:11:05 UTC. The contract is in main; this does not prove an analytics sink is configured or real-world outcomes are collected.
- **#129 — private routes out of crawler paths** and **#157 — tracked .env hygiene** are merged; **#232 — reconciled private-route auth-guard tests** is merged. Their older superseded candidates must not be re-applied.
- **#131 — demo fixture production guard** and **#155 — earlier service-area match proposal** are closed unmerged. #131's relevant fixture guard was separately verified on main via the later current-main fix; closure does not establish host deployment.

### Remaining older candidates confirmed open

- **#154 — exact open-needs / fail-closed-by-place** remains open, non-mergeable and based on old main (5f06fc…). Its head is ad5dce30…. Compare against merged #275 and current findSupply() behavior, preserve any unique “honest open needs” tests, then rebase/port or close only after proof.
- **#156 — private route auth guard tests** remains open on old base (5f06fc…); **#214** remains open on older base (ccbcc6…) even though its later reconciliation **#232** merged. Compare unique test cases; do not merge two copies of the same route guard suite.
- **#125** remains the open agent-coordination issue. Use it as the coordination index for the durable team programme, not as a substitute for docs/agents/STATUS.md.

### Updated queue snapshot at 03:20 UTC

Canonical GET /pulls?state=open returned **90 open PRs (46 drafts, 44 non-drafts)**. **14** target non-main branches: four deliberate stacked candidates on #285 (#194, #245, #271, #283) and ten older control-plane/dependency branches. These figures supersede earlier 89/45/44 and 13-non-main snapshots. Re-fetch counts before future closure work; activity is concurrent.

### Overlapping status PR and single-writer disposition

PR **#287** (agent/grok/status-seo-gap-2026-10-22) edits only docs/agents/STATUS.md and captures this cycle's live robots/sitemap mismatch, current-main SHA and several historic PR states. Its unique facts on #125, #129/#131/#155/#157, #154, #156/#214/#232 are consolidated above. This PR adds the same file but does not include the security/Storage cross-schema inventory or ADR-004/005 in this branch. Compare/cross-port completed; keep only one canonical STATUS change. No content from #287 is being integrated by a second concurrent write.

### SEO caveat retained

Current source has static/dynamic robots and sitemap routes, but the personal Life List is still included in PUBLIC_PATHS on main until #271 merges, so source parity is not fully correct yet. Fresh unauthenticated GETs on life-lived-network.lovable.app continue to show allow-all robots without Sitemap/Disallows and 404 HTML for root and child sitemap paths. The exact deployed build SHA and Lovable sync target are unconfirmed. These observations block launch; no sync, republish or deployment was performed.

## Queue snapshot correction — 2026-10-22 03:25 UTC

After the unique facts from duplicate STATUS-only PR #287 were ported into this file and the duplicate was closed unmerged, the current canonical GET /pulls?state=open query returns **89 open PRs: 45 drafts, 44 non-drafts**. 56 have not been updated for over 7 days; 32 for over 14 days. **15** target non-main branches: the four intentional stacks #194/#245/#271/#283 on #285, plus eleven older control-plane/dependency chains (#62, #109, #106, #108, #104, #103, #102, #101, #86, #57, #58). This supersedes the immediately previous 90/46/44 and 14 non-main snapshot.

PR #287’s unique verified facts (coordination issue #125; canonical states for #129/#131/#154/#155/#157/#156/#214/#232) are preserved in the addendum above and in the conversation on #279. No PR was merged in this status reconciliation; #287 was closed unmerged after its unique findings were ported. Re-fetch live counts before the next closure/triage pass because agents are still working concurrently.