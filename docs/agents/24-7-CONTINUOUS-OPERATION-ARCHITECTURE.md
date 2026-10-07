# 24/7 Continuous Operation Architecture

Status: EXPERIMENTAL architecture target
Authority: human-controlled repository gates remain authoritative

## Decision

Do not create a second repository solely to obtain continuous operation.

The existing repository already contains the beginnings of a durable control plane. A second repository would split state, identity, evidence and operational history.

The system should instead become **continuous-capable** by making the existing control plane durable, recoverable, provider-neutral and independently verifiable.

## The actual 24/7 chain

```
authenticated actor/run
        |
        v
scoped task
        |
        v
lease generation + fencing token
        |
        v
execution attempt
        |
        v
evidence ledger
        |
        v
independent verification
        |
        v
authorized state transition
        |
        +----> recovery / retry / human attention
```

These are not merely fields travelling together. The security hypothesis is that each transition must be cryptographically or transactionally bound to the authority that was valid for that transition.

## Required invariants

### Identity
- Actor identity comes from the authenticated boundary, not caller-supplied owner text.
- Run identity is unique and bound to actor + task.
- Project/tenant scope is derived or verified server-side.
- Approval identity is bound to the gated transition.

### Ownership
- Every active task has a current lease generation/token.
- Heartbeats require current ownership.
- Completion/status mutation requires the current lease generation/token.
- A stale worker cannot mutate a task after reclaim.

### Idempotency
- External events have stable idempotency keys.
- Execution attempts have stable attempt IDs.
- Completion/evidence writes reject duplicate completion of the same attempt.
- Retries cannot silently create a second authoritative outcome.

### Epistemics
- Execution output is evidence, not truth.
- Verification may promote a claim only when the required evidence exists.
- UNKNOWN cannot silently become REAL.
- Failed, stale or removed evidence remains visible in the audit trail.

### Authority
- Provider capability is checked before selection.
- Human-required risk cannot be routed around by a provider descriptor.
- Merge, deployment, destructive changes, security/privacy changes and other protected operations remain human-gated.

## Continuous operation model

A scheduler is only a wake-up mechanism.

The durable loop should be:

1. wake;
2. reconcile incoming events;
3. inspect READY/CLAIMED/STALE work;
4. reclaim only fenced stale work;
5. select an eligible provider;
6. create an execution attempt;
7. execute within bounded authority;
8. persist evidence;
9. verify;
10. transition state atomically;
11. create recovery/human-attention work when necessary;
12. sleep until the next wake-up.

A crash between any two steps must be recoverable from persisted state.

## GitHub Actions boundary

GitHub Actions is suitable for scheduled/event-driven wake-ups, concurrency controls and protected environments. It is not, by itself, the durable execution database.

Use Actions as an orchestrator/trigger where useful, while keeping authoritative task, lease, attempt, evidence and approval state in the existing control plane.

Protected environments and concurrency should remain aligned with the repository's human-gate policy.

## Provider independence

No provider should own the system's memory or truth.

A provider may:
- propose work;
- execute a bounded task;
- return evidence;
- fail;
- time out;
- become unavailable.

The control plane must survive provider replacement.

## Failure matrix

| Failure | Required result |
|---|---|
| Worker crashes | Lease eventually becomes stale; work is recoverable |
| Worker returns late | Fenced mutation rejected |
| Provider times out | Attempt remains durable; task can be recovered/routed |
| Duplicate event | Idempotent no-op |
| Duplicate completion | Rejected or resolved idempotently |
| Provider unavailable | Route to another eligible provider or human |
| Control-plane wake-up delayed | Durable state remains recoverable |
| Human unavailable | Preserve blocked attention; never bypass gate |
| Evidence disappears | Epistemic state cannot silently strengthen |
| Scope mismatch | Authorization failure, no state mutation |

## First falsification experiment

Prove this race:

1. Worker A claims task T with lease generation G1.
2. A stops heartbeating.
3. T becomes stale.
4. Worker B reclaims T with generation G2.
5. A resumes and submits completion using G1.
6. The control plane must reject A's mutation.
7. B's G2 completion must remain authoritative.
8. The audit trail must preserve both attempts and the rejected stale mutation.

If this cannot be proven, the system is not yet safe for continuous autonomous execution.

## Non-goals

This document does not authorize:
- autonomous merge;
- production deployment;
- secret/credential escalation;
- removal of human approval;
- weakening RLS/security;
- self-modification of safety policy;
- creation of a second control plane.

## Current status

The repository contains substantial control-plane implementation in PR #61, but the identity/fencing/evidence chain still requires proof at the authenticated service boundary and in the hosted environment.

Issue #91 tracks the 24/7 architecture target.

## Success condition

The system is not considered 24/7-capable because a workflow runs every few minutes.

It is 24/7-capable when it can **stop anywhere, restart later, recover from persisted state, reject stale authority, preserve evidence, and continue safely without fabricating progress**.
