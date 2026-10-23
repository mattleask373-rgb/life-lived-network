# Agent System Status — Live checkpoint, 2026-10-23

**Status source:** fresh read-only checks against GitHub, Lovable metadata, Supabase project listings, current-main CI and public GET responses.  
**Canonical repository:** `mattleask373-rgb/life-lived-network`  
**Current `main`:** `a3e57da647144fdd298590adc0e1e36269a979fd`  
**Last checked:** 2026-10-23, approximately 08:57 UTC. Re-fetch live values before acting; this is a dated checkpoint, not a permanent source of truth.

## Executive summary

- **Repository CI:** current main Verify passed, including lint/tests/build, tracked-environment guard, full migration replay against an empty isolated local Supabase database, control-plane SQL security tests and database function lint. CodeQL and the locked high/critical dependency audit also passed.
- **Production/source alignment:** **BLOCKED**. The actual Lovable Git destination, canonical public hostname, deployed build SHA and actual Supabase backend project are not authoritatively confirmed.
- **Database security:** clean local migration replay is verified. Hosted RLS, effective grants, default ACLs and project identity are not verified. Issue #164 remains open; PR #329 only narrows future defaults created by `postgres` and does not settle existing grants or `supabase_admin` defaults.
- **Autonomy:** **NOT PROVEN**. The repo has durable control-plane code, tests and a draft read-only hourly repository-contract probe (#270). No evidence proves a persistent worker is executing tasks continuously, writing durable heartbeats, processing a queue or recovering real agent work end to end.
- **Launch:** **NOT CLEARED**. Live SEO GETs disagree with source; staging is unverified; no genuine consented supply/request/response/completion pilot has been independently evidenced.

## Source and environment identity (blocking)

- Lovable project “Real World Atlas”: `b3293d2a-3218-4206-ab04-af8e984023ac`; its connected metadata reports published=true and latest revision `7ca12a5900d708014d63b03847f2c922965ea1be`.
- Lovable Project Settings → Git repository/sync branch and the served build SHA remain UNKNOWN. Its revision is associated with a divergent `Loveable/work/safely` branch; comparison to current main showed 18 commits ahead / 644 behind. Do not bulk-sync or issue code-writing Lovable prompts.
- Repository `supabase/config.toml` declares `csgngcnaqeoxyopvnzjo`. The connected integration returned `caaosyevvdhxwsrqhqur` (“Live lived”) and `nzrxulxodbckvbbslavw` (“World-Finder”); neither matches the repo ref. Do not assume either is the application backend.
- Read-only checks only. No hosted database writes, migrations, RLS/grant changes, deployment or publish were performed.

## Recently merged into current main

Current history shows #299 (control-plane migration lineage) and #316 (durable per-account AI draft quotas) merged into main, along with #325 (Ticketmaster geoPoint filter), #319 (PWA shell/offline fallback), #321 (Search crawler robots policy), #315 (breadcrumbs), #320 (public content reporting), #318 (public needs map layer), #311 (opportunity-query completeness), #310 (source timezone handling), #308 (Life List local-save resilience), #307 (sitemap eligibility), #322 (fail-closed corrupt locality data) and #317 (preview auth failure handling).

- [Current main commit](https://github.com/mattleask373-rgb/life-lived-network/commit/a3e57da647144fdd298590adc0e1e36269a979fd)
- [Main Verify #39882429187](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39882429187)
- [Main CodeQL/dependency audit #39882429184](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39882429184)

The old report that #299 remained open is obsolete: #299 is merged. Reconcile this status file whenever main advances.

## Security and release gates

### GitHub ruleset #24946178

A fresh raw ruleset GET returned active enforcement, PRs required, one approving review, stale-review dismissal, latest-push approval, review-thread resolution, strict status checks with exact context `verify`, and non-fast-forward protection. **Deletion protection was not present in the returned rules list**; the administrator should configure and verify it. CodeQL/dependency audit were previously separate from the required check; PR #331 proposes placing `bun audit --audit-level=high` inside the required `verify` workflow.

### Default ACLs / RLS

Issue [#164](https://github.com/mattleask373-rgb/life-lived-network/issues/164) describes historical broad default privileges for `anon` and `authenticated` on public objects created by both `postgres` and `supabase_admin`. These are historical findings that require a fresh sanitized ACL inventory in the correct database. Do not claim the issue is solved. PR [#329](https://github.com/mattleask373-rgb/life-lived-network/pull/329) only mitigates defaults for future objects created by `postgres`; it neither fixes existing object privileges nor changes `supabase_admin` defaults.

### PHP runtime exposure

The indexed current-main tree contains no PHP source, Composer manifests or PHP/Apache/PHP-FPM runtime configuration paths. Therefore no repository-local PHP runtime/dependency exposure was found. The actual hosting/container/adjacent-service runtime remains unknown. PHP announced critical RCE CVEs CVE-2026-109618 and CVE-2026-109619 on 2026-10-21; host inventory must be checked and affected PHP runtimes upgraded to fixed supported releases if present. Do not call the entire deployment PHP-safe without runtime evidence.

### Live public-route/SEO mismatch

Safe GETs on the observed candidate host `https://life-lived-network.lovable.app` returned:
- `/robots.txt`: HTTP 200 with blanket Allow and no sitemap directive.
- `/sitemap.xml`: HTTP 404 HTML.
- `/life-list`: HTTP 200 and “Only you see this”, without visible noindex metadata in the fetched HTML.

Current source `public/robots.txt` contains private-route rules and a sitemap directive, while route code marks Life List private/noindex. The exact canonical production hostname/build is still unverified. Record this as a deployment/source-parity blocker, not proof of private-data leakage. Robots/noindex is not access control.

### AI spend and public AI

The merged #316 adds durable per-account quotas (5/hour, 20/day) and fails closed when quota evidence is unavailable. Draft PR [#331](https://github.com/mattleask373-rgb/life-lived-network/pull/331) now adds SQL boundary tests, asserts the quota SECURITY DEFINER function uses `search_path=pg_catalog`, and proposes making high/critical locked dependency audit part of required Verify. Exact-head checks for its latest commit are pending after branch serialization/cancelled earlier attempts; do not describe the current head as green until fresh checks finish.

Public “Ask this place” remains disabled. A feature-specific emergency stop and account quota are not a system-wide provider spend cap, budget-alert service, distributed kill switch or persistent worker.

## Active integration queue (all candidates remain human-review gated)

Last fresh PR-filter read returned 84 open PRs, all drafts, zero open non-drafts and 139 closed PRs. Re-fetch before making decisions; old branch statuses are not reliable.

- [#270 — read-only hourly repository-contract probe](https://github.com/mattleask373-rgb/life-lived-network/pull/270): refreshed on current main, head `d285fe6c642228926b9aa50b47d1eef01fcd6620`, 3 commits ahead / 0 behind. Exact-head Verify and CodeQL/dependency audit passed. It validates documented contracts and records an Actions-summary timestamp/run link only; it does not access Supabase, claim tasks or prove a durable agent heartbeat. Still draft, no review.
- [#331 — AI quota security hardening](https://github.com/mattleask373-rgb/life-lived-network/pull/331): current head `a117d8fef0714153b6617a2232f224c32820b6d4`, 5 commits ahead / 0 behind. New Verify run is queued/waiting due serialization and CodeQL analysis is running; dependency audit passed on that run. Keep blocked until exact-head checks finish and independent review is submitted.
- [#333 — adversarial supply evaluation](https://github.com/mattleask373-rgb/life-lived-network/pull/333): exact-head Verify and CodeQL passed on its observed head. The tests protect the invariant that residence/capability does not prove willingness, availability or service coverage. No independent review.
- [#332 — opportunity-query completeness](https://github.com/mattleask373-rgb/life-lived-network/pull/332): exact-head Verify/CodeQL passed on its observed head. Review alongside #330 because both touch `src/lib/needs.functions.ts`.
- [#329 — future public default privileges](https://github.com/mattleask373-rgb/life-lived-network/pull/329): exact-head Verify/CodeQL passed on its observed head, but scope is partial as stated above. Must be reconciled with #164.
- [#330 — Need lifecycle/freshness](https://github.com/mattleask373-rgb/life-lived-network/pull/330): Verify/CodeQL passed on its observed head, but require independent RLS/privacy review for the `public` versus `local_discovery` visibility boundary before integration.
- [#334 — honest Surprise Me quiet state](https://github.com/mattleask373-rgb/life-lived-network/pull/334): Verify/CodeQL passed on its observed head; no independent review.
- [#327 — magic-link auth](https://github.com/mattleask373-rgb/life-lived-network/pull/327): Verify/CodeQL passed on its observed head; confirm actual auth backend, redirect allowlists, expiry/replay and rate controls.
- [#328 — locale foundation](https://github.com/mattleask373-rgb/life-lived-network/pull/328): Verify/CodeQL passed on its observed head; multilingual completeness, accessibility, dates, currencies and timezone behavior need review.
- #323 measurement contract, #313 UI polish and #314 documentation were stale relative to current main; port only unique content and re-run checks. Never merge stale branches wholesale.

**Merge order is provisional and gated, not an instruction to merge automatically:** #331, #333, #332, #329, #334, then #330 after RLS semantics review; then the stale-base/consumer-dependent candidates after rebase/port, independent review and exact-head checks. No candidate should be marked ready solely because CI passes.

## 24/7 autonomous execution

Issue [#121](https://github.com/mattleask373-rgb/life-lived-network/issues/121) defines acceptance criteria for a real persistent executor. The hourly repo-only probe PR #270 is a low-risk observability slice, not the executor.

Still required in a confirmed non-production environment:
- owner/project-scoped identity; atomic claim/lease heartbeat, fencing and stale-lease rejection;
- duplicate dispatch/completion idempotency, bounded retries, cancellation and restart recovery;
- one real provider-neutral agent task with durable start/heartbeat/terminal evidence;
- failed-run visibility, tested end-to-end alerts, a cost ceiling and kill switch;
- operator controls to pause/resume/recover, and no merge/deploy/production write without human approval.

The three enabled ChatGPT automations are daily coordination/build loops, not an always-on server worker. Their reported `next_run_time` was null; next dispatch is not independently verified. Do not claim nonstop/24/7 coding until actual executor/heartbeat/recovery evidence exists.

## Dependency-ordered next actions

1. Owner/admin: confirm Lovable Git repository + protected non-main sync branch, canonical hostname/build SHA, actual Supabase project ref and disposable environment. Reconcile repo ref mismatch before hosted tests or Lovable writes.
2. Finish exact-head checks for #331; keep it draft until green, reviewed and reconciled with #164.
3. Obtain independent reviews on current-main candidates #333/#332/#329/#334; resolve #330 shared-file and RLS semantics before any merge.
4. Have a repository admin confirm deletion protection and bypass configuration in the raw ruleset. Do not change rulesets using this automation.
5. Diagnose public SEO GET mismatch only after canonical host/build is confirmed; deployment/publish remains owner-gated.
6. Prove the persistent worker acceptance criteria for #121 in a named isolated environment; do not represent daily automation or a CI probe as a 24/7 executor.
7. Demonstrate a consented real local supply → request → response → completion loop before activating external feeds, public AI, paid acquisition or global expansion.

## Invariants

- `src/lib/supply-engine.ts` / `findSupply()` remains the single canonical possibility/discovery authority. Do not create a parallel matcher.
- Residence is not service coverage; ability is not willingness; unknown/incomplete reads must not become verified positives or zeros.
- No fabricated people, inventory, events, source rights, availability, users or outcomes.
- Private owner state never enters public sitemaps, caches, model context or other users' results.
- No merge, deploy, hosted migration/RLS/grant/secret change, Lovable write, provider activation, public AI launch, external contact or spend without the appropriate explicit human approval.
