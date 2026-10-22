# Agent control-plane migration reconciliation

**Audit date:** 22 October 2026  
**Canonical main reviewed:** `a99d09f1517523a7a388245ca6b3d5c1245816cb`  
**Status:** blocked before migration implementation/activation; no database was queried or changed by this source audit.

## Executive finding

The two agent-related tail migrations on current `main` assume prerequisites that are absent from the current main migration tree:

- `supabase/migrations/20261007171000_remove_unfenced_heartbeat.sql` drops the legacy two-argument heartbeat, then executes `REVOKE ALL ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER, BIGINT, TEXT) FROM PUBLIC`. Current main contains no earlier creation of that five-argument signature.
- `supabase/migrations/20261007172000_fence_release.sql` defines a release function returning `SETOF public.agent_tasks`, but current main has no earlier creation of `public.agent_tasks` in its migration history.

A previous Supabase Preview run failed on the missing heartbeat overload at the REVOKE statement ([recorded run](https://github.com/mattleask373-rgb/life-lived-network/runs/119790420947)). Preview is skipped in many current checks because preview-branch creation is disabled; a skipped check is not proof.

The candidate lineage is on `phase3-supervisor-reconciliation`, at the source commit observed during this audit `87b82ac717f683da7c3bce6f29131f14d705324a`. GitHub compare reported **108 commits ahead / 639 behind main** and 66 changed files. It is not safe to merge that branch wholesale.

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
