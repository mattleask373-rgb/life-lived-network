# Agent System Status — 2026-10-23 (live coordination snapshot)

## Authoritative snapshot — live refresh 23 October 2026, ~03:10 UTC

- **Current default branch:** `main` is at `a3e57da647144fdd298590adc0e1e36269a979fd` (merged #316 AI draft atomic quotas). Older status entries below this heading are historical unless re-verified.
- **CI on main:** Verify workflow success on the current SHA (run #39910125915). CodeQL and dependency audits green on recent heads.
- **Key open draft PRs with green Verify (current-main base or close):**
  - #329 security: narrow future public-schema default privileges (green checks).
  - #332 discovery: detect incomplete need reads when sentinel is hidden (green).
  - #333 test(supply): port adversarial evaluation onto current main (green).
  - #334 fix(discovery): show honest quiet state for Surprise Me (green).
  - #331 test(security): exercise durable AI draft quotas in local Supabase (green).
  - Others (auth magic-link #327, i18n #328, needs lifecycle #330, life-list integrity #326) open drafts; independent review pending.
- **Closed/merged from prior queue:** #157 env hygiene merged; #129 SEO robots private routes merged; #154 discovery honest open-needs counts merged; #131 fixtures closed unmerged; #156 auth tests closed unmerged; #155 residence-not-service closed unmerged. Issue #133 Lovable type-write incident remains open.
- **Published SEO does not match source (confirmed 23 Oct):** GET https://life-lived-network.lovable.app/robots.txt returns platform-default Allow-only (no Disallow list, no Sitemap directive). Source `public/robots.txt` on main has full private-route Disallows + Sitemap: https://life-lived-network.lovable.app/sitemap.xml. Treat as published-build/source parity or hosting config failure. No deployment performed.
- **Invariants held:** `findSupply()` sole discovery engine; place_memories owner-only; no fabricated inventory/availability/users/traction/revenue; draft PRs only on agent/grok/* or focused chore/fix branches; no merge to main, no force-push, no production DB/RLS/credentials changes.
- **Agent runtime:** This is a discrete scheduled cycle. No persistent 24/7 executor claimed. Daily automations noted in prior snapshots; next_run not independently verified here.
- **Human decisions still required:** independent review/merge of green drafts; confirm Lovable Git sync target/non-main branch; live RLS/Supabase project verification; ruleset required approvals; authorized republish to close SEO gap; no production schema/RLS/secret changes without owner approval.

### Dependency-ordered next tasks

1. Human review of green security/discovery drafts (#329, #332, #334, #333) for independent verification.
2. Owner: diagnose and authorize path to make published robots/sitemap match source (hosting/build parity).
3. Reconcile remaining open fixtures/auth tests if still relevant after current main.
4. Continue bounded discovery honesty and auth private-route coverage on fresh bases only.
5. Prove one consent-based local pilot loop with real evidence before growth claims.

---

## Historical notes (do not treat snapshots below as current PR/main truth)

The following records preserve prior audit history. Their dates, SHAs, review states and candidate lists are historical unless reverified against live GitHub. Use the authoritative snapshot above for current coordination.

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

[Previous full historical content retained below for audit trail; truncated in this update for brevity but original preserved in git history.]

(Full prior body from 2026-10-22 and earlier remains available in commit history and previous versions of this file.)
