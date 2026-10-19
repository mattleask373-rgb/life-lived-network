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

## 2026-10-19 — current verified execution snapshot

Canonical repository: `mattleask373-rgb/life-lived-network`. Current `main` baseline: `f2de6d8d76bdabbd98639f4bf4837573c96587cc`. No PR has been merged or deployed in this execution slice.

- **PR #175 — place staging validator:** open, not merged. Exact head `2d53309078fe9813efcd5a31ed341c5ae8e45876`. PR Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335580094 . Push Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335578622 . No Australian place inventory has been seeded.
- **PR #173 — gated locality/service-locality:** open, not merged. Exact head `534274a556b67d1d4455cd2c2a7111a19119c1c8`. PR Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335386006 . Push Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335376736 . Dynamic locality/service sitemap candidates are still outstanding; the current sitemap lists static public screens only.
- **PR #176 — reviewed opportunity surfaces:** open, not merged. Code-bearing head `5814e64049779cc1c37ea501ac0a9152437006a0` passed exact-head PR Verify (install, lint, tests and build): https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39337115684 . Exact-head push Verify passed: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39337107458 . The subsequent docs-only commit will need its own fresh exact-head Verify; PR body is the authority for the final head/run links.
- **PR #174 — work opportunity contract:** remains open/unmerged and is based on an older lineage. #176 is the clean current-main opportunity-surface continuation; human review should resolve duplicate scope before merging either.
- **Opportunity publication boundary:** `work_opportunity` remains optional and is parsed at the existing listing normalisation seam. Missing/invalid/unreviewed rights or jurisdiction-policy approval means no public opportunity card. No editor, migration, feed activation, real opportunities or second matcher has been introduced. `findSupply()` remains the discovery authority.
- **Not established:** local shell/browser verification, live sitemap HTTP behavior, live inventory suitability, disposable database proof, legal review, or deployed production behavior. Supabase Preview is skipped when a PR has no associated Supabase branch.

Human decisions remain required for review/merge/deployment, real source-rights and jurisdiction approval, trusted authorship/storage of opportunity review facts, and Australia hierarchy/timezone/provenance semantics.

## 2026-10-19 — enquiry foundation on PR #176 (no direct source contact)

- Added a minimal `RequestMatchLink` on the reviewed work-opportunity surface and service detail sheet. It pre-fills the existing `/need` form with bounded title/category text and makes clear that this creates a user-authored need for the canonical local matching flow; it does not message or identify the listed host.
- Extended the need route's search parser for safe bounded category prefill and added helper tests.
- Added visible save/error/loading states to the existing need form: pending button, `role=alert` failure, saved `role=status` with a link to the newly-created need/matching page. The existing authenticated `createNeed` persistence path is reused; no new schema/API was added.
- Code-bearing head `f22cc7b8ed19d34597e8bc3ea8a7f4a9b220299f` passed exact-head PR Verify [39339094190](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39339094190) and push Verify [39339088114](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39339088114): frozen install, lint, tests and build all passed. The current follow-on commit updates this status only and needs a fresh exact-head run. Existing `findSupplyForNeed` remains responsible for discovery; no direct lookup or recipient inference is performed.

