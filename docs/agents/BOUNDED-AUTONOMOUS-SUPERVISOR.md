# Bounded Autonomous Execution Supervisor Contract

Status: DESIGN / NOT LIVE

## Purpose

Provide the repository contract for unattended bounded engineering without granting merge, deploy, production, or human-approval authority.

## Operating loop

```
RECONCILE → SELECT → AUTHENTICATE → CLAIM → EXECUTE → HEARTBEAT
       ↑                                      ↓
       └── RECOVER ← EVIDENCE ← VERIFY ← HANDOFF
```

Every cycle must have a durable run/attempt identity and an explicit task scope.

## Authority model

| Capability | Supervisor |
|---|---|
| discover READY work | yes |
| claim scoped task | yes, after authenticated identity |
| execute L0-L2 bounded work | yes, when policy permits |
| heartbeat/recover stale work | yes |
| collect evidence | yes |
| request independent review | yes |
| accept own work | no |
| consume human approval issued by itself | no |
| merge main | no |
| deploy production | no |
| mint production credentials | no |
| change security boundaries | no |

## Required durable identities

Every attempt binds:

- actor_id
- run_id
- attempt_id
- workspace_id
- project_id
- task_id
- lease_generation
- lease_token
- correlation_id

Provider identity is metadata, never the authority source.

## Reconciliation rules

Before each dispatch:

1. Re-read current task state.
2. Reject cancelled/blocked/human-gated work.
3. Verify scope and dependencies.
4. Verify lease ownership.
5. Verify provider capability against task lane/risk.
6. Create one idempotent attempt.
7. Only then invoke the runner.

Duplicate dispatch with the same correlation/run identity must not create a second active attempt.

## Recovery

A crashed or expired worker cannot continue by heartbeat.

Recovery is:

1. detect expiry + grace;
2. mark STALE;
3. preserve evidence;
4. reclaim with a new generation/token;
5. record the recovery attempt;
6. route to an eligible provider or human.

## Human gates

The supervisor may detect and queue a human gate but cannot satisfy it.

Human-gated categories include merge, deploy, production credentials, security/RLS changes, destructive migrations, regulated-category decisions, and product-truth changes.

## Evidence

A successful bounded attempt must leave:

- task/run/attempt identifiers
- actor and scope
- changed paths or explicit no-change result
- tests/checks executed
- provider result
- uncertainty/unknowns
- handoff
- recommended next action
- timestamps and lifecycle transitions

No evidence means no success claim.

## Failure semantics

Provider timeout, crash, or malformed output is a durable failed attempt, not silent success.

Retries require a new attempt identity and must respect retry policy. Consequential work is never automatically retried without an explicit policy permitting it.

## Completion criterion

This contract becomes LIVE only after deterministic tests, CI, migration verification, RLS verification, and hosted adversarial evidence satisfy issue #98.

Until then:

**AUTONOMY = DESIGN / NOT LIVE**
