# Agent control-plane migration reconciliation

## Current-main source recheck — 24 October 2026

**Canonical source ref checked:** `main` at `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`. This section supersedes the older 22 October source-presence claims below. It does not replace the owner gate for remote migration history or project identity.

The current main migration tree **does contain** the prerequisite objects previously described as missing in the historical audit:

- [`20261007120000_agent_orchestration.sql`](../../supabase/migrations/20261007120000_agent_orchestration.sql) creates `public.agent_tasks` and `public.agent_events`.
- [`20261007170000_agent_lease_fencing.sql`](../../supabase/migrations/20261007170000_agent_lease_fencing.sql) adds lease generation/token fencing and defines the five-argument heartbeat signature.
- [`20261007171000_remove_unfenced_heartbeat.sql`](../../supabase/migrations/20261007171000_remove_unfenced_heartbeat.sql) removes the unfenced overload and revokes/re-grants the fenced signature.
- [`20261007172000_fence_release.sql`](../../supabase/migrations/20261007172000_fence_release.sql) defines the fenced release function against `public.agent_tasks`.

The earlier statements that those source prerequisites are absent are therefore stale for the checked main SHA and must not be used as current evidence. The current source still needs static signature/grant/RLS review, and the existence of migration files is not proof that any hosted database has applied them.

**Fresh isolated replay evidence:** PR #354 head `d9e6fe78f66729724dc251f7e5d3852623524244` completed [Verify run #40089371399](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40089371399) successfully on 24 October. The run replayed every migration against an empty isolated local Supabase stack, ran `supabase test db --local` (pgTAP), exercised local-discovery RLS through PostgREST, linted database functions, and parsed the k6 script without sending traffic. That head includes current main plus proposed #348/#350/#352/#354 changes, so it is evidence for that combined source sequence in the disposable workflow environment—not a main-only run and not a hosted/production migration-history proof.

**Remote-state boundary remains unchanged:** no hosted project was queried or modified. The owner must identify the actual Supabase project/environment and retrieve its migration history read-only before any hosted migration, repair, or schema/RLS/grant action. Clean replay and upgrade of an already-applied remote database are different cases. Do not merge the heavily divergent `phase3-supervisor-reconciliation` branch wholesale.

Current related proposals remain unmerged and review-gated: #344 is a separate SQL migration/test PR with recorded green local replay but no submitted independent review; #336 is a draft runtime PR that still mixes SQL migration/tests with TypeScript runtime code and is not a persistent 24/7 executor. Keep SQL changes isolated from runtime work, keep public dispatch disabled, and require independent security/database review before any merge decision.



**Audit date:** 22 October 2026  
**Original audit base:** `a99d09f1517523a7a388245ca6b3d5c1245816cb`  
**Reconciliation branch rebuilt on current main:** `1f0a5d2b1c717db6cfc10c63f851a0e428313ee2`  
**Status:** blocked before migration implementation/activation; no database was queried or changed by this source audit.

## Historical audit finding — superseded by the 24 October source recheck

The 22 October audit was performed against an older main snapshot (`a99d09f1517523a7a388245ca6b3d5c1245816cb`) and reported that the tail heartbeat/release migrations lacked earlier prerequisite definitions. That source-level conclusion is **superseded** by the 24 October recheck above for current main `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`: the current migration directory includes the orchestration tables, fenced five-argument heartbeat, and release RPC prerequisites.

