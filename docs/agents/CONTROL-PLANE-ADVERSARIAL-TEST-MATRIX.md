# Control-Plane Adversarial Test Matrix

This is a provider-neutral, deterministic test specification for the fenced execution trust chain.

## Capability routing

| Case | Task lane | Provider capability | Expected |
|---|---|---|---|
| C1 | IMPLEMENTATION | implementation | eligible |
| C2 | IMPLEMENTATION | research only | reject |
| C3 | SECURITY | security_audit | eligible |
| C4 | SECURITY | implementation only | reject |
| C5 | REVIEW | review | eligible |
| C6 | REVIEW | implementation only | reject |

Invariant: provider selection MUST enforce the requested lane against declared provider capability. Metadata alone is not authorization.

## Human gate

| Case | Risk | requireHumanFor | Provider | Expected |
|---|---|---|---|---|
| H1 | P0 | P0 | human | eligible |
| H2 | P0 | P0 | AI | reject |
| H3 | P1 | P1 | AI | reject |
| H4 | P1 | empty | provider ceiling >= P1 | eligible |
| H5 | P1 | empty | provider ceiling P2 | reject |

Invariant: explicit human requirement is absolute. Provider risk ceiling can constrain non-gated work but cannot satisfy a hard human requirement.

## Lease fencing

Initial state: task T, worker A, lease generation G1.

1. A claims T under G1.
2. A begins attempt A1.
3. A disappears.
4. Recovery marks G1 stale.
5. B claims T under G2.
6. B begins attempt B1.
7. B records evidence E2.
8. Delayed A sends heartbeat/evidence/transition with G1.
9. Every A mutation MUST fail.
10. B remains authoritative.

Invariant: task id + current lease generation/token + authenticated execution identity must match atomically for every owner mutation.

## Attempt binding

- Evidence E1 produced by attempt A1 cannot be attached to B1.
- Verification V1 cannot verify an attempt other than its bound attempt.
- Replaying completion for A1 must be idempotent.
- A completion from an expired/fenced lease must fail closed.
- Two different attempts must never become indistinguishable because they share one task id.

## Identity binding

Reject when caller-supplied identity differs from authenticated execution identity.

Reject cross-workspace/project mutation even when the caller knows the target task id.

Reject human approval identifiers from a different scope.

Never treat a free-form actor string as proof of identity.

## Provider result boundary

Provider output is evidence, not authority.

Reject provider attempts to emit terminal acceptance/integration.

Reject self-review.

Require structured evidence for VERIFYING.

Preserve uncertainty and unsupported claims rather than promoting them to fact.

## GitHub Actions trust integration

GitHub OIDC exposes actor, actor_id, repository, repository_id, workflow, run_id, run_attempt, environment and related claims. Trust policies should constrain the claims used for federation; GitHub explicitly warns that at least one condition is needed so untrusted repositories cannot obtain access. Actions concurrency can serialize work, while environments can enforce approvals and branch restrictions. These mechanisms should feed the repository control plane, not replace its durable authority.

## Pass condition

The system must be able to stop a worker anywhere in the sequence, restart another worker later, and prove from durable records which execution context is currently authoritative.

A test passes only if stale, forged, replayed, cross-scope and incapable execution attempts fail closed without weakening human gates.
