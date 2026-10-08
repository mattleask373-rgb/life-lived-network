# Phase 14 Operations Handoff

**State:** IMPLEMENTED / CI NOT VERIFIED / HOSTED NOT VERIFIED / NOT LIVE

## Current branch
`chatgpt/phase14-live-proof-20261008`

## Current PR
#115 — fail-closed authoritative scope + operations proof substrate

## Current blocker
Issue #116 must reconcile the canonical durable control-plane lineage into main. The repository has no proven application-level workspace/project membership authority, so scope currently fails closed.

## Components added in this sprint
- `agent-scope-resolution.ts`
- `agent-operations-gate.ts`
- `agent-supervisor-cycle.ts`
- `human-approval-contract.ts`
- hosted proof migration `20261008100000_agent_control_plane_hosted_proof.sql`
- adversarial unit tests
- this readiness/operations documentation

## Next operator sequence
1. Human review of #115/#116.
2. Reconcile migrations and generated types.
3. Identify/implement the actual application membership authority.
4. Deploy to a non-production environment.
5. Execute hosted adversarial matrix.
6. Wire the smallest authenticated provider adapter.
7. Turn on a single L0-L2 bounded task.
8. Verify restart/recovery and operator telemetry.
9. Expand only after evidence supports it.
