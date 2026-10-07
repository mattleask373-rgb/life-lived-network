# Agent System Status — 2026-10-07 (Grok audit pass)

## CURRENT QUEUE

- **P0:** restore/verify the canonical `src/lib/supply-engine.ts` implementation before any discovery work is treated as healthy.
- **LW-20261007-001:** Provider-neutral orchestration control plane — IN PROGRESS (claim/lease hardened; provider registry + execution contract added).

## ACTIVE

- Owner: Grok (adversarial review + implementation) after ChatGPT Phase A ingress
- Task: LW-20261007-001
- Branch: `agent/orchestrator/LW-20261007-001-provider-neutral`
- Scope this pass:
  - adversarial review of claim/lease/heartbeat
  - status domain alignment with STATE-MACHINE.md
  - STALE + reclaim recovery path
  - sliding-lease heartbeat
  - provider-neutral selection policy (no hard-coded provider dependency)
  - execution evidence contract (no silent "done")
  - pure unit tests for lease policy, provider policy, execution validation

## DECISIONS

- Plane is the work-control plane, not the sole inference provider.
- Plane AI is an execution option, not an architectural dependency.
- Claim exclusivity is atomic SQL on `status = 'READY'`.
- Reclaim is STALE/READY only; live ownership is never overwritten.
- Heartbeat is a sliding lease (extends `lease_expiry`).
- Provider selection is policy-driven (`selectProvider` / `isEligibleProvider`).
- Provider results must pass `validateExecutionResult` before acceptance into the control plane.

## PROBLEMS FOUND (this pass)

1. Initial claim migration status CHECK omitted STALE, IN_PROGRESS, REVIEW, etc.
2. No mark-stale or reclaim function — recovery after crash was impossible.
3. Heartbeat did not extend lease; tasks > lease duration silently expired.
4. Redundant unique index on task_id for active statuses (task_id already UNIQUE).
5. No unit tests for ownership concurrency semantics.
6. No structured execution evidence boundary.

## REMAINING RISKS

- SQL functions are SECURITY DEFINER; EXECUTE grants should be confirmed service-role-only in deployed environments.
- Live Supabase RPC behaviour is not exercised in CI (pure policy tests only).
- Webhook secret and service-role key must remain outside the repo.
- Full failure-recovery matrix (provider timeout storms, review rejection loops) not yet automated.
- Status transition API for CLAIMED → IN_PROGRESS → VERIFYING → REVIEW is not yet a single RPC surface.

## NEXT SAFE STEP

1. Human: apply migrations on a staging Supabase and smoke-test claim / dual-claim / stale / reclaim.
2. Agent: add a thin status-transition RPC (start_work, submit_for_verify) with the same owner+lease guards.
3. Keep execution providers disabled until the live Plane webhook is manually verified.
