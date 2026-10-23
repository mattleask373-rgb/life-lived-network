# Independent repository audit and merge queue — 2026-10-23

## Scope and evidence boundary

- Repository: `mattleask373-rgb/life-lived-network` (Real World Atlas).
- Audited current `main`: `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`.
- Initial GitHub inventory had 82 open PRs. After closing the superseded #337 and adding the audit/concurrency PRs, the latest refresh shows **84 open PRs**: **5** have an exact base SHA matching current `main` (#335, #336, #338, #339, #340), while **79** remain based on an older main SHA or another PR branch and require rebase/port and fresh checks before merge.
- Main protection ruleset ID `24946178` was read live as **active**. It requires one approving review, latest-push approval, resolved review threads, strict required checks, and the exact `verify` status check; no bypass actors were listed. The branch-protection endpoint itself returned 403, so this is a ruleset read, not a full branch-protection API audit.
- This is an evidence-backed current-main/PR metadata audit plus focused code review of high-risk SEO, worker, quota, auth, need-lifecycle and life-list areas. It is **not** a line-by-line security audit of every historical commit, every PR diff, all external repositories, hosted database state, provider contracts or production infrastructure.

## Executive verdict

**Not ready for global launch or a claim of 24/7 autonomous operation.** Source has meaningful foundations, and several important changes are merged, but the deployed site demonstrably diverges from the source tree, the PR queue is heavily stale, hosted database/security proof is incomplete, paid-AI protections are not fully operationally proven, and no real market liquidity/retention/unit economics or billion-user capacity evidence exists.

### Current blockers with direct evidence

