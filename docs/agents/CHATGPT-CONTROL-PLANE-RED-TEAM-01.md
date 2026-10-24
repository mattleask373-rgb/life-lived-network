# ChatGPT Control-Plane Red Team 01

Status: VERIFIED FROM PR #61 BRANCH SOURCE
Scope: static contract/security audit; no production mutation

## Finding A — owner identity is still caller-controlled

The SQL control-plane functions accept `requested_owner` / `actor` as text and execute as `SECURITY DEFINER`.

The security-grants migration correctly restricts direct RPC execution to `service_role`, but that does not itself prove that the service-side caller identity is bound to the supplied owner/actor.

Therefore:

```
authenticated caller -> service_role wrapper -> arbitrary owner text
```

is still a trust-boundary question.

Acceptance requires proving that the wrapper derives or verifies actor/run identity from the authenticated execution context and enforces task/project/tenant scope.

## Finding B — lease fencing is absent

Claim/reclaim replaces `owner`, lease timestamps and status, but no monotonic lease generation or opaque lease token is visible in the inspected migration.

Therefore an old worker can potentially present its old owner identity after a reclaim unless every mutating completion operation carries an independently checked generation/token.

Required invariant:

```
(task_id, current_lease_generation/token, authenticated_run)
```

must match for every owner-authoritative mutation.

## Finding C — completion authority is not independently durable

The inspected transition path appends evidence to the task row but does not show a separate attempt/completion identity that prevents a late duplicate completion from becoming authoritative after ownership changes.

A durable execution system should distinguish:

- task identity
- lease identity
- execution attempt identity
- evidence identity
- verification identity
- final state-transition identity

These must be linked, not merely stored as free-form strings.

## Finding D — provider capability check is incomplete

`ProviderDescriptor` contains `capabilities`, but `isEligibleProvider()` accepts the task lane without checking that the provider advertises the corresponding capability.

This means routing policy can select a provider whose declared capabilities do not cover the requested lane.

Required fix:

```
required capability(task.lane) ∈ provider.capabilities
```

must be a hard eligibility condition before ranking.

## Finding E — human-required risk logic should be explicit

The current condition rejects a non-human provider only when its risk ceiling is also exceeded.

If policy says a risk class **requires a human**, the safest invariant is:

```
policy.requireHumanFor contains risk
    => provider must be human OR explicit human-gate handoff
```

Do not let a provider's declared risk ceiling override a policy-level human requirement.

## Continuous-operation consequence

The system is not yet proven 24/7-safe merely because scheduled workflows can wake it.

GitHub supports schedules, concurrency groups, protected environments and OIDC identity claims, but those mechanisms are wake-up/security primitives. The durable control plane still has to prove crash recovery and stale-authority rejection.

## Priority

1. P0/P1: authenticated actor/run binding
2. P0/P1: lease generation/token fencing
3. P1: execution-attempt/completion ledger
4. P1: provider capability enforcement
5. P1: hard human-gate routing
6. Then hosted concurrency/recovery verification

No merge, deploy, secret escalation, or human-gate removal is authorized by this note.