The previously recorded Preview error at [run 119790420947](https://github.com/mattleask373-rgb/life-lived-network/runs/119790420947) is historical evidence for the state tested at that time. It must not be presented as a fresh result for current main. Likewise, a skipped Supabase Preview check is not proof of successful migration replay.

The durable schema is now present in repository source. The live environment's applied migration history, effective grants/RLS, project identity, generated deployed types, and operating executor remain distinct unproven facts. A source file or green local replay cannot establish those hosted facts.

## Migration dependency map (candidate lineage)

The filenames/order below were read from that branch. They are candidate artefacts, **not approved for application**.

| Order | Candidate migration | Objects / contract introduced or changed | Prerequisites and risks to verify |
|---|---|---|---|
| 1 | `20261007120000_agent_orchestration.sql` | Creates `agent_events`, `agent_tasks`; initial RLS deny policies for `anon` and `authenticated`; task/event identity and initial status constraints. | Baseline for all subsequent task RPCs. Initial status CHECK is narrower/legacy (`DONE`, etc.) and must be reconciled by later lifecycle migrations. |
| 2 | `20261007133000_agent_claim_leases.sql` | Adds owner, lease start/expiry, heartbeat, evidence, reviewer and handoff columns; defines claim/heartbeat/release RPCs. | Requires `agent_tasks`; includes legacy two-/three-argument heartbeat and release overloads that later migrations replace. |
| 3 | `20261007140000_agent_claim_lease_hardening.sql` | Expands task lifecycle status CHECK; tightens heartbeat, claim, release, stale-marking and reclaim behavior. | Requires the table/columns/RPC lineage from 1–2; validate the exact status domain and expiry/grace semantics. |
| 4 | `20261007150000_agent_status_transitions.sql` | Defines role/state-aware `transition_agent_task`; enforces lease/actor/state transition checks. | Must align with app state machine and owner/reviewer/human/system roles. Review historical transition function signatures and execute grants. |
| 5 | `20261007151000_agent_transition_lease_renew.sql` | Updates transition behavior to renew leases where permitted. | Depends on the transition RPC from 4; same signature is replaced in-place. |
| 6 | `20261007160000_agent_security_grants_and_cancelled.sql` | Revokes public/client execute, grants control-plane RPCs to `service_role`, adds guarded CANCELLED transitions. | Expects the exact prior overloads to exist. Reconcile the later fencing signatures so no obsolete client-callable overload remains. |
| 7 | `20261007170000_agent_lease_fencing.sql` | Adds `lease_generation` and `lease_token`, append-only completion evidence, and fenced transition/claim/reclaim/heartbeat RPCs. | Depends on task/lease schema. Verify all final overloads and SECURITY DEFINER search paths/grants. |
| 8 | `20261008010000_agent_execution_identity.sql` | Creates run, attempt and audit tables; adds identity, scope and completion telemetry with client-deny RLS and service-role grants. | Depends on `agent_tasks`; actor/workspace/project fields are claims, not by themselves proof of authoritative membership. |
| 9 | `20261008020000_agent_dispatch_boundary.sql` | Adds `project_id`; creates atomic `dispatch_agent_attempt` RPC to validate run/task scope, claim work, create attempt and audit event. | Depends on task, run, attempt and fencing schema. RPC is service-role only and explicitly does not authenticate its caller; trusted server adapter must derive identity/scope. |
| 10 | `20261008023000_agent_task_lifecycle_reconciliation.sql` | Replaces status CHECK with the canonical lifecycle domain. | Must be checked against every RPC, TypeScript state machine and existing/queued task statuses. |
| 11 | `20261008030000_agent_stale_recovery_rpc.sql` | Replaces stale-marking/recovery to clear expired lease tokens and record attempt/audit evidence. | Depends on all prior task, fencing, attempt and audit objects. Verify one transaction/fencing behavior and idempotency. |

Current `main` additionally has the 17:10 and 17:20 tail migrations above, plus later unrelated connection-request migrations (12 October and 22 October). The source branch also contains dozens of application and documentation files; copy only individually reviewed artefacts in a current-main-based consolidation.



## Dispatch idempotency and attempt creation — 24 October 2026

Source inspection at the current-main SHA found two independent dispatch hazards that must be addressed before enabling any worker:

1. `agent_execution_attempts.attempt_id` is a UUID primary key with no default in `20261008010000_agent_execution_identity.sql`, but the original `dispatch_agent_attempt` INSERT omits `attempt_id`. An explicit `gen_random_uuid()` default is required for a fresh dispatch to insert an attempt.
2. The original correlation replay returned the existing attempt's live `lease_token` and `DISPATCHED` status. A caller could interpret an exact retry as permission to call a paid provider again. Merely checking that the original lease is active does not make an external side effect idempotent.

The canonical SQL candidate is [PR #344](https://github.com/mattleask373-rgb/life-lived-network/pull/344), which now proposes the UUID default, full correlation scope checks, and a metadata-only `REPLAYED` return with `lease_token = NULL`. Its pgTAP test checks that retry/reuse returns no token, creates no second attempt/audit row, rejects task/run/provider collisions, and leaves the original lease generation/token unchanged. PR #336 is now runtime-only to avoid carrying a second competing implementation of the same SQL contract.

PR #344 is temporarily stacked on [PR #358](https://github.com/mattleask373-rgb/life-lived-network/pull/358), whose Verify workflow runs independent validation after a high/critical dependency-audit finding but still fails the required `verify` status at a final gate. This stack is for diagnostics only. Before merge review, the owner/maintainer must integrate the approved dependency fix through the protected branch, retarget #358/#344 to the resulting main SHA, and rerun exact-head checks.

**Validation boundary:** the earlier #354 Verify [#40089371399](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40089371399) passed empty local Supabase migration replay, pgTAP, local-discovery RLS via PostgREST, database-function lint, and k6 parse-only on a combined candidate stack based on feature branches. It is useful disposable evidence for that exact stack and commit `d9e6fe78f66729724dc251f7e5d3852623524244`, not proof that current main or a hosted database contains/applies the same lineage. The updated #344 SQL test needs a fresh exact-head replay after the metadata-only contract changed.

No hosted migration/history query or schema mutation was performed for this source review. Do not activate dispatch, connect a provider, merge, deploy, or infer hosted identity from repository state.

## Trust-boundary observations

1. The server-side candidate lease adapter sends a Supabase service-role key and calls task RPCs. It must never be imported by client code; the credential must remain server-only and unlogged.
2. The candidate dispatch SQL accepts actor/workspace/project arguments but its own header explicitly says it does not authenticate the caller. A service-role RPC parameter is not an authorization authority. Trusted application authentication and workspace/project membership must be derived server-side; when no real membership authority exists, scope must fail closed.
3. Client-role RLS deny policies and explicit EXECUTE revokes/grants must survive consolidation for every table and function signature, including old overloads.
4. Source-of-truth identity is unresolved: repository `supabase/config.toml` currently contains a project ID, but that does not prove which project is connected to the hosted deployment or the migration history already applied there.
5. Historical PR “merged” state is not sufficient. The control-plane branches are heavily divergent; current main’s migration tree and live database migration history are separate evidence sources.

## Safe reconciliation workflow

### Phase A — read-only inventory (can proceed now)

- Record exact Git SHAs and blob SHAs of current-main migrations, all 11 candidate migrations, later tail migrations, TypeScript adapters, state-machine contracts and generated DB types.
- Produce a function inventory: qualified name, argument types/defaults, return type, SECURITY DEFINER/search_path, owner and execute grants for every overload.
- Produce an object dependency graph and reconcile table/status CHECK evolution, column names, foreign keys, uniqueness/idempotency, RLS policies and role grants.
- Compare generated types and RPC argument names to the final SQL signatures. No live DB write is needed for this phase.

### Phase B — migration history decision (owner gate)

Before deciding how to repair, an authorized owner must identify the exact non-production/production project and retrieve its migration history read-only. Do not assume `supabase/config.toml` is the production target.

Two cases must be distinguished:

- **Clean replay:** ordered lineage from an empty local/disposable database must succeed, including the original schema, status evolutions, function signatures, grants and final fenced release/heartbeat.
- **Already-applied remote history:** reconcile which versions actually applied and whether the missing SQL existed out-of-repository. Do not blindly add earlier timestamped versions, edit a migration that may already be applied, use migration repair, or issue DDL until the remote history and upgrade strategy are reviewed.

An approach that passes only clean replay may still fail against a database with recorded historical versions, and the reverse is also possible.

### Phase C — disposable proof (owner target confirmation required)

On an explicitly identified disposable Supabase project after a reviewed migration candidate exists, prove:

- fresh replay and representative upgrade path;
- generated types and exact RPC signatures;
- forged/missing actor and scope rejection;
- client `anon`/`authenticated` cannot read/write tables or execute RPCs;
- two concurrent claims yield exactly one owner;
- stale heartbeat/token/generation rejected; reclaim increments generation and replaces token;
- old attempts cannot mutate reclaimed tasks;
- duplicate result is idempotent, conflicting duplicate rejected, cancelled task cannot resurrect;
- dispatch cannot cross workspace/project scope; and human-required work cannot be auto-dispatched;
- rollback/restore and kill-switch/revocation behavior.

Evidence must include commit SHA, migration versions, confirmed environment identity (never credentials), exact test outputs and SQL/RPC errors. A skipped Preview job is not evidence.

## Decision and activation gates

- Do not merge the divergent supervisor branch wholesale.
- Do not run schema/ACL/RLS/grant changes on a hosted project until its identity and migration history are confirmed and the change is reviewed.
- Keep executor activation, provider calls, automated merges/deployments and external side effects disabled until this lineage and issue #117's hostile-role proof pass, with independent review and explicit owner approval.


## Current-main reconciliation candidate — 22 October 2026

A new draft branch `agent/chatgpt/control-plane-reconciliation-current-main-2026-10-22` restores the eleven ordered candidate migrations onto current main without merging the divergent supervisor branch wholesale. It also includes:

- a follow-up migration that removes the legacy three-argument heartbeat overload (the existing 17:10 tail only drops the two-argument overload);
- final SECURITY DEFINER search-path hardening for the authoritative RPC signatures;
- final explicit client-role table/function revokes plus service-role grants;
- a fix to the read-only hosted-proof function so missing relations are evaluated with `to_regclass`, not unsafe `'name'::regclass` casts;
- a static test that checks file order, table/function dependency signatures, client-deny/RPC-grant policy and both legacy heartbeat overloads.

**These are repository-source tests, not SQL replay or hosted proof.** The branch must remain draft. The missing migrations have historical timestamps earlier than other migrations already on main. An authorized owner must inspect the actual remote migration-history table and identify the connected project before any migration push/repair. Clean replay and upgrade of an already-applied remote database are different cases; do not blindly execute this branch on a hosted project.


## Current-main source rebuild — 22 October 2026

The proposed migration/test/documentation files in this branch have been rebuilt directly on current `main` at `1f0a5d2b1c717db6cfc10c63f851a0e428313ee2`, instead of carrying the old divergent commit history. The current main migration directory contains the existing `20261007171000_remove_unfenced_heartbeat.sql` and `20261007172000_fence_release.sql` tail plus later connection-request migrations; no filename collision was found for the candidate's added migration filenames. This is a source-order inventory only. It does not establish which migration versions a hosted database has applied, and it is not replay, upgrade, grants/RLS verification, or deployment evidence.


## Execution evidence refresh — 24 October 2026

**Current-main ref:** `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`.

A fresh read of the current-main migration directory confirms these source files are present:

- `20261007120000_agent_orchestration.sql` creates `public.agent_tasks` and `public.agent_events`, enables RLS on tasks, and installs the no-client-access policy.
- `20261007170000_agent_lease_fencing.sql` contains the fenced task-transition and lease implementation, including task-completion storage.
- `20261007171000_remove_unfenced_heartbeat.sql` drops the legacy two-argument heartbeat and restricts execution of the five-argument fenced signature.
- `20261007172000_fence_release.sql` drops the unfenced release overload and grants the five-argument fenced release function only to `service_role`.

This corrects any reading of the current source that says those prerequisite files are absent. It is still **repository-source evidence only**: it does not establish which versions a hosted database has applied, nor whether a remote migration-history table is consistent with these filenames.

### Isolated replay evidence

The stacked candidate at PR #354 head `d9e6fe78f66729724dc251f7e5d3852623524244` completed Verify run [#40089371399](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40089371399) successfully. That workflow replayed the proposed stack against an empty isolated local Supabase database and ran its database tests. This is useful clean-replay evidence for the candidate stack; it is **not** proof of hosted migration history, deployment, or authorization to apply the migrations remotely. PR #354 remains an unmerged draft and is based on the locality/security stack.

### Remaining executor conflict and dependency gate

- PR #336 remains an unmerged runtime proposal at `253c9590a2682b3c82dc407dce402fffbdce82cf`. Its current Verify run [#40089642228](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40089642228) failed at the locked dependency audit before runtime tests or SQL replay.
- PR #344 remains an unmerged SQL proposal at `f2e680675641b791959931a16a2b3efd2ee8468c`. Its exact replay contract differs from #336: #344 returns an existing live lease token for an exact retry, whereas #336 emits a metadata-only `REPLAYED` marker without a lease token. These contracts must be reconciled and tested; neither is authorized for hosted execution.
- Current `main` still has the older Zod/Undici dependency baseline. PR #353 proposes Zod `4.6.7` and Undici `7.30.1`; its recorded Verify [#40085945708](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40085945708) and CodeQL [#40085945605](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40085945605) passed on its exact head, but it remains draft and has no approving review.
- The current draft audit PR #339 has no submitted reviews or inline review threads. Its latest Verify [#40089757320](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40089757320) and CodeQL [#40089757296](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40089757296) failed overall at the dependency-audit gate.

Do not claim a continuous executor. A scheduler, authenticated provider adapter, persisted heartbeat, lease fencing across dispatch/heartbeat/release, idempotent attempts, cancellation, capped retry/spend, dead-letter visibility, kill switch, and recovery still require isolated environment proof and independent review. No hosted mutation, provider call, or deployment is authorized by these results.


## Current source and operations status — 24 October 2026

**Latest canonical main:** 70a3e261b18e3be5e90429e4ad4defd1fd8008c7. Main Verify [#40094349108](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40094349108) and CodeQL [#40094349114](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40094349114) pass.

The earlier source recheck above named main SHA 182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f. Its statement about repository source at that SHA is historical; recheck filenames and effective diff before relying on it for any current migration decision. Migration files in Git still do not prove remote applied history.

- Current worker candidate #359, head 5940f20054ad38cd380ef04767bd7d8fe4fc85db, passes Verify [#40096233954](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40096233954) and CodeQL [#40096233948](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40096233948). CI used an isolated local Supabase stack. The candidate still has no live scheduler, trusted deployed adapter, continuous liveness/alert evidence, or production execution proof.
- Current locality consumer candidate #362 passes Verify [#40095183795](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095183795) and CodeQL [#40095183720](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095183720); current membership-administration candidate #363 passes Verify [#40095409897](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095409897) and CodeQL [#40095409761](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40095409761). Those runs establish candidate behavior on local disposable databases, not hosted grants, project identity or remote migration history.
- The owner must confirm the production project and a separate disposable project before any remote migration-history inspection, rehearsal, membership provisioning or schema/RLS change. Do not deploy, write hosted data, or activate production dispatch from a green local replay alone.
