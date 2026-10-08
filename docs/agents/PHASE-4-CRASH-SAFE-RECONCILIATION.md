# Phase 4 — Crash-safe Reconciliation Kernel

**Status: IMPLEMENTED / NOT LIVE / HOSTED PROOF PENDING**

## Purpose

Provide a pure, deterministic decision surface that recovers from:

- expired leases
- heartbeat-stale leases
- orphaned DISPATCHED / RUNNING attempts
- cross-run or out-of-scope lease snapshots

so that a future supervisor cycle can safely return a task to READY without
ever treating a crashed attempt as successful.

## Contract

1. Input is a set of durable lease/attempt snapshots plus a recovery policy.
2. Output is an explicit list of RecoveryDecision values.
3. Decisions are one of:
   - `HOLD` — leave the lease alone
   - `RELEASE_STALE_LEASE` — fence the generation/token for later durable release
   - `MARK_ATTEMPT_ABANDONED` — record that an in-flight attempt did not complete
   - `RECOVER_READY` — signal that the task surface may become READY again
4. The kernel never mutates storage, never calls a provider, never claims a
   new lease, never promotes any attempt to DONE/ACCEPTED/INTEGRATED, and
   never consumes human approval.
5. Cross-run and out-of-scope snapshots are refused (HOLD).
6. All decisions are deterministic given the same snapshots + policy + `now`.

## Explicit non-goals

- Live lease claiming or renewal
- Provider execution
- Durable writes (those stay in the authenticated server boundary)
- Automatic merge / deploy
- Inference of missing external facts
- Weakening of human gates or RLS

## Proof still required

- CI green on the exact head of this branch
- Hosted Supabase migration + RLS verification for any future durable recovery RPCs
- Concurrent recovery race testing against the live database
- Wiring of RELEASE / ABANDONED / RECOVER decisions into the existing
  authenticated dispatch + attempt ledger (Phase 3)
- Independent human review and merge

Until those are proven the 24/7 executor remains **NOT LIVE**.

## Lineage

Stacked on Phase 3 (`phase3-supervisor-reconciliation`) which itself sits on
Phase 2 provider-neutral execution and the authenticated durable control plane.

Related: #97, #98, #101, #102, #103.
