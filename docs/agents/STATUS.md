# Agent System Status — 2026-10-07 (control-tower reconciliation)

## SOURCE OF TRUTH

Repository evidence on `main`, GitHub Actions, open PRs, and canonical contracts are authoritative.
No autonomous production merge/deploy is active.

## CURRENT QUEUE

### P0 / HUMAN-GATED CONTROL PLANE
- **Persistent autonomous executor:** MISSING. The repository contains provider-neutral orchestration and lease/fencing contracts, but no evidence yet proves a durable authenticated executor loop.
- **PR #61 — provider-neutral orchestration:** open; formatting fixes and lockfile reconciliation have been pushed. Fresh Verify is required.
- **PR #62 — claim/lease/heartbeat:** open; formatting fixes and lockfile reconciliation have been pushed. Its lifecycle contract still requires reconciliation with durable `agent_tasks.status` and expiry/fencing semantics before integration.
- **PR #64 — lease fencing / provider authorization hardening:** open; package/lockfile reconciliation pushed. Known security gates remain: authenticated owner/run binding, approval_id-bound human integration, tenant/project scoping, and live Supabase migration/RLS verification.
- **No production execution authority, autonomous merge, or deploy authority is enabled by this status file.**
- **#74 — CONTROL-PLANE-01:** open human-gated follow-up for the missing/proven durable persistence boundary, authenticated fencing and RLS reconciliation.

### AI-NATIVE PROGRAMME
- **PR #67 — ProgrammeState:** open; implementation is green on its prior head, but the current hosted Verify surface must be rechecked after branch/base reconciliation.
- **PR #69 — Experiment Engine:** open draft; current head contains formatting/syntax fixes. Hosted Verify currently fails before lint/test/build on frozen-lockfile reconciliation in the PR merge context; no green claim until a fresh run passes.
- **PR #72 — lockfile reconciliation:** open draft; one-line manifest fix to align `@lovable.dev/vite-tanstack-config` with the lockfile. Human action remains required; not merged.
- **PR #73 — accepted experiment → bounded task adapter:** open draft; intentionally no execution/persistence/provider authority.

### PRODUCT / REAL-WORLD SURFACE
- **Canonical supply engine:** REAL and live on main. `src/lib/supply-engine.ts` contains the real deterministic `findSupply()` implementation and regression tests. It is the sole possibility/discovery authority.
- **Ingestion architecture:** `src/lib/ingest/*` remains the canonical provider-neutral boundary. PR #49 is the reconciliation anchor; PR #43's parallel `external-world.ts` path must be absorbed/retired before integration.
- **Map/locality:** PR #54 visual language, #57 map-first locality integration, #60 sparse-locality progressive disclosure remain human-gated. #57 depends on #54; #58 depends on #49.
- **Journey trust:** PR #59 hardens stale/cancelled journey eligibility and remains human-gated.
- **Search context:** PR #52 preserves search intent into canonical locality discovery without creating a second matcher.

## VERIFIED CURRENT FINDINGS

- Main no longer has the historical supply-engine stub; the canonical implementation and tests are present.
- No second matcher/ranker/discovery engine is authorized.
- Unknown/absence remains distinct from real-world absence.
- No fabricated inventory, availability, demand, learner capability, or external-world activity is permitted.
- Human gates remain required for production autonomy, security/RLS/privacy, irreversible semantics, external side effects, legal/commercial consequences, and consequential learner decisions.

## CI / DRIFT

- PR #61 latest failed Verify because lint ran and reported formatting-only Prettier errors; those files have now been formatted. A subsequent run must also clear the frozen-lockfile mismatch.
- PR #62 latest failed Verify on formatting-only Prettier errors; those files have now been formatted. No new Verify result is yet evidenced.
- PR #64 latest Verify failed at `bun install --frozen-lockfile`; its branch declared `@lovable.dev/vite-tanstack-config` 2.25.x while the lockfile resolves 2.26.0. Manifest reconciliation has been pushed.
- PR #67 latest observed Verify failed at frozen-lockfile because its branch manifest still differed from the lockfile in the hosted merge context. This is a CI/base-drift issue, not a ProgrammeState behaviour failure.
- PR #69 latest observed Verify failed at frozen-lockfile in the hosted PR merge context. The head manifest already declares 2.26.0; fresh hosted verification is required to determine whether the merge ref still inherits a stale manifest/lock combination.
- PR #72 Verify is green on its exact head, but the fix is not merged.
- Product PRs #54/#43/#49 are based on an older main lineage; #52/#57/#58 are intentionally dependent/diverged. Do not flatten those dependencies without review.

