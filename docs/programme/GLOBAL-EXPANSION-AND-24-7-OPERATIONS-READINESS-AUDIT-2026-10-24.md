# Global Expansion and Continuous AI Operations Readiness Audit

**Snapshot:** 24 October 2026, live GitHub and CI evidence  
**Canonical main:** 70a3e261b18e3be5e90429e4ad4defd1fd8008c7  
**Verdict:** **Not ready for global launch or fully autonomous 24/7 operation.** Important dependency and foundational locality-boundary fixes have landed. Remaining security, identity, live-host, pilot-supply, and continuous-operations gates are substantive blockers.

## Scope and evidence standard

This is a GitHub source, PR and CI audit. It is not a hosted Supabase audit, deployment audit, market study, or line-by-line review of every historical diff. Exact-head workflow results are linked below. Supabase migration replay, pgTAP, and PostgREST tests ran inside CI's disposable local stack. They do **not** prove that the owner-selected hosted project, grants, migration history, deployed build, or production host matches the repository.

The connected browser could not freshly retrieve the Lovable public site in this run. The latest available scheduled Public SEO Smoke did fail, but it ran against an older main SHA. Treat it as unresolved published-host evidence, not as a fresh probe of the current deployed artifact.

## Executive assessment

The circular network requires a truthful loop: verified local supply → map/list discovery → clear consent and response path → an actual meeting, service or experience → a recorded real-world outcome → a fresh, privacy-minimised understanding of what worked. The single canonical supply matcher, place hierarchy, map-first interface and supply/provenance model provide a coherent design. They do not yet prove that loop is operational in a pilot locality.

Four findings determine the next steps.

1. **Dependency health and repository governance have improved.** PR #353 merged Zod 4.6.7 / Undici 7.30.1. PR #348 merged the foundational private membership-backed boundary for local-discovery needs. Current main is protected, the ruleset is active, and main Verify and CodeQL pass.
2. **The deeper locality security correction is not released yet.** Follow-on fact-level RLS work from #350 landed on the #348 branch after #348 merged, rather than on canonical main. Clean current-main review candidates #362 and #363 now contain the authenticated consumer/fact-policy changes and the audited membership administration separately. Both have exact-head Verify and CodeQL passes, but still need independent human security approval.
3. **Source correctness has advanced, but the candidates remain unmerged.** #351 fail-closed row reads, #360 open-hours pagination/completeness, #357 map/list pin-cap parity, and #341 Life List write integrity have fresh Verify passes. #360 remains stacked on #351 and must be rechecked after its parent is integrated.
4. **Global operations are not live.** Public “Ask this place” remains OFF. The current AI route is signed-in draft assistance, not a governed global AI discovery system. #359 is a bounded worker/dispatch implementation core, not an always-running service. At the latest read its CodeQL passed and Verify was still running; it lacks the deployed server adapter, persistent scheduler, durable liveness/alerts, cancellation/budget enforcement and non-production rehearsal.

## Current repository state

### Governance and main CI

