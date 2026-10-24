# Current Priorities — Evidence-Gated Execution

**Snapshot:** 24 October 2026, current live GitHub and CI evidence  
**Canonical main:** 70a3e261b18e3be5e90429e4ad4defd1fd8008c7  
**Operating mode:** no global expansion, public AI or production worker activation until security, identity and pilot gates close.

## Confirmed state

- PR #353 (Zod 4.6.7 / Undici 7.30.1) merged at 12:30 UTC.
- PR #348 (foundational private membership-backed local-discovery boundary for needs) merged at 12:32 UTC.
- Main is protected. Ruleset 24946178 is active and requires one human approval, approval of the latest push, dismissal of stale approvals, resolved review threads, strict Verify and non-fast-forward prevention. Branch-deletion protection is not separately proved.
- Main Verify [#40094349108](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40094349108) and CodeQL [#40094349114](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40094349114) passed on the current SHA.
- The #350 fact-scope changes were not released on main; they were part of the #348 stack after #348 merged. Clean current-main replacement PRs #362 and #363 are the active review candidates.
- Latest available Public SEO Smoke [#40088907466](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40088907466) failed on older main SHA 182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f with 19 assertions. The current deployed host/build has not been freshly revalidated.
- Open queue: 99 PRs; 87 drafts and 12 ready for review. Only 11 target the exact current main SHA; 88 target older or stacked SHAs. Reconcile one candidate at a time.

## Highest-priority work

### P0 — current-main security reviews

1. **#358 — Verify concurrency isolation.** Current Verify and CodeQL pass; one human approval remains.
2. **#362 — verified locality fact-level RLS and authenticated exact-place readers.** Verify, local replay, pgTAP, direct PostgREST RLS, DB lint and CodeQL pass. Human review of policies/grants/routes is mandatory.
3. **#363 — audited membership administration.** Verify, local replay, pgTAP, PostgREST, DB lint and CodeQL pass. Review actor identity, server-only service role, SECURITY DEFINER ownership/search_path/grants, no self-approval, expiry/revocation and audit atomicity. Never provision real members before owner-authorised rehearsal.

### P0/P1 — truthful data and account state

4. **#351** fail-closed world row reads — current Verify passes; review and integrate after #358.
5. **#360** honest hours pagination and complete enrichment — current Verify passes; stacked on #351, then retarget/recheck after #351 merges.
6. **#357** map/list parity at the 300-pin cap — current Verify passes; human UI/mobile/accessibility QA remains.
7. **#341** Life List write integrity — current Verify passes; review account-switch fencing, failed writes and guest migration.
8. **#345** need freshness/lifecycle — refresh to current main; full migration/RLS evidence and independent policy review are required.

### P1 — identity, AI cost and measurement

9. **#343** magic-link sign-in — current Verify and CodeQL pass; owner must confirm production email delivery, canonical Site URL and redirect allow-list.
10. **#340** AI quota concurrency — refresh to current main and prove the quota migration/test actually runs on a disposable DB before any AI enablement.
11. **#349** per-attempt draft cost limits — review after quota evidence; provider billing caps/alerts and kill-switch rehearsal remain owner duties.
12. **#347** privacy-minimised outcome contract — docs/contract only, no live event sink. Privacy/RLS/retention review and a separate instrumentation PR are required before pilot outcome claims.

### P1/P2 — search, presentation and operations

13. **#335/#355** robots, sitemap and private-route parity. Confirm Gate 0; retain completeness assertions and fresh host GET evidence before any authorized republish.
14. **#346** partial four-locale foundation. Finish target market strings/forms/legal/safety content and manual accessibility review.
15. **#359** worker/dispatch core. CodeQL passes; Verify was still running at latest read. It is not a live 24/7 service.
16. **#361** broad 49-package update. Verify/CodeQL passed on its own head but it is 48 commits behind current main; refresh ancestry and run targeted UI regressions before review.

## Owner-only Gate 0

Before hosted inspection, sync, write, deploy, provider activation or real membership provisioning, the owner/admin must record:
- exact Lovable repository and protected non-main sync branch;
- canonical public HTTPS host and deployed build SHA;
- actual production Supabase project ID;
- separate disposable Supabase project and rollback path.

A project reference in the repository is not proof of live backend identity.

## Never infer

Skipped database steps are not passes. Old-head or cancelled runs are not current evidence. Local disposable RLS is not hosted RLS. A worker core is not a 24/7 service. Source changes are not proof that the public host changed. Public “Ask this place” remains OFF.