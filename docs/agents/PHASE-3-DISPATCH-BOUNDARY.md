# Phase 3 — Supervisor Reconciliation + Dispatch Boundary

**Status: IMPLEMENTED / HOSTED PROOF PENDING / NOT LIVE**

Phase 3 advances the 24/7 control plane one layer beyond provider-neutral
execution (Phase 2). It adds two pure decision kernels and one server-only
durable boundary.

## 1. Supervisor selection (`reconcileSupervisor`)

Pure function over durable task snapshots → explicit `DISPATCH` | `HOLD`.

- READY only
- workspace + project scope checks
- autonomy policy (L0–L2)
- human-gated risks (P0/P1 held)
- active-attempt protection
- lease-boundary protection (any existing lease state → HOLD)
- deterministic correlation IDs (`dispatch:{runId}:{taskId}`)
- idempotency via existing correlation set

Never claims, never calls providers, never mutates storage.

## 2. Crash recovery (`reconcileRecovery` + `authorizeReclaim`)

Pure recovery decisions:

- `MARK_STALE` when lease expired **and** heartbeat grace exceeded
- `HOLD` for cancelled work, successful attempts (need verification),
  missing project scope, or still-within-grace leases
- `authorizeReclaim` permits `RECLAIM` **only** from authoritative `STALE`
  status (never from CLAIMED / READY / BLOCKED directly)

Stale marking and reclaim remain distinct lifecycle events. A stale worker
is never revived by these functions.

## 3. Durable dispatch boundary (`dispatch_agent_attempt` RPC + server adapter)

Server-only, SECURITY DEFINER RPC:

1. Authenticated execution context (actor + run + workspace) is supplied
   upstream — this module never trusts browser-supplied actor ids.
2. Run must exist and be ACTIVE; actor/workspace/project must match.
3. Task must be READY and match scope.
4. Autonomy L0–L2 only; P0/P1 rejected.
5. Atomic lease fence (generation + token) and single DISPATCHED attempt
   per correlation id (replay returns existing attempt).
6. Append-only audit record.

## Explicit non-goals

- Authenticate browser input
- Invoke a provider
- Declare DONE / ACCEPTED / INTEGRATED
- Consume human approval
- Merge / deploy
- Mint production credentials
- Modify discovery / matching
- Live 24/7 executor activation

## Proof still required

- Hosted Supabase migration execution + RLS / SECURITY DEFINER verification
- Authenticated middleware → run creation integration
- Concurrent dispatch + recovery race testing against the live database
- Provider execution wiring (Phase 2 runtime)
- Full CI green on the exact head
- Independent human review and merge

Until those are proven the 24/7 executor remains **NOT LIVE**.

## Lineage

Stacked on Phase 2 provider-neutral execution and the authenticated durable
control plane.

Related: #97, #98, #101, #102, #103.