- Main SHA: 70a3e261b18e3be5e90429e4ad4defd1fd8008c7.
- GitHub reports main as protected. Ruleset 24946178, “living World - protect main,” is active with no bypass actors returned. It requires one approving review, approval of the latest push, dismissal of stale approvals, resolution of review threads, strict required Verify, and non-fast-forward prevention. Classic branch-deletion protection is not independently confirmed; do not claim it is.
- Main Verify passed: [run #40094349108](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40094349108).
- Main CodeQL passed: [run #40094349114](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40094349114).
- The open PR queue contains 99 PRs: 87 drafts and 12 ready for review. Only 11 target the exact current main SHA; the rest target older SHAs or non-main branches. Some stacks are intentional, but each candidate requires exact-base reconciliation before merge. Do not bulk-merge or infer green status from old heads.

### High-priority PRs and exact evidence

| PR | Current evidence | Status and remaining condition |
|---|---|---|
| [#358 — verification-run isolation](https://github.com/mattleask373-rgb/life-lived-network/pull/358) | Verify [#40095367366](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095367366) PASS; CodeQL [#40095367110](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095367110) PASS. Diff against current main is one concurrency-group line. | Ready for independent review; human approval remains required. |
| [#362 — authenticated locality reads and fact-level RLS](https://github.com/mattleask373-rgb/life-lived-network/pull/362) | Verify [#40095183795](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095183795) PASS; CodeQL [#40095183720](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095183720) PASS. Verify includes empty local migration replay, pgTAP, direct PostgREST RLS, database-function lint and k6 parse-only. | P0 security review. Review every sensitive fact policy, effective grants, owner-read paths, exact-place semantics, empty-versus-error behavior, and list → detail → canonical findSupply before approval. |
| [#363 — audited locality membership administration](https://github.com/mattleask373-rgb/life-lived-network/pull/363) | Verify [#40095409897](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095409897) PASS; CodeQL [#40095409761](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095409761) PASS. Includes local migration replay, pgTAP, PostgREST, DB-function lint and k6 parse-only. | P0 security review after #362. Review service-role-only RPC, SECURITY DEFINER owner/search_path/privileges, actor checks, expiry/revoke and atomic audit. No real memberships should be provisioned before owner-authorised rehearsal. |
| [#351 — fail-closed world row reads](https://github.com/mattleask373-rgb/life-lived-network/pull/351) | Verify [#40095450777](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095450777) PASS. | Source-only correctness; review and integrate after #358. Current-head CodeQL was not returned in the latest read. |
| [#360 — truthful hours pagination and completeness](https://github.com/mattleask373-rgb/life-lived-network/pull/360) | Verify [#40095474572](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095474572) PASS. | Stacked on #351. Review in context, then retarget and rerun exact-main checks after #351 merges. |
| [#357 — map/list parity at the 300-pin cap](https://github.com/mattleask373-rgb/life-lived-network/pull/357) | Verify [#40095609892](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095609892) PASS, including regression for off-screen records not consuming the pin cap. | Source-only; human keyboard/mobile/accessibility QA and exact-main recheck remain. |
| [#341 — Life List write integrity](https://github.com/mattleask373-rgb/life-lived-network/pull/341) | Verify [#40095513665](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095513665) PASS. | Review rapid writes, failed saves, account-switch fencing and guest-to-account migration. |
| [#343 — magic-link sign-in](https://github.com/mattleask373-rgb/life-lived-network/pull/343) | Verify [#40095936204](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095936204) PASS; CodeQL [#40095936180](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095936180) PASS. | Review-ready, but production email delivery, canonical Site URL and allowed redirect URLs must be confirmed by the owner before release. |
| [#346 — four-locale discovery foundation](https://github.com/mattleask373-rgb/life-lived-network/pull/346) | Verify [#40095525556](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095525556) PASS. | Partial localization foundation only, not four fully translated experiences or global readiness. |
| [#359 — worker core and idempotent dispatch](https://github.com/mattleask373-rgb/life-lived-network/pull/359) | CodeQL [#40096233948](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40096233948) PASS; Verify [#40096233954](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40096233954) was still in progress at latest read. | Draft; not a running service. Require finished exact-head Verify and independent review of leases, replay/correlation, permissions, budgets, recovery and kill switch. |
| [#361 — 49-package dependency update](https://github.com/mattleask373-rgb/life-lived-network/pull/361) | Verify and CodeQL passed on its own head, but current compare says one commit ahead and 48 commits behind main. | Do not merge stale ancestry. Refresh and recheck, then run targeted UI/runtime regressions for the broad dependency changes. |

Older stacked #352 and #354 were closed as superseded by clean current-main replacements #362 and #363. Neither old PR was merged.

### Published host and SEO reality

The latest available Public SEO Smoke [run #40088907466](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40088907466) ran at 2026-10-24 11:11 UTC against older main SHA 182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f and failed 19 assertions. It reported sitemap XML returning HTTP 404 HTML, missing sitemap/private-path crawler rules, /life-list lacking expected noindex metadata, and canonical/indexability mismatches. The current host/build was not freshly verified, and these results do not establish private-data exposure. Do not weaken the smoke tests; obtain owner-confirmed host/build identity and fresh GET-only proof before any republish or SEO claim.

Gate 0 remains blocked until the owner/admin records the real Lovable Git target and sync branch, canonical HTTPS hostname and deployed build SHA, actual production Supabase project, and a separate disposable Supabase project. A repository-configured project ref is not evidence that it is the live backend. No hosted writes, migrations, production deployment, provider activation or external outreach are authorised by this audit.

## Readiness gates

| Gate | Status | Required closure evidence |
|---|---|---|
| 0. Environment identity | BLOCKED / owner-owned | Lovable repo and protected sync branch; canonical host and deployed build SHA; actual production Supabase project ID; separate disposable project and rollback path. |
| 1. Repository governance | ACTIVE; deletion protection separately unverified | Keep one independent approval, latest-push approval, resolved threads and strict Verify. Verify any branch deletion control separately. |
| 2. Locality privacy | CANDIDATE PASSES LOCAL CI; NOT MERGED / NOT HOSTED-PROVEN | Merge #362 only after independent policy review; then #363 after privilege/audit review. Run final disposable matrix and owner-authorised hosted non-production proof. |
| 3. Data correctness and provenance | PARTIAL | Fail-closed reads, exact counts and hasMore, deterministic pagination, map/list parity, freshness, source lifecycle and revoke behavior. Unknown eligibility cannot masquerade as public supply. |
| 4. Pilot supply and outcomes | NO VERIFIED PILOT EVIDENCE | One named locality, human steward, opt-in participants, rights/provenance and revocation, freshness/lifecycle, safe escalation, request → response → real-world completion measurement and honest denominator/missingness. |
| 5. AI safety and cost | BLOCKED FOR PUBLIC AI | Keep Ask this place OFF. Verify quota deployment, concurrent/replay adversarial tests, provider-side caps/alerts, prompt/output evaluation, locality isolation, kill switch, retention/RLS and human escalation. |
| 6. Continuous operations | IMPLEMENTATION CORE ONLY | Trusted server-only adapter, persistent scheduler/queue, lease/heartbeat fencing, idempotency, retry/dead-letter/recovery, cancellation, run closure, budgets, tested kill switch, alerts, rollback/runbooks and observed non-production soak. |
| 7. Published host, accessibility and growth | BLOCKED / STALE LIVE EVIDENCE | After Gate 0 and authorised republish, fresh GET-only checks for robots, sitemap index and child sitemaps, public/private route parity, canonical/noindex, plus human keyboard/screen-reader/mobile/date-line QA. |

## Ordered PR integration queue

This is an order for human review and merge consideration, not automated merge authorisation. After each merge, refresh descendants and rerun exact-head checks. A green parent does not guarantee a green child.

1. **#358 — CI concurrency isolation.** Tiny diff, current Verify and CodeQL pass; merge only after required human approval.
2. **#362 — verified locality fact policies and authenticated readers.** P0 security slice. Review each sensitive fact table, effective policies/grants, owner-read paths, exact-place membership semantics, error-versus-empty states, and list → detail → findSupply before approval.
3. **#363 — audited membership administration.** Only after #362's approved final head. Review server-only service role, SECURITY DEFINER owner/search_path/grants, actor authorization, no self-approval, atomic audit, expiry/renewal and revocation.
4. **#351 — fail-closed world reads.** After #358 is integrated, refresh and run exact-main checks.
5. **#360 — truthful hours pagination.** After #351; retarget from stack to canonical main and rerun. The shared page contract now requires explicit hasMore evidence.
6. **#357 — map/list parity.** Recheck on canonical main; verify pin-cap disclosure, show-all behavior, viewport merge and keyboard/mobile usability.
7. **#341 — Life List write integrity.** Review rapid toggles, failed writes, account switches, guest merge and confirmed-state UI.
8. **#345 — need freshness/lifecycle.** Refresh onto current main and run migration/pgTAP/RLS evidence. Review together with #362 so freshness rules cannot reintroduce public/direct-read bypasses.
9. **#340 — concurrent AI quota proof.** Refresh onto current main and prove the quota migration and concurrency suite actually run on a disposable DB. Keep public AI off.
10. **#349 — per-attempt AI cost bounds.** Review after quota evidence; owner separately configures provider billing caps/alerts and tests the kill switch.
11. **#343 — magic-link sign-in.** Source Verify/CodeQL pass; release only after owner confirms hosted email delivery, Site URL and allowed redirects.
12. **#347 — privacy-minimised outcome contract, followed by a separate instrumentation PR.** The current candidate defines events; it does not instrument a sink. Review privacy/RLS/retention before data collection.
13. **#335 and #355 — sitemap/robots/private-route parity.** Reconcile onto current main, preserve fail-closed completeness, confirm Gate 0 and obtain fresh host evidence before authorised republish.
14. **#346 — localization foundation.** Complete target-market forms, messages, safety/legal copy, dates/currencies/time zones, accessibility and screen-reader checks; do not call it global localization.
15. **#359 — worker core/dispatch.** Require finished exact-head Verify and independent security review. Then a separate adapter/scheduler/operations PR can be scoped after Gate 0 confirms an isolated non-production environment.
16. **New operations PRs after Gate 0:** persistent scheduler/lease recovery, server-only adapter, heartbeat/alerts, budget caps, kill switch, dead-letter/recovery, run closure, rollback rehearsal, backup/restore and observed soak. No production secrets or unattended production writes during preparatory work.
17. **Pilot readiness (not code-only):** one locality, steward, verified rights-cleared supply, participant consent, freshness/lifecycle, safe human escalation, and measured request → response → real outcome.
18. **Only after a measured pilot:** independent go/no-go for a second locality and then one market at a time. Proposed countries and places remain hypotheses until supply, stewardship and rights evidence exists.

## Non-negotiable boundary

No public AI activation, mass seeding, global marketing claims, hosted schema/RLS changes, deployment, paid acquisition or production worker activation follows from this report or from green source tests. Main can pass while the published site is stale; local RLS tests can pass while hosted grants remain unknown; a worker core can compile while no continuous worker exists. Keep these evidence classes separate.