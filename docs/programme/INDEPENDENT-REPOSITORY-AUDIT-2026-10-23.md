# Independent repository audit and merge queue — 2026-10-23

## Scope and evidence boundary

- Repository: `mattleask373-rgb/life-lived-network` (Real World Atlas).
- Audited current `main`: `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`.
- Latest GitHub refresh: **85 open PRs**. **9** have an exact base SHA matching current `main` (#335, #336, #338, #339, #340, #341, #343, #344, #345); **76** are based on an older main SHA or another PR branch and require rebase/port and fresh checks before merge. Stale duplicates #235, #326, #327, #330, #337 and #342 were closed unmerged after stronger/current-main ports or security regressions were confirmed.
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

### PR #335 — sitemap completeness and live verification

- [PR #335](https://github.com/mattleask373-rgb/life-lived-network/pull/335) contains exact-count/bounded-page consistency checks, explicit public-eligibility requirements, fail-closed behavior for incomplete scans, and regression tests for truncation, missing/duplicate IDs and caps.
- During this audit, the work-opportunity sitemap fix from overlapping #337 was ported into #335. Sitemap enumeration previously accepted only `isService(entry)` even though the service page supports `isService(entry) || hasPublicWorkOpportunity(entry)`. The consolidated branch reuses `hasPublicWorkOpportunity()` and includes a reviewed, rights-cleared seasonal hospitality regression fixture. Duplicate #337 was closed unmerged after its unique patch/test was ported.
- The branch also wires the existing `SEO_SMOKE_ORIGIN` option through the scheduled GitHub workflow using the optional repository variable of the same name, with a regression test. This lets the owner select the confirmed canonical HTTPS host; the variable is not set by this PR and the live host/build mismatch remains. The static `public/robots.txt` and `public/sitemap.xml` currently name the Lovable origin, so any different canonical host must be reflected in those static assets/build output as well.
- Latest head: `a0dfa21e5afec001895c4d89e7879917e84a249c`. Exact-head Verify passed: [run #39956288886](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39956288886). CodeQL and locked dependency audit passed: [run #39956288556](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39956288556).
- Supabase Preview skipped. Ready for independent code/security review of count semantics, public row eligibility and source lifecycle behavior; no hosted or deployed proof.

### PR #338 — year plan

- [PR #338](https://github.com/mattleask373-rgb/life-lived-network/pull/338) replaces calendar-month milestones with a rolling, dependency-gated programme without calendar deadlines or time-triggered launches.
- Exact-head Verify, CodeQL and dependency audit passed on `b6731187b4e9716dca19564a01d080db9bfc04cf`: [Verify #39949100372](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39949100372) and [CodeQL #39949100296](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39949100296). Supabase Preview skipped. Ready for independent content review.

### PR #340 — concurrent AI quota integration test

- [PR #340](https://github.com/mattleask373-rgb/life-lived-network/pull/340) adds a local Supabase integration harness that fires 25 simultaneous authenticated transactions through separate database connections and asserts exactly 5 allowed, 15 hourly-denied and 5 daily-denied outcomes. It uses a synthetic account and cleans it up; it records no prompts or secrets.
- Verify now detects changes to this harness, replays the full migration chain against an empty local Supabase DB, runs SQL security tests and database lint, then runs the concurrency probe.
- Exact-head Verify passed on `8acd4101659afdb859d97305d9e5dab594cce075`: [run #39950530938](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39950530938). CodeQL passed: [run #39950531025](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39950531025).
- This closes the missing *local concurrent-test harness* slice if merged. It does not prove hosted DB state, provider spend caps/alerts, per-IP controls or HTTP-level 429 semantics. Ready for independent review.

### PR #341 — Life List persistence/write integrity

- [PR #341](https://github.com/mattleask373-rgb/life-lived-network/pull/341) is a focused port of the unique fix from stale #326 onto current `main`; #326 is closed unmerged.
- It serializes toggles/category changes, awaits signed-in database writes before confirming UI state, fences queued operations to the current account, keeps guest data until merge plus account read both succeed, and surfaces failures to the user.
- Exact-head Verify passed: [run #39954304637](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39954304637); CodeQL/dependency audit passed: [run #39954304533](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39954304533). Supabase Preview skipped.
- Ready for independent code review. No schema or hosted change.

### PR #343 — existing-account email magic link

- [PR #343](https://github.com/mattleask373-rgb/life-lived-network/pull/343) ports the passwordless sign-in path from stale #327 onto current `main`; #327 is closed unmerged.
- The flow uses `signInWithOtp` with `shouldCreateUser: false`, keeps signup/password/Google/recovery, and adds tests for mode and password-field behavior.
- Exact-head Verify passed: [run #39954597408](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39954597408); CodeQL/dependency audit passed: [run #39954597393](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39954597393). Supabase Preview skipped.
- Ready for independent auth review. Email delivery, site URL, and redirect allowlist are owner-controlled release gates.

### PR #344 — durable agent dispatch idempotency

- [PR #344](https://github.com/mattleask373-rgb/life-lived-network/pull/344) adds an additive migration setting a default for attempt UUIDs, moving correlation lookup before READY-only gating, checking full dispatch scope, and returning an existing lease only when it is still active, unexpired and exactly fenced to the task.
- The pgTAP test covers first dispatch, identical replay with no duplicate side effects, cross-task/run correlation collision, and lease-token/generation stability.
- Exact-head Verify passed with empty local Supabase migration replay, SQL security tests, and DB lint: [run #39955483232](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39955483232). CodeQL passed: [run #39955483178](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39955483178). Supabase Preview skipped.
- Ready for independent database/security review; not a live executor.

### PR #345 — Need freshness and lifecycle

- [PR #345](https://github.com/mattleask373-rgb/life-lived-network/pull/345) ports stale #330 onto current `main`, closes #330, and preserves current-main changes in `needs.functions.ts`. Current head `6e105d7a0dd33121ed9ef928b0469c8d87f4739a`.
- Open discovery now checks status, visibility, 30-day reconfirmation freshness and any stated expiry/end time. Owner actions are scoped and SQL trigger rules prevent reopening and reconfirming expired time windows. The bounded opportunity reader receives aligned freshness gates.
- Exact-head Verify passed including lint, tests, build, full empty local Supabase migration replay, SQL authorization tests and DB lint: [run #39956179268](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39956179268). CodeQL/dependency audit passed: [run #39956179170](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39956179170).
- **Still draft/blocked:** the base RLS policy makes `local_discovery` rows directly readable by anonymous table queries. The server's locality filter is not a DB-enforced access boundary. An independent reviewer must decide if this visibility is only a discovery/UI preference or implement a scoped RPC/permissions model before describing it as private. No hosted DB changes.

### PR #336 — bounded worker runtime core

- [PR #336](https://github.com/mattleask373-rgb/life-lived-network/pull/336) adds a provider-neutral, opt-in worker-cycle core with fresh proof gates, authoritative task scope, atomic dispatch adapter contract, lease fencing, heartbeat, bounded timeout, output scrubbing and no accept/merge/deploy result states.
- Independent review found a lease-expiry edge: the runtime previously accepted a lease that could expire before the first heartbeat. The latest head `c7f2f7ad8b1de59a3d905ffce1742ffaad8882d5` now requires the lease to remain valid for at least one heartbeat interval plus a 1-second margin, tests that the provider is not invoked for a too-short lease, and documents the adapter requirement.
- Exact-head Verify passed: [run #39952238588](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39952238588). CodeQL/dependency audit passed: [run #39952238590](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39952238590).
- Supabase Preview skipped. Ready for independent security review. It is not a live worker; adapter, durable scheduler/recovery, staging proof, alerts and operator pause/resume remain.

### Other PRs checked

- **#305:** already merged on 2026-10-22; its emergency-stop change is present on current main. It is not the missing durable quota/spend-control work.
- **#330:** owner lifecycle/freshness work changes a migration and SQL security tests; despite old passing checks, its base is stale. Rebase/port, replay the complete migration chain on a named disposable DB and independently review grants/RLS before considering merge.
- **#326:** life-list confirmed-state write-integrity fix; base stale. Rebase and re-run exact-head checks, then review the account-write failure path and UX before merge.
- **#327:** magic-link auth; base stale and requires route/redirect/session review plus provider/configuration and end-to-end auth checks before release.
- **#328:** initial locale foundation; base stale. Review language routing, persistence, fallback and accessibility; do not add hreflang until genuine localized routes/content exist.
- **#323:** privacy-safe funnel/need lifecycle measurement contract; base stale. Rebase and verify event payload minimization, consent/retention and no prompt/PII leakage before merging.
- **#235:** closed unmerged after the audit found it should not be merged as-is. Current main already has a stronger preview auth storage implementation and tests for exact request ID, boolean reply validation, exception-safe storage, and `event.source === parentWindow`. The stale PR's helper lacks the WindowProxy source check and exception-safe broker fallback, and it mixes a stale plan rewrite with unrelated map/date typing changes. Its two small map/date typing changes were not shown to be necessary; if desired, reintroduce them in a focused PR.
- **#265–#268:** dependency updates; base stale. Rebase and evaluate individually or in a tested compatible group. Do not accept a 50-package update merely because a combined build passes.
- **#270/#283 and many earlier agent branches:** stale-base governance/control-plane work. Port only unique, still-needed changes; do not bulk merge sequential historical control-plane PRs. Reconcile against merged #299 and current migrations first.

## Ordered merge queue

**CI-green does not mean merge-approved.** The active main ruleset requires one approving review, latest-push approval, resolved review threads, strict status checks and the exact `verify` check. The current-main PRs below have no submitted approving reviews in the audit snapshot. #345 stays draft because its RLS semantics need a security decision.

| Order | PR / action | Merge gate |
|---|---|---|
| **0** | Owner/admin release identity gate (not a PR) | Confirm canonical Git sync repository/branch, production hostname/deployed SHA, Supabase project/environment, rollback owner and whether staging is isolated. No hosted writes or deployment yet. |
| **1** | [#335 — sitemap completeness and SEO smoke config](https://github.com/mattleask373-rgb/life-lived-network/pull/335) | Latest Verify/CodeQL/dependency audit passed on `a0dfa21e5afec001895c4d89e7879917e84a249c`; Supabase Preview skipped. Review fail-closed count semantics, real work opportunity eligibility, canonical origin wiring. After approval, set the owner-confirmed `SEO_SMOKE_ORIGIN` and validate published host; merging alone will not fix host/build mismatch. |
| **2** | [#341 — Life List write integrity](https://github.com/mattleask373-rgb/life-lived-network/pull/341) | Verify/CodeQL/dependency audit passed; independent review of account identity fencing, local-to-account merge order and failed-write UX. User-data integrity priority. |
| **3** | [#340 — concurrent AI quota test](https://github.com/mattleask373-rgb/life-lived-network/pull/340) | Verify/CodeQL passed; full local migration replay and 25-transaction quota concurrency test passed. Review synthetic-account cleanup and migration-gated workflow condition. No hosted changes. |
| **4** | [#344 — dispatch idempotency migration](https://github.com/mattleask373-rgb/life-lived-network/pull/344) | Verify/CodeQL passed with complete local DB replay, SQL security tests and DB lint. Independently inspect function signature/grants, attempt UUID default, correlation uniqueness, lock order and adapter callers before merge. |
| **5** | [#338 — rolling year plan](https://github.com/mattleask373-rgb/life-lived-network/pull/338) | Docs-only; Verify/CodeQL/dependency audit passed. Merge after factual review. Independent of code slices. |
| **6** | [#339 — repository audit and refreshed status](https://github.com/mattleask373-rgb/life-lived-network/pull/339) | Docs-only. Exact-head Verify, CodeQL and dependency audit must pass on latest head `530dc207e16e45022b8bf53de817de55e831fc5f` after the refreshed status snapshot; current Verify/CodeQL were running during this audit. Merge after factual review. |
| **7** | [#336 — worker runtime core](https://github.com/mattleask373-rgb/life-lived-network/pull/336) | Verify/CodeQL passed after minimum-lease-lifetime fix. Merge only after independent security review and only as an opt-in pure core. Do not enable/advertise a 24/7 worker without an adapter, scheduler, recovery, alerts and staging evidence. |
| **8** | [#343 — magic-link auth](https://github.com/mattleask373-rgb/life-lived-network/pull/343) | Verify/CodeQL passed. Independent auth/redirect review; owner must configure/test email provider delivery and redirect allowlist before release. |
| **Blocked** | [#345 — need freshness/lifecycle](https://github.com/mattleask373-rgb/life-lived-network/pull/345) | Unit/DB tests and CodeQL passed. Keep draft until `local_discovery` semantics are explicit and the current direct anonymous read policy is either accepted as public discovery or corrected through a scoped RPC/permissions change with regression tests. |
| **Next** | [#326/#327/#330/#235/#337/#342] closed stale/duplicate PRs | Do not reopen. Unique Life List, magic-link, needs freshness and work-sitemap changes were ported; preview-auth helper was closed because it regressed a source-origin security check. |
| **Next** | #323, #328, #265–#268 and remaining stale PRs | Review each patch against current `main`, port only unique and still-needed work to a fresh branch, run exact-head CI, close duplicates. Never merge the historical PR chain wholesale. |
| **Blocked** | Issue [#290](https://github.com/mattleask373-rgb/life-lived-network/issues/290) — paid AI abuse/cost controls | #340 supplies local concurrency proof. Still missing per-network/account-creation abuse controls, provider hard budget cap/alert delivery, tested emergency-stop propagation and HTTP 429 semantics if required. |
| **Blocked** | Live SEO issue [#263](https://github.com/mattleask373-rgb/life-lived-network/issues/263) | Published smoke currently fails. Requires owner-confirmed target/build and authorized deployment; never weaken smoke assertions. |
| **Blocked** | Agent runtime issue [#121](https://github.com/mattleask373-rgb/life-lived-network/issues/121) | Need canonical DB adapter, durable scheduler, heartbeat/stale recovery, cancellation, observability/alerts and isolated staging acceptance evidence. |
| **Blocked** | Hosted control-plane migrations | Confirm target project, clean replay, effective RLS/grants/default privileges, rollback and independent security review. Repository merge is not deployment proof. |

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

- Confirm repository sync target, production hostname, deployed SHA and Supabase project/environment; if the canonical hostname differs from Lovable, align `SEO_SMOKE_ORIGIN`, static robots/sitemap assets and build origin configuration together.
- Approve production deployment/rollback, hosted migrations/RLS/grants, secret changes and provider activation.
- Independent review of security-sensitive code and required main approvals.
- Configure provider spend caps/alerts, email/domain/payment settings and budget.
- Legal review of work eligibility, employment/cleaning rules, data rights, privacy, terms and market-specific obligations.
- Recruit consented providers/users, select pilot market, approve outbound outreach/paid spend and make launch/scale decisions.

**No calendar deadlines are used in the development plan.** Phases advance only when their evidence gates pass. A skipped test, draft PR, agent claim, schedule or source file is not proof of production readiness.