1. **Published SEO smoke fails.** [Run #39948523188](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39948523188) against `https://life-lived-network.lovable.app` found 19 failures: `/sitemap.xml` returned HTTP 404 HTML, static `robots.txt` lacked the expected sitemap/private route directives, `/life-list` lacked visible noindex metadata, and homepage canonical/indexability checks failed. Source on current `main` contains these route implementations and static policies. This indicates source/build/hosting mismatch until proven otherwise; it does not itself prove a cross-account data leak. **Do not weaken smoke checks.**
2. **The owner-confirmed deployment target is unresolved.** Lovable's actual Git sync repository/branch, deployed build SHA, intended public hostname and Supabase project/environment must be confirmed before any deployment or hosted write. A merge alone cannot be claimed to fix the published site.
3. **The PR queue is not merge-ready as a whole.** 79/82 open PRs have stale base SHAs or target another PR branch. Many are old agent proposals and should be reconciled, not bulk-merged. Current branch protection requires a human approval and exact `verify`.
4. **Supabase Preview is often skipped.** Skipped means not run, not passed. Current-main CI runs lint, tests, build, high/critical dependency audit and k6 syntax inspection; DB migration replay/security tests run only when the workflow detects migration/config/test changes. Hosted RLS/grants and real project identity are not proven by this.
5. **AI worker runtime is a core, not a running fleet.** PR #336 is an isolated, injected, opt-in worker-cycle implementation and its unit/CI checks pass. It is not wired to a trusted live adapter, durable scheduler, provider credentials, operational dashboard or verified staging environment. Daily automations and read-only probes do not establish a continuous 24/7 executor.
6. **AI drafting has a merged kill switch and a proposed durable quota implementation, not complete abuse/cost control.** Current `main` includes `DRAFT_ASSIST_DISABLED`, `consume_ai_draft_quota()`, per-account 5/hour and 20/day limits, and a private aggregate counter table. The quota migration/runbook explicitly says it is not applied to an environment and still requires named disposable-project replay, adversarial concurrent/replay tests, provider-side spend caps/alerts, and independent SECURITY DEFINER/RLS review. The current server-function result is a typed rate-limit result, not a guaranteed HTTP 429 response. See issue [#290](https://github.com/mattleask373-rgb/life-lived-network/issues/290).
7. **No live licensed supply or market proof.** Ticketmaster fixture/adapter work is not a fully live licensed event directory. Work-provider integrations and rights-cleared inventory are not verified as activated. There is no evidence of a completed, consented provider → enquiry → response → completion loop at launch scale.
8. **Global scale is a target, not a verified property.** No production traffic, load/soak, regional resilience, backup/restore, cost envelope, SLO, support capacity or billion-request evidence is claimed.

## Merged work verified on current GitHub

The following PR records are closed as merged; their code/doc presence on current main is distinct from proof of production rollout:

- [#291](https://github.com/mattleask373-rgb/life-lived-network/pull/291): locality scope, private/date-line views and related hardening.
- [#294](https://github.com/mattleask373-rgb/life-lived-network/pull/294): prior status/year-plan reconciliation (its old status snapshot is now stale).
- [#297](https://github.com/mattleask373-rgb/life-lived-network/pull/297): least-privilege ACL **proposal documentation only**, not a hosted ACL change.
- [#289](https://github.com/mattleask373-rgb/life-lived-network/pull/289): AI draft input validation; not a quota by itself.
- [#302](https://github.com/mattleask373-rgb/life-lived-network/pull/302): bounded retrieval acceptance contract; not retrieval implementation.
- [#304](https://github.com/mattleask373-rgb/life-lived-network/pull/304): bounded wide-area opportunity retrieval; checks passed as recorded, but candidate coverage is bounded rather than exhaustive and manual accessibility/mobile/date-line QA remains.
- [#299](https://github.com/mattleask373-rgb/life-lived-network/pull/299): agent control-plane migration-lineage reconciliation was merged. This does not by itself prove that the intended hosted project has the migrations applied or that hosted grants/RLS match the repo.

## Focused review findings and patches made in this audit

### PR #335 — sitemap completeness and work-opportunity parity

- [Draft PR #335](https://github.com/mattleask373-rgb/life-lived-network/pull/335) now contains exact-count/bounded-page consistency checks, explicit public-eligibility requirements, fail-closed behavior for incomplete scans, and regression tests for truncation, missing/duplicate IDs and caps.
- During this audit, the work-opportunity sitemap fix from overlapping draft #337 was ported into #335. The sitemap previously accepted only `isService(entry)` even though the service page supports `isService(entry) || hasPublicWorkOpportunity(entry)`. The consolidated branch now reuses `hasPublicWorkOpportunity()` and includes a reviewed, rights-cleared seasonal hospitality regression fixture.
- Exact-head Verify passed on `50d59ac6c17f6a4bede54d2e75ec8ff5ebd6e7be`: [run #39949468555](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39949468555). CodeQL and locked dependency audit passed: [run #39949468587](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39949468587).
- Supabase Preview was skipped. The PR remains draft pending independent code/security review of count semantics, public row eligibility and source lifecycle behavior; no hosted or deployed proof.
- The duplicate PR #337 was closed unmerged after the unique patch and test were ported into #335.

### PR #338 — year plan

- [Draft PR #338](https://github.com/mattleask373-rgb/life-lived-network/pull/338) replaces calendar-month milestones with a rolling, dependency-gated programme without calendar deadlines or time-triggered launches.
- Exact-head Verify, CodeQL and dependency audit passed on `b6731187b4e9716dca19564a01d080db9bfc04cf`: [Verify #39949100372](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39949100372) and [CodeQL #39949100296](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39949100296). Supabase Preview skipped. Draft pending review.

### PR #340 — concurrent AI quota integration test

- [Draft PR #340](https://github.com/mattleask373-rgb/life-lived-network/pull/340) adds a local Supabase integration harness that fires 25 simultaneous authenticated transactions through separate database connections and asserts exactly 5 allowed, 15 hourly-denied and 5 daily-denied outcomes. It uses a synthetic account and cleans it up; it records no prompts or secrets.
- The existing Verify workflow now detects changes to this harness, replays the full migration chain against an empty local Supabase DB, runs SQL security tests and database lint, then runs the concurrency probe.
- Exact-head Verify passed on `8acd4101659afdb859d97305d9e5dab594cce075`: [run #39950530938](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39950530938). CodeQL passed: [run #39950531025](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39950531025).
- This closes the missing *local concurrent-test harness* slice if merged. It does not prove hosted DB state, provider spend caps/alerts, per-IP controls or HTTP-level 429 semantics. Draft pending independent review.

### PR #336 — bounded worker runtime core

- [Draft PR #336](https://github.com/mattleask373-rgb/life-lived-network/pull/336) adds a provider-neutral, opt-in worker-cycle core with fresh proof gates, authoritative task scope, atomic dispatch adapter contract, lease fencing, heartbeat, bounded timeout, output scrubbing and no accept/merge/deploy result states.
- Exact-head Verify, CodeQL and locked dependency audit passed on `e440b149c609af0c3dd5ad20c4f1ee5430cce6bd`: [Verify #39931954467](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39931954467) and [CodeQL #39931954356](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39931954356).
- Supabase Preview skipped. Do not call this a live worker. It still needs an independently reviewed adapter to the canonical RPC/table contracts, dispatch replay/idempotency proof, disposable/staging execution, durable scheduling/recovery, alerts and an operator pause/resume path.

### Other PRs checked

- **#305:** already merged on 2026-10-22; its emergency-stop change is present on current main. It is not the missing durable quota/spend-control work.
- **#330:** owner lifecycle/freshness work changes a migration and SQL security tests; despite old passing checks, its base is stale. Rebase/port, replay the complete migration chain on a named disposable DB and independently review grants/RLS before considering merge.
- **#326:** life-list confirmed-state write-integrity fix; base stale. Rebase and re-run exact-head checks, then review the account-write failure path and UX before merge.
- **#327:** magic-link auth; base stale and requires route/redirect/session review plus provider/configuration and end-to-end auth checks before release.
- **#328:** initial locale foundation; base stale. Review language routing, persistence, fallback and accessibility; do not add hreflang until genuine localized routes/content exist.
- **#323:** privacy-safe funnel/need lifecycle measurement contract; base stale. Rebase and verify event payload minimization, consent/retention and no prompt/PII leakage before merging.
- **#235:** generated preview auth storage helper; base stale. Security-sensitive; rebase and review storage scope/expiry/origin isolation before merge.
- **#265–#268:** dependency updates; base stale. Rebase and evaluate individually or in a tested compatible group. Do not accept a 50-package update merely because a combined build passes.
- **#270/#283 and many earlier agent branches:** stale-base governance/control-plane work. Port only unique, still-needed changes; do not bulk merge sequential historical control-plane PRs. Reconcile against merged #299 and current migrations first.

## Ordered merge queue

**Nothing below is automatically mergeable just because CI is green.** The main ruleset requires one approving review, latest-push approval, resolved review threads and `verify`. Draft status must be removed only after the reviewer confirms the change is ready.

| Order | PR / action | Merge gate |
|---|---|---|
| **0** | Owner/admin release identity gate (not a PR) | Confirm canonical Git sync repo + non-main branch, production hostname/deployed SHA, Supabase project/environment, and rollback owner. Do not deploy or apply hosted migrations yet. |
| **1** | [#335 — fail-closed sitemap scans](https://github.com/mattleask373-rgb/life-lived-network/pull/335) | First code candidate after independent review of exact-count and public-eligibility logic. Verify passed; CodeQL/dependency audit passed; Supabase Preview skipped. Then mark ready, resolve comments and merge using the protected process. |
| **2** | [#340 — concurrent AI quota test](https://github.com/mattleask373-rgb/life-lived-network/pull/340) | Verify/CodeQL pass; full local migration replay, SQL security tests, DB lint and 25-request concurrent quota test passed. Merge after independent review of test isolation and workflow conditions; no hosted changes. |
| **3** | [#338 — no-calendar rolling year plan](https://github.com/mattleask373-rgb/life-lived-network/pull/338) | Documentation-only; Verify/CodeQL/dependency audit passed. Merge after independent content review. #335/#340/#338 can be reviewed in parallel because their scopes are independent. |
| **4** | [#339 — independent audit/merge queue](https://github.com/mattleask373-rgb/life-lived-network/pull/339) | Documentation-only; exact-head Verify passed [run #39951070308](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39951070308), CodeQL passed [run #39951070414](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39951070414), and locked dependency audit passed. Merge after factual review. |
| **5** | [#336 — bounded worker runtime core](https://github.com/mattleask373-rgb/life-lived-network/pull/336) | Independent security review of lease loss, timeout, cancellation, output/path validation and dispatch idempotency. Merge only as a disabled pure core; never describe it as an operating fleet. |
| **4** | [#326 — life-list write integrity](https://github.com/mattleask373-rgb/life-lived-network/pull/326) | Rebase/port onto current main, exact-head checks, review failed account-write behavior and regression tests. Prioritize user-data integrity. |
| **5** | [#330 — need lifecycle/freshness](https://github.com/mattleask373-rgb/life-lived-network/pull/330) | Rebase/port; replay the full migration chain in a named disposable DB; verify RLS/grants/rollback and SQL tests; independent database review. No hosted apply. |
| **6** | [#323 — privacy-safe measurement](https://github.com/mattleask373-rgb/life-lived-network/pull/323) | Rebase and audit event schemas for minimization, consent, retention and user/prompt identifiers; then exact-head checks and review. |
| **7** | [#327 — magic-link auth](https://github.com/mattleask373-rgb/life-lived-network/pull/327) | Rebase; review redirect allowlist, session lifecycle, email provider configuration, abuse protection and end-to-end auth. Owner must configure provider before release. |
| **8** | [#328 — locale foundation](https://github.com/mattleask373-rgb/life-lived-network/pull/328) | Rebase; review route/copy/fallback/persistence/accessibility. Merge as infrastructure only; localized content, market/legal review and hreflang are separate gates. |
| **9** | [#235 — preview auth storage](https://github.com/mattleask373-rgb/life-lived-network/pull/235) | Rebase and security review of origin isolation, expiry, token handling and generated-code compatibility. Merge only if unique changes remain after comparison with main. |
| **10** | [#265–#268 — dependencies](https://github.com/mattleask373-rgb/life-lived-network/pulls) | Rebase; inspect release notes/major-version changes and run full checks. Prefer small compatible groups; separate unrelated dependency majors. |
| **11** | Remaining stale PRs | Inventory by topic, diff against current main, preserve unique fixes, close true duplicates, rebase current work and re-run checks. For chained agent PRs, rebuild one canonical branch from current main rather than merge a historical chain wholesale. |
| **Blocked** | Issue [#290](https://github.com/mattleask373-rgb/life-lived-network/issues/290) — durable AI quota/cost controls | Quota source exists on main, but concurrency/replay tests, disposable DB replay, provider-side budget alerts and confirmed rollout are still required. Build and verify these before enabling paid AI broadly. |
| **Blocked** | Live SEO recovery [#263](https://github.com/mattleask373-rgb/life-lived-network/issues/263) | Requires owner-confirmed host/build/sync target and a human-authorized deploy. Keep the smoke failing until published GET checks pass; do not edit crawler assertions to hide the mismatch. |
| **Blocked** | Agent runtime issue [#121](https://github.com/mattleask373-rgb/life-lived-network/issues/121) | Requires adapter, durable scheduler, heartbeat/recovery tests, disposable/staging proof, dashboard/alerts and kill switch. No 24/7 claim before that evidence exists. |
| **Blocked** | Hosted control-plane/security migrations | Confirm target project, clean replay, effective RLS/grants/default privileges and rollback in disposable/staging first. Never infer hosted state from repository migrations. |

## Next development phase after the first merge candidates

1. Resolve source-of-truth and release identity; keep all changes on protected PR branches.
2. Merge/review #335 and make the published SEO smoke pass through the authorized deployment path.
3. Complete durable quota adversarial tests, real HTTP rate-limit semantics where required, provider budget caps/alerts and a tested kill switch.
4. Integrate the bounded worker core with the canonical control-plane adapter only after replay/idempotency review; prove scheduled heartbeat/recovery in isolated staging.
5. Rebase/triage the high-risk stale PRs; remove duplicate branches and produce a small dependency graph.
6. Complete one real, rights-cleared local supply → enquiry → response → completion loop with support/reporting.
7. Instrument qualified actions, fulfilment, retention, freshness, abuse, unit costs and support burden.
8. Only then add/expand localization, events/tours/work provider integrations and community/social surfaces. Every feed needs rights, provenance, freshness, opt-in/publication gates and clear terms.
9. Load/soak, backup/restore, accessibility, security and regional resilience testing before any scale claim.

## Cross-repository audit — connected portfolio

The connected GitHub account exposes ten repositories relevant by name or purpose. This pass checked each repository's default branch, recent commits, open PRs and recursive file tree; detailed code review is limited to the canonical app repository and the one substantive orchestration PR.

| Repository | Live finding | Disposition |
|---|---|---|
| [life-lived-network](https://github.com/mattleask373-rgb/life-lived-network) | Current active app, 82 open PRs at audit start; only #335/#336/#338 were exact-current-main candidates. | **Canonical app for this audit**, pending owner confirmation of the deployed Git sync target. |
| [life-lived-network2](https://github.com/mattleask373-rgb/life-lived-network2) | Public, 291 tree entries and a full older app/documentation snapshot, but only one initial commit on 9 Oct 2026, no open PRs and no subsequent updates found. | Treat as a **stale parallel copy/reference**, not a second development target, until owner confirms otherwise. Compare unique data/code before archiving or making read-only; do not copy new changes there by default. |
| [mattleask373-rgb-life-lived-network](https://github.com/mattleask373-rgb/mattleask373-rgb-life-lived-network) | Public repository with only a README, zero-size source tree, one initial commit and no open PRs. | Empty placeholder; not a deployable app. |
| [real-world-atlas-agent-orchestration](https://github.com/mattleask373-rgb/real-world-atlas-agent-orchestration) | Main contains only README; one open draft PR #1 adds 15 documentation/research files, no CI/checks and no application runtime. | Research/operating-model proposal only. It is **not** a working autonomous factory. Review duplicate/conflicting operating docs and calendar-based rollout language before any merge or installation. |
| [real-world-atlas-marketing](https://github.com/mattleask373-rgb/real-world-atlas-marketing) | Main contains only README; no open PRs or implementation files. | Empty strategy placeholder; no functioning marketing automation or campaign system. |
| [real-world-atlas-monetization](https://github.com/mattleask373-rgb/real-world-atlas-monetization) | Main contains only README; no open PRs or implementation files. | Empty strategy placeholder; no implemented billing, entitlements, pricing experiments or payment integration. |
| [real-world-atlas-compliance](https://github.com/mattleask373-rgb/real-world-atlas-compliance) | Main contains only README; no open PRs or implementation files. | Empty strategy placeholder; no implemented compliance, moderation, privacy or safety service. |
| [world-s-finder](https://github.com/mattleask373-rgb/world-s-finder) | Public, one README and one initial commit, no app files or open PRs. | Empty placeholder. |
| [World-Finder](https://github.com/mattleask373-rgb/World-Finder) | Private repository; GitHub reports the repository is empty and no commits can be listed. | Empty private placeholder; no implementation audited. |
| [Grok-redesign-app](https://github.com/mattleask373-rgb/Grok-redesign-app) | GitHub reports an empty repository/no commits; no application tree available. | Empty placeholder; no implementation audited. |

### Orchestration PR #1 — do not confuse strategy with runtime

[PR #1 in the orchestration repository](https://github.com/mattleask373-rgb/real-world-atlas-agent-orchestration/pull/1) proposes an AI-factory operating model, revenue experiments, open-source tool registry and research documents. Its 15 changed files are documentation/research only; the PR explicitly says no tests or CI were run. It is draft, has no check runs, and has no executable scheduler/provider/agent code on its target branch. It should not be counted as a delivered 24/7 system, revenue stream, installed toolbox or validated marketing channel. Before merging, reconcile its 30-day rollout/business portfolio documents with the canonical app's dependency-gated, no-calendar-deadline plan and obtain explicit owner approval for any installation, budget or external outreach.

### Portfolio-wide conclusion

Only `life-lived-network` currently has the live app source and required CI/review mechanics. The related repositories are a stale copy, empty placeholders or documentation-only proposals. The next useful action is to consolidate their unique research into the canonical programme after review, not to spread application code across empty repositories. Owner confirmation is required before archiving, privatizing, deleting or changing the intended authority of any repository.

## Human-only gates to leave until implementation is ready

- Confirm repository sync target, production hostname, deployed SHA and Supabase project/environment.
- Approve production deployment/rollback, hosted migrations/RLS/grants, secret changes and provider activation.
- Independent review of security-sensitive code and required main approvals.
- Configure provider spend caps/alerts, email/domain/payment settings and budget.
- Legal review of work eligibility, employment/cleaning rules, data rights, privacy, terms and market-specific obligations.
- Recruit consented providers/users, select pilot market, approve outbound outreach/paid spend and make launch/scale decisions.

**No calendar deadlines are used in the development plan.** Phases advance only when their evidence gates pass. A skipped test, draft PR, agent claim, schedule or source file is not proof of production readiness.
