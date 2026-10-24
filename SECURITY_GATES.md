# Security and Release Gates

**Evidence snapshot:** 24 October 2026, current live GitHub and CI evidence  
**Canonical main:** 70a3e261b18e3be5e90429e4ad4defd1fd8008c7  
**Status vocabulary:** VERIFIED_ON_MAIN, VERIFIED_LOCAL_CI, VERIFIED_LIVE, CANDIDATE, UNKNOWN, BLOCKED, NOT RUN. Source and local CI are not proof of hosted behavior.

## Gate board

| Gate | Status | Current evidence | Exact exit evidence |
|---|---|---|---|
| 0 — Authoritative environment identity | BLOCKED / owner-owned | Lovable Git target/sync branch, canonical host/deployed build SHA, production Supabase project ID and separate disposable project are not authoritatively confirmed. This audit could not freshly retrieve the public host. | Owner/admin records repository and branch, canonical HTTPS host and deployed SHA, actual production project ID, separate disposable project and rollback plan. Compare hosted configuration with repository before syncing or writing. |
| 1 — Repository governance | ACTIVE; deletion protection separately unverified | Main returns protected=true. Ruleset 24946178 is active with one approval, latest-push approval, stale-review dismissal, resolved threads, strict Verify and non-fast-forward prevention. No bypass actors were returned. | Re-fetch ruleset and branch protection after changes; separately verify any required branch-deletion control. No autonomous merge or bypass. |
| 2 — Locality privacy and least privilege | CANDIDATE PASSES LOCAL CI; NOT MERGED / NOT HOSTED-PROVEN | #362 Verify and CodeQL pass; Verify includes empty local migration replay, pgTAP, direct PostgREST RLS, DB-function lint and k6 parse-only. #363 has the same categories of local proof and CodeQL pass. Both remain open for human security review. | Inspect effective policies and grants for anon/authenticated/service role, sensitive fact tables, owner-read policies, RPC execute grants, SECURITY DEFINER owner/search_path/privileges, exact-place membership, expiry/revoke, and list → detail → findSupply. Then owner-authorise isolated hosted non-production RLS proof after Gate 0. |
| 3 — Source/data correctness and provenance | PARTIAL | #351 fail-closed reads, #360 explicit pagination evidence, #357 pin/list cap parity, and #341 Life List write integrity pass Verify on candidate heads. #345 requires fresh current-main migration/RLS validation. | Exact-head checks and regression coverage that distinguishes verified empty from query error, missing collection, truncated page and unknown eligibility. Independent keyboard/screen-reader/mobile/date-line QA. |
| 4 — Pilot supply and real outcomes | BLOCKED; no verified pilot evidence | No rights-cleared, locality-verified, steward-backed supply or measured request → response → outcome loop is established by reviewed evidence. | One named locality with consented participants, provenance/rights and revocation, freshness/lifecycle checks, human steward and safety escalation, measured outcomes with denominator and missingness. |
| 5 — AI safety, privacy and spend | BLOCKED FOR PUBLIC AI | Public “Ask this place” remains OFF. Signed-in draft assistance is the only AI route described here. #340 tests quota behavior and #349 adds per-attempt source limits, but deployed quota migration/provider billing caps are not proven live. | Disposable concurrency/replay abuse tests, deployed quota migration, per-account/global limits, provider-side caps/alerts, prompt/output evaluation, locality isolation, tested kill switch, retention/RLS review and human escalation. |
| 6 — Continuous operations | IMPLEMENTATION CORE ONLY | #359 proposes worker and dispatch/idempotency foundations; latest Verify was still in progress at the last read and CodeQL passed. It lacks the live adapter, persistent scheduler, durable liveness/alerts, cancellation/budget enforcement and non-production rehearsal. | Trusted server-only adapter, persistent scheduler/queue, claim/lease/heartbeat fencing, idempotency, retries/dead-letter/recovery, cancellation, run closure, spend/time ceilings, kill switch, alert delivery, rollback/runbooks and observed non-production soak. Production mutation/merge/deploy must remain human-gated. |
| 7 — Published host, accessibility and growth | BLOCKED / stale live evidence | Public SEO Smoke #40088907466 failed 19 assertions on older main SHA 182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f. It reported sitemap XML 404, robots and private-route rules, /life-list noindex and canonical/indexability mismatches. Current host/build was not freshly probed. | After Gate 0 and authorized republish, GET-only checks on the exact host for robots, sitemap index/children, public/private route parity, canonical/noindex and manual accessibility/mobile/date-line QA. No marketing/global coverage claims before evidence. |

## Exact current CI evidence

- Main Verify: [#40094349108](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40094349108) PASS.
- Main CodeQL: [#40094349114](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40094349114) PASS.
- #362 Verify [#40095183795](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095183795) and CodeQL [#40095183720](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095183720) PASS.
- #363 Verify [#40095409897](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095409897) and CodeQL [#40095409761](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095409761) PASS.
- #358 Verify [#40095367366](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095367366) and CodeQL [#40095367110](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095367110) PASS.
- #351 Verify [#40095450777](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095450777), #360 Verify [#40095474572](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095474572), #357 Verify [#40095609892](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095609892), and #341 Verify [#40095513665](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095513665) pass on candidate heads. Exact-head CodeQL has not refreshed for every source-only branch after its latest changes.

## Required security checklist

- [ ] Gate 0 environment identity signed off by owner/admin.
- [ ] #362 independently approved after policy/grant/RPC review.
- [ ] #363 independently approved after actor/privilege/audit/expiry review and after #362 final base.
- [ ] Direct-table and RPC RLS/ACL matrix passes on the exact candidate commit.
- [ ] Canonical findSupply remains the sole evaluator; no service-role shortcut or anonymous fallback widens local discovery.
- [ ] Public source rows preserve rights, provenance, freshness, lifecycle and revocation semantics.
- [ ] Current exact-head Verify, relevant CodeQL/dependency checks and database replay evidence attached to each candidate; skipped is not passed.
- [ ] Published SEO/private-route parity freshly proven on the owner-confirmed deployed build.
- [ ] AI quota, spend limits, kill switch and locality isolation proven in isolation; public AI remains OFF until approval.
- [ ] Worker scheduler, crash recovery, liveness, alerts, rollback and kill switch pass isolated non-production rehearsal.
- [ ] One real locality proves a human request → response → outcome loop before expansion.

## Owner-only decisions

Canonical Lovable target/sync branch; production host/build/backend identity; hosted DB inspection/mutation; hosted RLS rollout; deployment/republish; provider activation and spend; real membership provisioning; public AI activation; external contact and market launch.

No public page generation, global marketing claim, production worker activation, hosted write or autonomous merge is authorised by this document.