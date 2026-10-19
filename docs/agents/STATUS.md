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


## Australia place staging foundation — 2026-10-19 (source review pending)

- Added a pure, bounded `normalizeStagedPlaceBatch()` pipeline and tests for stable source-key identity, unique slugs, complete parent references, acyclic hierarchy, IANA timezone syntax, coordinate bounds, country/currency codes, source provenance, freshness, rights clearance, and deterministic output.
- The report never creates canonical database IDs or writes data; every row remains `not_published`. Even an eligible report is only eligible for a separately approved disposable-database preview.
- Added `docs/launch/AUSTRALIA-STAGING-VALIDATION.md` with official source candidates and outstanding crosswalk/approval steps. No Australia records or coordinates are seeded. Byron Bay requires NSW source review; Agnes Water and Port Douglas require source-row confirmation from Queensland's gazetteer.
- **Launch blocker:** the existing `Place` type requires one timezone per row; country-level timezone semantics must be resolved before creating an Australia country row. Do not assign one zone to all Australia or guess a coordinate/datum.
- No production import, write, schema/RLS/grant change, deployment, or live-market claim.

## PR #175 Verify repair — 2026-10-19

- Canonical base now verified: `main` at `f2de6d8d76bdabbd98639f4bf4837573c96587cc`. The PR head before base integration was `a99acaa7fcd9b8877f4100246137423f85b7c55a`.
- Exact pre-fix Verify runs `39330526786` and `39330526939` failed at `bun run lint`; frozen-lockfile installation passed (473 packages installed). The only errors on that head were two Prettier rules in `src/lib/place-staging.ts` (lines 183 and 206). No tests/build were reached.
- Formatting-only repair: `660fcd1b2a3423d84ea27307daf01032e56b3f10`. No feature, dependency, or lockfile changes.
- Push Verify on `8c1461d08b50f3721cc1d4788eb36d667daa74f4` passed at run `39334870150`. The paired PR merge-context run failed because `src/lib/geo-scope.test.ts` in main still had one Prettier-only formatting error. Current main was merged into this feature branch at `e8d7c94a58b226952531518cb194f4f25550dbef`, and the remaining formatting-only correction was committed as `9b1b628436cb616026b9a8bb6a74ad5a88976714`. Both push Verify [39335326404](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335326404) and PR Verify [39335332611](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335332611) passed on that exact head. No package or lockfile change was required.


- Current-main integration + formatting-only cleanup verified: code-bearing head `9b1b628436cb616026b9a8bb6a74ad5a88976714`; push Verify [39335326404](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335326404) and PR Verify [39335332611](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335332611) both green. The last change was only documentation of this evidence; re-check the documentation head before review.


- Latest hosted Verify evidence before this status refresh: PR head `29b582952c52cb8768318fccba09488051b9c4d4` passed PR Verify [39335447101](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335447101) and push Verify [39335444665](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335444665); install, lint, tests and build all passed. This entry updates status only; the resulting documentation head must also be checked.

## Australia pilot staging skeleton — 2026-10-19 (unpublished, not preview-eligible)

- Added `src/lib/staging/australia-skeleton.ts` and tests alongside the green staging validator. It contains six proposed hierarchy rows: Australia, New South Wales, Queensland, Byron Bay, Agnes Water and Port Douglas.
- Every candidate is explicitly `not_published`; coordinates are `null`; source retrieval/version, licence, attribution and redistribution review are blank; all source review statuses are pending and rights are unreviewed.
- Uses `AU` / `AUD`. Local timezone strings are candidates only (`Australia/Sydney` for Byron Bay/NSW and `Australia/Brisbane` for Agnes Water/Port Douglas/Queensland). Australia country-level timezone is deliberately unresolved/null rather than asserting one zone for a multi-zone country.
- The state-to-locality hierarchy is coarse and proposed, not approved; replace with the source-verified administrative-parent crosswalk after review.
- A regression test runs the skeleton through `normalizeStagedPlaceBatch()` using blank provenance/retrieval placeholders and proves that it is rejected. It is not an import-ready batch and cannot qualify for even a disposable preview.
- No coordinates, place rows, live listings, production writes, schema/RLS/grant changes, merge or deployment.
- Human decisions: approve locality inclusion and exact hierarchy; retrieve the official NSW/Queensland source rows and versions; review licence/attribution/redistribution rights; resolve country-level timezone semantics; validate timezone candidates; review CRS/datum before coordinates enter any later batch.