## NEXT

1. Re-run/observe fresh Verify on #61/#62/#64 after formatting + manifest reconciliation; diagnose only remaining behavioural/security failures.
2. Reconcile #62's lifecycle model with the durable SQL status contract and authenticated fencing boundaries before any integration.
3. Reconcile #43 into #49's canonical ingest boundary; preserve useful fixture/normalization/freshness/provenance evidence while retiring the parallel architecture.
4. Keep #72, #69, #67, #73 and all control-plane work human-gated; no merge performed by the control tower.


## 2026-10-20 — reusable market onboarding checklist (documentation PR)

- Added `docs/launch/MARKET-ONBOARDING-CHECKLIST.md` on branch `codex/market-onboarding-checklist-2026-10-20`, branched from canonical `main` at `9269dff0fb66911733ea309fd7342d86bb60c112`.
- The checklist defines market gates for geography and canonical URLs; ISO country/currency, integer minor units, locale and IANA timezone; taxonomy and local work-law distinctions; source terms, attribution and media rights; moderation/privacy; current supply-engine integration; shared page/sitemap indexability; non-writing import validation, idempotency and rollback; minimum regression coverage; and named human go/no-go ownership.
- This is process documentation only. No application code, place rows, listings, events, job opportunities, credentials, partner feeds, schema, RLS/grants, production writes, merge or deployment changed.
- Australia remains NOT LIVE. The checklist explicitly states that successful staging/schema validation is not proof of inventory and does not authorize publication.
- PR #179 is open. Hosted Verify [#39420348546](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39420348546) passed on exact head `aea2555291799403b4ea68f6b6c4be2afc62948e`: frozen install, lint 0 errors / 7 existing warnings, 41 test files / 320 tests, and production build. This record is a point-in-time evidence snapshot; any subsequent commit must be checked on its own exact head before merge. No local shell/test run is claimed.
- Human decisions remain required for pilot locality hierarchy, source-rights decisions, local employment/policy review, minimum verified-record threshold, currency/timezone choices, owner assignments and final release approval.


## 2026-10-20 — 31 October critical-path evidence refresh

Canonical repository remains `mattleask373-rgb/life-lived-network`; observed main baseline is `9269dff0fb66911733ea309fd7342d86bb60c112`. No main merge or deployment was performed by this workstream.

### Exact-head hosted Verify snapshot

- SEO gate + gated locality/service sitemaps (#173): head `94870d5b087f1939dbc4372588ee0be7f7f2e25f`, Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39427722990.
- Work contract + traveller taxonomy (#174): head `cd8f9442429568e669424f649af40348c7efc74c`, Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39424411630.
- Australia proposed hierarchy + non-writing validator (#175): head `bc4119e2aaaf323f1545e42052f5efad7bb7151f`, Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39427760586.
- Opportunity surfaces (#176): head `5944f38a54b36f808de823bc293f383f086e64a4`, Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39425558654.
- Visual/cards/place-picker PR (#177): head `9e513856f4e8f67ac205ecaabfdea82b164087b2`, Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39416122486; **manual 375px/1280px keyboard/screen-reader review remains outstanding**.
- Market onboarding checklist (#179): current head before this evidence refresh `92af351d9345bc59caf434cf7f4a34317f55cb28`, Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39420467819. This documentation update changes the branch head; rerun Verify on the new head before treating it as current evidence.

### Integration order / state

1. #177: human accessibility and provenance review before merge.
2. #174: review engagement/pay/volunteer contract and jurisdictional policy.
3. #176: review surfaces, truthful account-gated need prefill, and source/rights conditions.
4. #173: review the shared pure gate, metadata/sitemap symmetry, fail-closed reads, and route integration after its dependencies.
5. #175: staging-only proposed locality manifest. Australia remains **NOT LIVE**; pending hierarchy, rights, provenance, boundary, timezone semantics and coordinate review are not approvals.

GitHub currently reports #173–#179 as open and the relevant implementation PRs as mergeable in the observed snapshot. Mergeability is not review approval. No local test, live crawl, deployed sitemap, disposable-database proof, production data write, merge, or deployment is claimed here. Hosted Verify is CI evidence only.
