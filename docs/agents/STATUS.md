# Agent System Status — 2026-10-24 (live coordination snapshot)

## Authoritative snapshot — live refresh 24 October 2026, ~12:20 UTC (Grok discrete cycle)

- **Current default branch:** `main` is at `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f` (merge of #334 honest Surprise Me quiet state, plus prior security/discovery merges).
- **Env hygiene:** root `.env` no longer tracked (prior #157 merged). `.gitignore` covers `.env` / `.env.*` with `!.env.example`.
- **Discovery honesty:** `findSupply()` remains the sole engine. Exact open-needs counts + fail-closed scope landed (#154 merged). Service-area honesty superseded/closed #155 via later work. No second matcher. Fixtures gated in production.
- **Live SEO gap (FAIL / NOT CLOSED):** Source `public/robots.txt` + `robotsTxt()` on main has full PRIVATE_PATHS Disallows + Sitemap directive (merged #129). Fresh unauthenticated GET this cycle: `https://life-lived-network.lovable.app/robots.txt` still returns platform-default blanket `Allow: /` (no Disallows, no Sitemap). Sitemap paths 404 or serve HTML app page. Documented in open draft #355. Related #335 open for static generation hardening. Gap is published-build/hosting/sync parity, not missing source. Requires owner-authorized Lovable republish + re-probe. Crawler guidance only, not access control.
- **Security priority open PRs (green CI, awaiting independent review):**
  - #353 Zod 4.6.7 + Undici 7.30.1 patch: Verify/Audit/CodeQL/TS **success** on head `7e63c7e385ed1fc8c6c380eca3967cb85cafad51`. Dependency-only. mergeable_state blocked (review required).
  - #348 verified locality boundary for local discovery needs: claimed Verify PASS.
  - #350 scope local-discovery personal facts to verified places.
  - Stacked #352/#354 authenticated locality RLS / membership provisioning.
- **#133 type/safety incident:** still OPEN. Human decision required: keep or reviewed-revert PostgrestVersion 14.5→14.17 bot write to main during read-only audit. Investigate Lovable write path. No auto-revert.
- **Other:** Many agent/chatgpt/* drafts open (i18n, measurement, map, AI bounds, etc.). Prefer reconciling green security over new duplicates. Supabase Preview skipped is not passed. No production DB/RLS/credentials/keys changes. No fabricated inventory/traction.

### Dependency-ordered next tasks
1. Human reviewer: review + approve #353 (deps hygiene) first, then locality security stack (#348/#350/#352/#354).
2. Owner: authorize Lovable republish/sync of current main to close live robots/sitemap gap; re-probe after.
3. Decide #133 keep/revert + confirm Lovable non-main Git sync target and ruleset required reviews.
4. Continue independent items only after above (SEO live gap analysis already in #355; private route tests previously merged via superseding work).

---

## Historical notes (do not treat snapshots below as current PR/main truth)

(The previous 2026-10-22 and earlier content is retained below unchanged for audit trail.)

# Agent System Status — 2026-10-22 (live coordination snapshot)

## Authoritative snapshot — live refresh 22 October 2026, 20:20 UTC

- **Current default branch:** `main` is at `86283de035db4d8543cd169f4346e27fa26eadb8`, 88 commits ahead of the earlier `a99d09f1517523a7a388245ca6b3d5c1245816cb` baseline. Older status entries below this heading are historical unless they are re-verified.
- **Recently merged into main:** #291 (combined locality/SEO/map/date-line/source-scan hardening), #294 (Year-One plan/status reconciliation), #297 (least-privilege ACL proposal documentation only), #289 (AI draft request validation), and #302 (wide-area retrieval acceptance contract). Merging the ACL document does **not** authorize or perform a database ACL/RLS migration. Input validation is not a spend quota.
- **#304 — active wide-area implementation:** [PR #304](https://github.com/mattleask373-rgb/life-lived-network/pull/304), head `afc2b544b36a96d64f3b51602532f1c49d1d1313`, based directly on the current main SHA above; draft, open, mergeable, no independent review yet. It implements bounded per-locality chunk retrieval for `getMyOpportunities()`: at most 400 place IDs per query, at most 5,000 unique place IDs total, up to 60 candidates per chunk (13 chunks / 780 rows maximum), deterministic merge, preservation of locality filters, fail-closed backend errors and explicit too-wide recovery UI. It calls the existing `findOpportunitiesForPerson()` matcher, not a second matcher. Exact-head Verify [#39846777812](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39846777812) and CodeQL/TypeScript/dependency audit [#39846777934](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39846777934) passed. Supabase Preview is skipped, not passed. Independent review, manual accessibility/mobile/date-line QA and review of the bounded completeness argument remain.
- **#305 — active AI cost-safety slice:** [PR #305](https://github.com/mattleask373-rgb/life-lived-network/pull/305), head `0af4d814c827970d567d16a0afdb5930d978d5f8`, based directly on the same main SHA; draft, open, mergeable, no independent review yet. It adds the feature-specific server-side `DRAFT_ASSIST_DISABLED=true` check before provider construction, unit coverage and an operations runbook. Verify [#39846295094](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39846295094) and CodeQL/TypeScript/dependency audit [#39846295246](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39846295246) passed. This is **not** a durable per-account/IP limiter, cross-instance concurrency/replay control, provider spend cap/alert, or instant distributed kill switch. Issue #290 remains open for those controls. Public “Ask this place” remains disabled.
- **Superseded work:** #303 is closed unmerged; its code was ported to fresh-base #304 to remove a stale-base duplicate. #293 and overlapping UI follow-ups #296/#298/#300/#301 were closed unmerged after relevant work was consolidated into #291. Do not resurrect these without an overlap audit.
- **Remaining broad-area truth:** `getOpenNeeds(placeId)` now rejects descendant scopes over 400 with `SCOPE_TOO_WIDE` rather than dropping the locality predicate. The current place hierarchy reader uses exact-count verification and bounded deterministic keyset pages, and the public world route derives descendants from the canonical server index when given a place. The main remaining opportunity-discovery fix is #304. These are code-path claims, not evidence of current production data volume or privacy leakage.
- **Published SEO does not match source:** fresh read-only GETs on 22 October returned `/robots.txt` HTTP 200 without a `Sitemap:` directive; `/sitemap.xml` HTTP 404 rendered as HTML; and `/life-list` HTTP 200 with “Only you see this” text but no visible robots=noindex or canonical tags in the returned HTML. Current main already contains the static sitemap index, a robots sitemap directive, `privatePage` for Life List, and `.github/workflows/seo-live-smoke.yml` scheduled daily at 06:23 UTC. Treat this as **published-build/source parity or hosting configuration failure**, not proof of cross-account saved-data exposure. The probe and owner-required action are recorded in [issue #263](https://github.com/mattleask373-rgb/life-lived-network/issues/263). No deployment or production setting changed.
- **Agent runtime:** three enabled Automations are configured daily at 08:00 Europe/Amsterdam: Living World Fleet Control (read-only), Daily Security & Release Audit (read-only), and Year-One Safe Build Loop (bounded GitHub branch/PR implementation work is now authorized by the user; Lovable writes remain blocked until its actual repository/sync branch is authoritatively confirmed). The automation API reports `next_run_time: null`; exact next dispatch is not independently verified. Daily scheduled automation and this on-demand session are not a persistent 24/7 executor.
- **Control plane:** #299 remains open and non-mergeable on an old base, head `f5ac2728edf52743319b95434e4b484f69fdb715`. It changes a 13-migration lineage including RLS, grants and SECURITY DEFINER RPCs. Keep blocked until the target project/history are verified by the owner, the chain is replayed against a named disposable database, and signatures/default privileges/RLS/rollback/fencing/idempotency receive independent security review. Do not apply it to a hosted or production project.
- **Governance gate:** ruleset #24946178 was last read as active but with `required_approving_review_count: 0`; deletion protection was not evident in the returned raw rules. A repository administrator must configure and re-fetch required approvals and deletion protection. Do not merge code PRs until this is verified, plus the owner confirms the authoritative Lovable Git target/non-main branch, deployed build SHA and Supabase project/environment.
- **Other launch gates remain human-owned:** independent code/security reviews; keyboard/screen-reader/mobile/date-line QA; disposable DB authorization and migration proof; lawful/consented pilot supply and one measured supply → request → response → completion loop; product naming, market/legal/commercial policy, retention/provider decisions, budget, outbound contact and production release. No production data/schema/RLS/grant/secret changes, deploy, paid activation, outreach or public AI launch were performed in this pass.

### Dependency-ordered next tasks

1. Review #304 independently and re-run all checks if its head/base changes; validate the 400/401 and 5,000/5,001 tests and the candidate-coverage argument, then complete manual keyboard/screen-reader/mobile/date-line QA.
2. Review #305 independently; design and implement the durable atomic quota/concurrency/replay boundary for #290 with adversarial tests, plus provider-side budget caps/alerts. Do not mistake an environment kill switch for those controls.
3. Owner/admin Gate 0: confirm main approval/deletion settings; confirm actual Lovable repo/sync branch, published SHA and Supabase environment. Then follow the existing daily live SEO smoke after a human-authorized deployment path is confirmed.
4. Reconcile #299 only after owner-confirmed disposable DB replay, migration history and security proof; consolidate old control-plane proposals rather than merging them wholesale.
5. Prove one consent-based local pilot loop with real evidence before market replication, public AI, provider activation or spend.

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
- **[#243 — Journey/Road Trip editorial redesign](https://github.com/mattleask373-rgb/life-lived-network/pull/243):** draft, based directly on current `main`;
