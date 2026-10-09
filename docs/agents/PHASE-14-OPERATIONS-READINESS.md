# Phase 14 Operations Readiness

## Objective

Reach the first operational milestone without granting autonomous production authority:

> the fleet can continuously reconcile bounded work, preserve authenticated scope, use fenced attempts, record evidence, recover stale work, stop at human gates, and present an auditable operator state.

## Readiness gates

| Gate | Required evidence | Current state |
|---|---|---|
| Canonical durable control plane | one reconciled `agent_events` / `agent_tasks` / run / attempt / audit lineage | BLOCKED until #116 integration |
| Authenticated actor | actor derived from trusted server auth boundary | PARTIAL; context contract exists, provenance still needs hosted proof |
| Workspace/project scope | real application membership authority | BLOCKED; fail-closed resolver now exists |
| Lease fencing | generation + opaque token checked on owner mutations | IMPLEMENTED on reconciliation branch; not integrated |
| Attempt identity | run/attempt/task/scope/provider linkage | IMPLEMENTED on reconciliation branch; not integrated |
| Idempotency | correlation + exact duplicate/conflict semantics | IMPLEMENTED on later lineage; hosted proof pending |
| Human approval | scoped, expiring, single-use capability | PURE CONTRACT ADDED; durable consume still requires integration |
| Provider eligibility | lane/capability/autonomy/risk checks | CONTRACT AVAILABLE; provider auth/runtime still gated |
| Hosted security | RLS + client deny + service-role-only RPC proof | PROOF INSTRUMENT ADDED; hosted execution pending |
| Supervisor | durable loop around reconcile → dispatch → heartbeat → verify → recover | bounded cycle adapter added; live runtime not activated |
| Operations console | real task/attempt/evidence/approval telemetry | Lovable surface remains waiting for live integration |
| CI | frozen Bun lockfile + lint/test/build | repository Verify workflow is canonical; exact PR-head evidence pending |

## Operational state machine

`RECONCILE → SCOPE → POLICY → CLAIM/DISPATCH → EXECUTE → HEARTBEAT → VERIFY → EVIDENCE → HANDOFF → RECOVER`

A failure at any gate becomes an explicit HOLD/BLOCKED outcome. No gate may be bypassed by a provider.

## What is allowed at the first activation

- L0-L2 bounded engineering/research tasks.
- Reversible work inside explicit scope.
- Provider execution only after health and capability checks.
- PR creation and evidence collection.
- Automatic stale detection/recovery.
- Human review queues.
- Non-paid experiment preparation.

## Explicitly withheld

- autonomous protected merge;
- production deploy;
- secret creation/escalation;
- security/RLS weakening;
- paid activity;
- commercial contracts;
- public consequential publishing;
- self-approval;
- scope invention.

## Proof target

The first operational proof should show:

1. one authenticated actor;
2. one authoritative application scope;
3. one READY task;
4. one provider passing capability/risk/health checks;
5. one fenced execution attempt;
6. one evidence record;
7. one independent verification;
8. one restart/recovery path;
9. exact audit trail;
10. operator-visible next action.

No “LIVE” state is declared until that chain has real hosted evidence.
