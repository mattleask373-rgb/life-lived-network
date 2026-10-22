# PR integration register and merge order — 22 October 2026

## Purpose and safety rule

This register assigns every currently open pull request a disposition and places useful work in dependency order. It is an integration plan, not a claim that all changes have been reviewed line by line, that tests pass on current main, or that a PR is safe to merge merely because its branch once passed CI.

Repository snapshot: `main` = `d02459a384cb8ffcc6201839d45645e178ef0b2b`. The live open-PR inventory returned 88 PRs: 47 drafts and 41 non-drafts. Approximately 60 had not been updated since before 20 October. Only #285, #286, and #288 were based on the exact current main SHA in this snapshot; many other PRs target older base commits or are stacked on another open PR. Their historical green checks are not release evidence for a rebased or ported patch.

Repository policy in `AGENTS.md`: no autonomous merge to main, no force-push, and independent review required. Merge only after the current-main diff is understood, the relevant exact-head checks pass, required independent review is recorded, and any human/environment gate is satisfied. Do not merge branches in dependency order if that means merging known unsafe code; port unique useful changes into a single current-main implementation instead.

### Current CI evidence for the three current-main-based PRs

| PR | Exact head | Latest evidence retrieved | Current disposition |
|---|---|---|---|
| [#285](https://github.com/mattleask373-rgb/life-lived-network/pull/285) | `bfbc283e870d2ed9ea5b94e2334ffd1127582ae5` | [Verify passed](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39713955393); [CodeQL passed](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39713955371) | First code candidate after independent review. CI/k6-only. |
| [#286](https://github.com/mattleask373-rgb/life-lived-network/pull/286) | `6b119f378a1b51a807edef087bb8cd2f3271a6f2` | [Verify passed](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39706850577); [CodeQL passed](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39706850573) | Do not merge wholesale. Overlaps #285 and adds connection SQL/security changes that must be reconciled with #162/#164. |
| [#288](https://github.com/mattleask373-rgb/life-lived-network/pull/288) | `f85599d325f34ecbe32a088fabf7a8c1837396f3` | [Verify failed](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39762651469) at “Parse k6 script without sending traffic”; [CodeQL passed](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39762651650) | Documentation-only plan. Keep draft until it is refreshed with this register and exact-head Verify passes after the CI fix is integrated. |

No independent review submissions were found for #285 or #286 at the time of the audit. No approved staging origin was verified and no live k6 traffic test has been run.

## Required integration order

### Gate 0 — Verify owners and source of truth
1. Repository owner/admin verifies branch protection, required checks, review rules and bypass actors.
2. Human owner records the Lovable Git repository/sync branch, intended published build SHA, production hostname, and connected Supabase project. PR #235 must not be treated as the active preview until its source identity is reconciled.
3. Database/security owner resolves the status and remediation scope of issue #164 (default grants / RLS). Confirm that any verification environment is disposable and isolated.
4. No production mutation, hosted SQL/RLS change, deployment, provider activation, public posting, or paid spend follows from this register.

### Gate 1 — Establish a trustworthy CI baseline
1. Independent review and merge decision for **#285** (or a reviewed equivalent port) as the narrow k6 parse fix plus immutable action pins. The fix moves load-target safety checks into the k6 runtime function so static inspection remains traffic-free; runtime approval, non-production target constraints and redirect blocking must remain intact.
2. Re-run Verify and CodeQL on the resulting main SHA.
3. Treat **#265** (checkout v7/workflow updates) as overlapping with #285’s immutable action pins: compare exact action SHAs and permissions, and choose one reviewed workflow implementation. Do not combine blindly.
4. Check whether the current main still needs **#72**'s package/lockfile adjustment. #285’s frozen install passed, so #72 is not presumed necessary. Process **#267** (ESLint plugin major), **#268** (ESLint major), and especially **#266** (50 dependency updates) individually after the baseline is clean, with lockfile, test, build and CodeQL evidence.

### Gate 2 — Environment-file hygiene and connection authorization
1. Verify the current tracked-file state, secret scanning, ignore rules, and contents of .env.example without printing or committing secret values. Compare **#120** and **#122**: both touch .env/.env.example and earning files; split env hygiene from unrelated orchestration/earning work.
2. Reconcile **#162**, **#286**, and **#161** as one connection-security contract; consult **#164** and its anonymous/authenticated access matrix before any migration.
3. Required cases include: only authorized parties can update state; compare-and-set rejects stale status updates; referenced need is open and not expired; requester/recipient isolation; anonymous privileges are explicitly reviewed; duplicate/overlapping triggers are eliminated; message/request writes have tested allow and deny paths.
4. Prove migration replay, rollback and PostgREST/RLS behavior in a disposable DB. Supabase Preview being skipped is not proof. Do not apply hosted DB or permissions changes without owner approval.

### Gate 3 — Canonical matching, request validation and locality
1. Compare the current main implementation against **#4** and **#8** evaluation/possibility-contract changes. Preserve unique adversarial tests and the single `findSupply()` authority; do not add a second matcher.
2. Review **#169** input validation/place-boundary work first, then reconcile overlapping exact-count/locality implementations in **#172** and **#154**. Use tests to select a single canonical implementation, not merge duplicate diffs.
3. Integrate the unique fail-closed radius/ancestor/date-line/viewport behavior from **#272** after rebasing and verifying selected locality cannot silently broaden. Tests must cover antimeridian, sparse/empty data, ancestor limits, stale results, paging/cancellation and invalid scope.
4. Compare **#160** and **#166** so subject, query, locality and intent are preserved once across routes rather than duplicated in separate state systems. Review **#59** for stale Journey records and **#158** for honest Surprise Me empty-state messaging.
5. Test on current main at both unit and route level; historical CI on old bases is informational only.

### Gate 4 — SEO, privacy and telemetry
1. Establish one current route-policy registry via the unique work in **#271**: canonical URL, public/private/noindex decision, internal links, robots, sitemap and live-smoke policy. Private Life List data must be protected by authorization, not robots/noindex alone.
2. Add **#257** breadcrumb JSON-LD only after structured-data tests use the same approved route policy and only emit truthful, eligible data.
3. Use **#168** as the starting privacy-safe event contract. Review **#34** and **#43** together because they overlap on search intent, local page quality and telemetry; extract their distinct search front-door and Ticketmaster adapter value into separate, bounded patches. Avoid storing raw query text, personal identifiers or connection/recipient IDs without an approved purpose, classification, retention and access path.
4. Run bot-versus-human analytics baseline; exclude sitemap/crawler activity from conversion claims. Validate live robots/sitemap only against a human-confirmed host after authorized publication.

### Gate 5 — Marketplace and ingestion source contracts
1. Reconcile **#49** ingestion/supply-gap contract and **#58** acquisition contract with the existing source lifecycle and `findSupply()`; source provenance, licensing, freshness, review and publication must fail closed.
2. Review **#153** Ticketmaster time bounds and the isolated event-adapter parts of **#43**; use fixtures and no live feed activation until rights/usage and costs are approved. **#134** contains rights-aware pilot guidance but is documentation, not approval to connect a feed.
3. Validate **#175** as a non-writing place staging validator. Staging fixtures are not live listings or supply.
4. Market pilot remains gated by **#178** research, **#179** onboarding checklist, current host/property-manager demand validation and Australian legal/work-rights review. Do not select a locality solely from a PR title or assume workers/providers exist.

### Gate 6 — User-facing flow and visual-system convergence
1. **#15** connection-flow UI waits for the canonical connection authorization contract in Gate 2.
2. Compare **#195**, **#193**, **#60**, **#57**, **#54**, **#53**, and **#243** against current main (including already-merged #211/#220/#231). They overlap entry cards, grounded matching, map controls, locality density and Journey/Road Trip UI. Port only user-visible improvements not already present, and ensure keyboard/screen-reader/touch/empty/error states have tests.
3. Compare **#235** against the actual Lovable Git target and exact preview commit. Its PR head and previously reported Lovable project SHA differ; no bulk sync, auth-storage change or source-of-truth claim until a human confirms the target.
4. Verify **#166/#160** context persistence within the canonical navigation model instead of adding another front-door state mechanism.

### Gate 7 — Reconcile agent/control-plane architecture (do not merge the old stack as a batch)
1. Before choosing implementation PRs, compare the actual main migrations and runtime against issues **#74/#100/#116/#117/#121**. Verify tables, RPCs, grants, task state transitions, identity, project scope, lease/fencing, idempotency, cancellation, result receipts and recovery already present or missing.
2. **#61** and **#64** are large competing versions of the provider-neutral control plane; **#62** is stacked on #61. Do not merge both architectures. Choose a reviewed baseline only after migration-lineage comparison.
3. Review the phase chain **#101 → #102 → #103 → #104 → #106 → #108 → #109** as dependent proposals, not independent PRs. The sequence includes identity and several migrations on stacked historical bases; prove fresh replay, upgrade compatibility, role grants, rollback and non-production recovery. Do not apply migrations to hosted Supabase.
4. **#115** adds a scope-boundary implementation and migration and must be reconciled with the canonical control-plane scope/migration authority, not layered on blindly. **#122** overlaps orchestration plus env hygiene and earning route work; separate concerns.
5. Pure contracts and documentation **#96**, **#99**, **#77**, **#79**, **#63**, **#28**, and **#135** can inform the chosen architecture, but should be consolidated instead of producing competing descriptions.
6. **#80** and **#270** both propose read-only scheduled probes/sentinels. Keep one observable, low-cost health approach only after its exact behavior and permitted permissions are verified. A cron workflow is not a durable 24/7 agent executor.
7. **#67**, **#69**, **#73**, **#75**, **#82**, **#84**, **#86**, **#87**, **#113**, and **#115** are programme/experiment/intelligence/control-plane extensions with overlapping state, experiment and automation seams. Defer them until the core connection/discovery/marketplace loop and authoritative task boundary are stable. Port isolated pure, well-tested helpers only when they provide an immediate verified outcome.

### Gate 8 — One current plan and cleanup
1. **#288** is the canonical rolling Oct 2026–Oct 2027 global plan; this register is its PR disposition appendix.
2. Pull the verified, still-relevant ADRs from **#283** (backend/migration authority and capacity model) into the accepted docs without overwriting status facts. Reconcile factual claims from **#254**, **#178**, and **#179** against current evidence.
3. **#189**, **#171**, **#180**, **#152**, **#196**, **#194**, **#134**, **#63**, **#79**, **#96**, **#99**, **#135**, **#7**, **#11**, **#14**, and **#28** have different degrees of potentially useful history, checklists or architecture text. Keep unique evidence and normative requirements, but supersede duplicate launch/agent plans with the canonical master plan. Documents describing rights, scope or operation do not themselves authorize production actions.
4. After unique value has been ported, close/supersede redundant, stale or fully merged-equivalent PRs with a reason and source link. Do not mass-close before file-by-file comparison.

## Complete register of all 88 open PRs

The file list below is an inventory of changed-file scope; it is not a claim that all lines of all 88 diffs have had independent code review. Every item must be re-fetched and reviewed at its current head before merge.

| PR | Current title / scope from changed files | Disposition |
|---|---|---|
| [#288](https://github.com/mattleask373-rgb/life-lived-network/pull/288) | Master 12-month global plan; one programme Markdown file. | **Keep as canonical plan.** Add this register, then re-run exact-head Verify after #285 is integrated. |
| [#286](https://github.com/mattleask373-rgb/life-lived-network/pull/286) | CI/k6 fix, tracked-env check, connection compare-and-set code, SQL migration and load script. | **Split.** CI overlap goes through #285; env/CAS value may be ported; migration blocked by #162/#164 access-control findings. |
| [#285](https://github.com/mattleask373-rgb/life-lived-network/pull/285) | K6 parser-safety fix and immutable action pins in Verify, CodeQL and live SEO smoke workflows. | **First code candidate.** Independent review and merge control required; then re-run checks on main. |
| [#283](https://github.com/mattleask373-rgb/life-lived-network/pull/283) | Backend/migration authority ADR, million-DAU capacity-model ADR and STATUS.md. | **Port useful ADRs.** Reconcile status with current facts; base is stacked on #285. No capacity claims without measurements. |
| [#272](https://github.com/mattleask373-rgb/life-lived-network/pull/272) | Locality scope, error/observation contracts, map view, world functions, country-place routes and tests. | **Port after rebase/review.** High-value candidate; prove fail-closed locality, date-line, viewport and paging behaviour against current main. |
| [#271](https://github.com/mattleask373-rgb/life-lived-network/pull/271) | SEO route policy, robots, live-smoke script/tests, sitemap privacy, Life List route. | **Port as one route-policy implementation** after CI and security review; keep Life List authorization separate from noindex. |
| [#270](https://github.com/mattleask373-rgb/life-lived-network/pull/270) | Scheduled read-only agent control-plane workflow and observability documentation. | **Hold.** Compare with #80 and existing issue #121; avoid adding a second probe and do not describe this as a 24/7 executor. |
| [#268](https://github.com/mattleask373-rgb/life-lived-network/pull/268) | ESLint major-version dependency update. | **Defer, then test alone** after CI baseline; verify lint/test/build and lockfile. |
| [#267](https://github.com/mattleask373-rgb/life-lived-network/pull/267) | eslint-plugin-react-hooks major-version dependency update. | **Defer, then test alone** after CI baseline; do not batch with #266. |
| [#266](https://github.com/mattleask373-rgb/life-lived-network/pull/266) | Bulk group of 50 Bun dependency updates. | **Hold / split into smaller updates.** Highest regression surface; update and test in batches with lockfile/audit evidence. |
| [#265](https://github.com/mattleask373-rgb/life-lived-network/pull/265) | GitHub Actions checkout v7 changes in workflows. | **Resolve against #285's pinned action SHAs**; select one reviewed immutable workflow state, do not layer blindly. |
| [#257](https://github.com/mattleask373-rgb/life-lived-network/pull/257) | Breadcrumb JSON-LD structured data and tests for locality/service pages. | **Port after #271** so structured data uses the canonical public-route eligibility rules. |
| [#254](https://github.com/mattleask373-rgb/life-lived-network/pull/254) | Global-scale baseline report. | **Evidence audit then consolidate** into #288/#279; numbers must include source, date, workload and uncertainty. |
| [#245](https://github.com/mattleask373-rgb/life-lived-network/pull/245) | Fail-closed “Ask this place” eligibility policy and tests. | **Candidate for isolated port** after checking issue #209 eligibility invariants; it is a policy seam, not an enabled assistant or UI/retrieval integration. |
| [#243](https://github.com/mattleask373-rgb/life-lived-network/pull/243) | Journey/Road Trip visual redesign and tests. | **Compare against already-merged #211/#220/#231**; port unique fixes only, otherwise supersede. |
| [#235](https://github.com/mattleask373-rgb/life-lived-network/pull/235) | Lovable preview auth storage helper plus map/work-opportunity files and a .lovable plan file. | **Human source-identity gate.** Reported Lovable SHA and PR head differ; verify actual repository/branch/build before code integration or sync. |
| [#196](https://github.com/mattleask373-rgb/life-lived-network/pull/196) | Grok style/integration playbook documentation. | **Consolidate useful lessons** into the current agent handoff; close/supersede the duplicate after evidence extraction. |
| [#195](https://github.com/mattleask373-rgb/life-lived-network/pull/195) | Entry sheet/map controls, grounded matching and touch-target tests/styles. | **Port unique accessible UI improvements** only after comparing with #193/#60/#54 and current main. |
| [#194](https://github.com/mattleask373-rgb/life-lived-network/pull/194) | Least-privilege Supabase ACL proposal document. | **Keep as proposal/evidence only** and reconcile with #164. Explicitly not authorization to apply grants. |
| [#193](https://github.com/mattleask373-rgb/life-lived-network/pull/193) | Keyboard-accessible entry cards and grounded-matching tests. | **Port after UI convergence**; compare with #195 and test keyboard/screen-reader state on current components. |
| [#189](https://github.com/mattleask373-rgb/life-lived-network/pull/189) | Phase 2 global experience plan, roadmap and stale status. | **Supersede with #288** after preserving unique valid constraints. |
| [#180](https://github.com/mattleask373-rgb/life-lived-network/pull/180) | Global-market integration gates/audit and roadmap/status. | **Reconcile evidence into #263/#288**, do not retain a competing execution board. |
| [#179](https://github.com/mattleask373-rgb/life-lived-network/pull/179) | Reusable market-onboarding checklist. | **Candidate to port** after validating it against #288 and the evidence/legal gates for market entry. |
| [#178](https://github.com/mattleask373-rgb/life-lived-network/pull/178) | Locality, opportunity and SEO audit document. | **Verify facts against current main and dated sources**; keep useful evidence in the master plan or close as superseded. |
| [#175](https://github.com/mattleask373-rgb/life-lived-network/pull/175) | Non-writing place hierarchy/source staging validator and Australia skeleton/tests. | **Candidate after source contracts**; verify it never publishes or writes live data and that it cannot fabricate supply. |
| [#172](https://github.com/mattleask373-rgb/life-lived-network/pull/172) | Exact open-need counts, validated inputs, locality empty-state components and tests. | **Reconcile with #169/#154/#272**; choose one implementation and port after security/locality tests. |
| [#171](https://github.com/mattleask373-rgb/life-lived-network/pull/171) | Global launch readiness plan targeting 31 October and several companion launch documents. | **Supersede stale launch promises** with evidence-gated milestones in #288; preserve only current validated material. |
| [#169](https://github.com/mattleask373-rgb/life-lived-network/pull/169) | Server input validation and canonical-place boundaries in needs functions. | **High-priority security review/port** after current-main rebase; reconcile overlapping files with #172 and test invalid/unauthorized input. |
| [#168](https://github.com/mattleask373-rgb/life-lived-network/pull/168) | Privacy-safe funnel measurement contract and tests. | **Candidate to port early** after privacy review; do not claim live event wiring or verified outcome telemetry from a contract alone. |
| [#166](https://github.com/mattleask373-rgb/life-lived-network/pull/166) | Front-door query context across help/give/journey routes. | **Reconcile with #160** and current navigation; preserve one source of intent/locality context. |
| [#165](https://github.com/mattleask373-rgb/life-lived-network/pull/165) | Production-fixture boundary security test. | **Small security-test candidate** after rebase; verify it complements current policy and passes on current main. |
| [#162](https://github.com/mattleask373-rgb/life-lived-network/pull/162) | Connection request update policy, integration/migration tests and SQL migration. | **Hold for canonical security consolidation** with #286/#161/#164; check need expiry/open state, duplicate triggers, anon grants and requester/recipient isolation. |
| [#161](https://github.com/mattleask373-rgb/life-lived-network/pull/161) | Conversation security policy/RLS invariants as tests. | **Use in security test plan**, rebase and align with one canonical migration before any merge. |
| [#160](https://github.com/mattleask373-rgb/life-lived-network/pull/160) | Search subject/intent/locality continuity across possibility and need routes. | **Compare against #166**; port unique tested route-state behaviour into one canonical navigation context. |
| [#159](https://github.com/mattleask373-rgb/life-lived-network/pull/159) | Supabase preview status/migration-fencing workflow and migration test. | **Hold for CI/workflow review** after #285/#265; do not mistake skipped Preview for proof or let CI apply hosted migrations. |
| [#158](https://github.com/mattleask373-rgb/life-lived-network/pull/158) | Honest quiet feedback for Surprise Me intent and tests. | **Narrow candidate** after rebase; verify the current empty-state copy and intent path before porting. |
| [#154](https://github.com/mattleask373-rgb/life-lived-network/pull/154) | Grok-labelled fail-closed locality counts and open-need query tests. | **Port only unique exact-count behavior** after comparing with #172; do not merge the stacked branch wholesale. |
| [#153](https://github.com/mattleask373-rgb/life-lived-network/pull/153) | Ticketmaster invalid-time/query-bound checks and tests. | **Candidate for isolated adapter-hardening** after current-source and rights review; no feed activation. |
| [#152](https://github.com/mattleask373-rgb/life-lived-network/pull/152) | Historical agent STATUS.md refresh. | **Supersede** with current issue/plan facts; keep no duplicate status source. |
| [#135](https://github.com/mattleask373-rgb/life-lived-network/pull/135) | Agent handoff issue template and coordination workflow documentation. | **Consolidate unique schema** into #263/#288; issue template can be ported if still useful and non-duplicative. |
| [#134](https://github.com/mattleask373-rgb/life-lived-network/pull/134) | Rights-aware Ticketmaster pilot readiness plan. | **Preserve as checklist, not an activation approval**; verify laws, data terms, costs and owner permissions before any provider integration. |
| [#122](https://github.com/mattleask373-rgb/life-lived-network/pull/122) | Orchestration lifecycle code plus .env/.env.example, earning logic/route and tests. | **Split and hold.** Compare with #120 and the control-plane implementation; do not merge unrelated env, earning and orchestration scope together. |
| [#120](https://github.com/mattleask373-rgb/life-lived-network/pull/120) | Stop tracking environment configuration, add template, and alter earning-related files. | **Audit as env-hygiene priority**, then separate and port minimal diff; check secrets without exposing values and compare with #122/#286. |
| [#115](https://github.com/mattleask373-rgb/life-lived-network/pull/115) | Phase-14 authoritative scope boundary, operations gates, tests, and hosted-proof migration. | **Hold.** Reconcile with actual main runtime and canonical migration lineage; no hosted migration from this PR. |
| [#113](https://github.com/mattleask373-rgb/life-lived-network/pull/113) | Multi-stream/SEO experiment contracts and programme/sitemap code/tests. | **Port only unique contracts** after #67/#69/#73 reconciliation and route-policy approval; avoid parallel experiment/state implementations. |
| [#110](https://github.com/mattleask373-rgb/life-lived-network/pull/110) | Public locality API, route, contract docs and tests. | **Security/publication gate.** Verify data eligibility, authorization, cache, rate limits and privacy before any public API merge. |
| [#109](https://github.com/mattleask373-rgb/life-lived-network/pull/109) | Dispatch correlation and idempotency fencing migrations. | **Hold as dependent migration** in old #101–#109 stack; prove schema ancestry and replay before deciding whether to port. |
| [#108](https://github.com/mattleask373-rgb/life-lived-network/pull/108) | Durable attempt-result idempotency migration. | **Hold as dependent migration**; consolidate only with the chosen control-plane architecture and disposable-DB proof. |
| [#106](https://github.com/mattleask373-rgb/life-lived-network/pull/106) | Durable attempt completion fencing code/test and migration. | **Hold as dependent migration**; verify leases, stale writer behavior, replay, rollback and migration order first. |
| [#104](https://github.com/mattleask373-rgb/life-lived-network/pull/104) | Evidence-verification kernel and tests. | **Defer** until authoritative task/result identity exists; port only if it provides a distinct deterministic proof seam. |
| [#103](https://github.com/mattleask373-rgb/life-lived-network/pull/103) | Supervisor reconciliation/recovery, dispatch code and several migrations. | **Hold; do not merge the stale migration stack.** Compare all functions and table assumptions with current main and #61/#64/#115. |
| [#102](https://github.com/mattleask373-rgb/life-lived-network/pull/102) | Provider-neutral runtime boundary and tests. | **Defer** until identity/authenticated execution boundaries are selected; no provider credentials or production execution. |
| [#101](https://github.com/mattleask373-rgb/life-lived-network/pull/101) | Agent execution identity implementation and initial migration. | **Security/migration design gate.** Compare with #96/#77/#61/#64 and current grants before port. |
| [#99](https://github.com/mattleask373-rgb/life-lived-network/pull/99) | Bounded autonomous supervisor contract documentation. | **Consolidate into #288/#209** after validating it matches real available capabilities; docs are not runtime proof. |
| [#96](https://github.com/mattleask373-rgb/life-lived-network/pull/96) | Authenticated execution identity documentation. | **Use as design evidence** for the chosen control-plane contract; supersede if duplicates #77/#101. |
| [#87](https://github.com/mattleask373-rgb/life-lived-network/pull/87) | Intelligence-cycle workflow, runner/tests and multiple long-form architecture documents. | **Hold.** Compare with #28/#80/#270 and task/control-plane reality; no scheduled model/agent execution until budgets, credentials and kill switch are verified. |
| [#86](https://github.com/mattleask373-rgb/life-lived-network/pull/86) | Reality-delta pure TypeScript kernel and tests, based on dependency/lockfile branch. | **Defer** until the experiment/state architecture and package versions are stabilized; port only distinct tested behavior. |
| [#84](https://github.com/mattleask373-rgb/life-lived-network/pull/84) | Fleet-reflection contract and implementation/tests. | **Defer** until task identity, event store, budgets and verified operations exist; not a production executor. |
| [#82](https://github.com/mattleask373-rgb/life-lived-network/pull/82) | Opportunity-frontier contract/function and tests. | **Defer** until the real canonical data and experiment state are stable; avoid speculative duplicate opportunities. |
| [#80](https://github.com/mattleask373-rgb/life-lived-network/pull/80) | Scheduled read-only fleet sentinel workflow, script and documentation. | **Compare with #270 and #87; choose one** after validating interval, permissions, budget and alert behavior. |
| [#79](https://github.com/mattleask373-rgb/life-lived-network/pull/79) | 24/7 multi-agent fleet constitution documentation. | **Consolidate governance** into #288/#209 and the actual control-plane runbook; does not prove that agents are running 24/7. |
| [#77](https://github.com/mattleask373-rgb/life-lived-network/pull/77) | Provider-neutral agent identity/approval contract code and tests. | **Compare with #96/#101/#64**; select one identity/scope contract before merging. |
| [#75](https://github.com/mattleask373-rgb/life-lived-network/pull/75) | Expansion proposal kernel and tests. | **Defer** until evidence-gated experiment/task state exists and expansion cannot self-authorize. |
| [#73](https://github.com/mattleask373-rgb/life-lived-network/pull/73) | Experiment task adapter, programme state and experiment engine/tests. | **Reconcile with #67/#69/#113**; choose one state engine and test idempotent bounded task translation. |
| [#72](https://github.com/mattleask373-rgb/life-lived-network/pull/72) | package.json-only lockfile reconciliation. | **Compare with current frozen install and #266–#268**; merge only if there is a still-current manifest/lock mismatch. |
| [#69](https://github.com/mattleask373-rgb/life-lived-network/pull/69) | Experiment engine plus programme-state code and tests. | **Reconcile with #67/#73/#113** before selecting one current-main implementation. |
| [#67](https://github.com/mattleask373-rgb/life-lived-network/pull/67) | Programme-state contract/code/tests. | **Possible base for state design, not automatic merge**; verify idempotency, persistence assumptions and overlap with later engine work. |
| [#64](https://github.com/mattleask373-rgb/life-lived-network/pull/64) | Very large agent company/control-plane implementation with many modules and Supabase migrations. | **Hold for architecture and security review.** Competes with #61 and includes migrations; never merge wholesale by age or green checks. |
| [#63](https://github.com/mattleask373-rgb/life-lived-network/pull/63) | AI-team handbook documentation. | **Consolidate useful process docs** into current issue/plan without adding another source of truth. |
| [#62](https://github.com/mattleask373-rgb/life-lived-network/pull/62) | Claim/lease/heartbeat envelope implementation stacked on #61. | **Hold with #61**; do not merge child independently or treat docs/tests as end-to-end lease/fencing proof. |
| [#61](https://github.com/mattleask373-rgb/life-lived-network/pull/61) | Provider-neutral orchestration runtime, many files, task contracts, lease/state modules and migrations. | **Competing control-plane baseline.** Diff against #64/main and select one architecture only after DB lineage and authorization review. |
| [#60](https://github.com/mattleask373-rgb/life-lived-network/pull/60) | Sparse-locality progressive disclosure, density and map/list route behavior. | **Compare against #54/#57 and merged #211/#220/#231**; port unique accessibility/empty-state improvements only. |
| [#59](https://github.com/mattleask373-rgb/life-lived-network/pull/59) | Journey record freshness/stale-record behavior and locality tests. | **Good targeted correctness candidate** after current-main rebase; verify expired or stale records cannot be presented as current. |
| [#58](https://github.com/mattleask373-rgb/life-lived-network/pull/58) | Local supply acquisition opportunity contract/function/tests. | **Port after source lifecycle contract**; it must not bypass findSupply, publish unverified leads, or turn a supply gap into fake listings. |
| [#57](https://github.com/mattleask373-rgb/life-lived-network/pull/57) | Map-first locality page route change. | **Likely superseded by merged locality/UI work**; compare exact behavior and port only unique improvements. |
| [#54](https://github.com/mattleask373-rgb/life-lived-network/pull/54) | Living-world signal component and “what’s here/happening” surfaces with tests. | **Consolidate with #53/#60/#57**; pick one coherent component contract and no fabricated activity counts. |
| [#53](https://github.com/mattleask373-rgb/life-lived-network/pull/53) | Earlier activity-signal component and surface changes. | **Likely superseded by #54**; preserve unique honest-state copy/tests, then close if no unique patch remains. |
| [#49](https://github.com/mattleask373-rgb/life-lived-network/pull/49) | Ingestion reconciliation ADR and supply-gap contract/tests. | **Use as source-contract candidate** after checking current ADR and #58; no ingestion activation or fabricated inventory. |
| [#43](https://github.com/mattleask373-rgb/life-lived-network/pull/43) | Ticketmaster fixture adapter/external event ingestion plus front-door, local-page quality, search-intent and telemetry files. | **Split by responsibility.** Isolate the bounded fixture adapter from overlapping #34 analytics/navigation; no live provider activation without rights and budget approval. |
| [#34](https://github.com/mattleask373-rgb/life-lived-network/pull/34) | Search growth front door, local page quality, search intent and telemetry. | **Do not merge wholesale.** It is stale/diverged and overlaps #43; port unique useful landing/locality quality only after privacy-safe event contract and route correctness review. |
| [#28](https://github.com/mattleask373-rgb/life-lived-network/pull/28) | 24/7 worker control-plane process, roster/task contract/watchdog documents. | **Consolidate documentation** with #288/#209 and the selected architecture; it is not proof of an active durable worker. |
| [#15](https://github.com/mattleask373-rgb/life-lived-network/pull/15) | Possibility-to-connection flow, service definitions and need detail route/tests. | **Wait for Gate 2**; verify authorization, consent, durable status and failure/cancel paths before user-facing connection-flow integration. |
| [#14](https://github.com/mattleask373-rgb/life-lived-network/pull/14) | Search growth research plan/report and growth-code tests. | **Verify against current funnel baseline** and consolidate with #12/#34/#288; no mass SEO pages or unverified growth claims. |
| [#12](https://github.com/mattleask373-rgb/life-lived-network/pull/12) | Local discovery/growth foundation, intent/local-page quality and opportunity logic. | **Compare against main/#34/#43**; port only unique tested value, preserving one matcher and useful evidence-based pages. |
| [#11](https://github.com/mattleask373-rgb/life-lived-network/pull/11) | Machine-readable AI-worker task issue template. | **Optional docs/workflow candidate** after comparing with #135/#263 task-claim schema; keep one task form. |
| [#8](https://github.com/mattleask373-rgb/life-lived-network/pull/8) | Stable possibility contract, geospatial scope and supply-engine evaluation tests. | **Review as a core contract/test candidate** with #4; port only if current main lacks the invariant and do not introduce a second possibility/matching authority. |
| [#7](https://github.com/mattleask373-rgb/life-lived-network/pull/7) | Continuous AI engineering operations documentation. | **Historical input, not a runtime implementation.** Consolidate current applicable process into #288/#263 and supersede duplicate operating docs. |
| [#4](https://github.com/mattleask373-rgb/life-lived-network/pull/4) | Adversarial supply-engine evaluation tests and geospatial-scope coverage. | **High-value test candidate** after rebase; ensure it tests the current `findSupply()` implementation without accidental contract drift. |

## Merge-ready evidence checklist

A PR is ready only when all applicable items are true:

- It is based on current main (or has been ported as a minimal, reviewable patch) and the exact diff has been reviewed.
- It has one clear responsibility and does not duplicate another accepted implementation.
- Current-head Verify, CodeQL and dependency checks pass; required database, route or security tests are not silently skipped.
- Independent review is recorded, requested threads are resolved, and repository protection requirements are met.
- Migrations are ordered, replay-tested and rollback-tested in a disposable environment; RLS/ACL tests prove both allow and deny cases.
- Staging and production are isolated and named by a human owner before any load test, deployment or hosted write.
- There is a rollback plan, and the change has a concrete user outcome.

## Work to start next after the integration baseline

1. Close the CI/k6 gap on main, then verify environment-file hygiene.
2. Complete one canonical connection-security/access matrix and disposable-DB proof.
3. Reconcile search intent, exact counts, locality/date-line and stale-record behavior against the current data contracts.
4. Establish one public/private SEO registry and privacy-safe analytics contract.
5. Validate the first real-data market loop: verified supply, eligible terms, consented enquiry, response/completion and support.
6. Only then advance broader control-plane and 24/7 execution proof, app-store/global distribution, and staged traffic-capacity experiments.

**No global-scale or 24/7 claim is earned by a plan, a PR, a workflow, an automation schedule or a green unit-test suite. Evidence from the whole operating loop is the completion criterion.**
