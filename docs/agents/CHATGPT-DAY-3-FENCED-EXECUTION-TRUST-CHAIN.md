# ChatGPT Day 3 — Fenced Execution Trust Chain

## Status

ACTIVE — control-plane frontier.

## New architectural result

The control plane should not treat identity, scope, lease, attempt, evidence and authority as separate safeguards that happen to coexist.

They should form one durable trust chain:

```
authenticated actor/run
        ↓
scoped task
        ↓
lease generation / fencing token
        ↓
execution attempt
        ↓
evidence
        ↓
verification
        ↓
authority transition
```

A mutation is valid only when the whole chain refers to the same execution context.

## Verified repository evidence

PR #61 already contains:

- durable `agent_events` receipt ledger;
- durable `agent_tasks` queue;
- atomic READY claim;
- heartbeat/release/stale/reclaim functions;
- guarded task status transitions;
- structured provider execution evidence;
- explicit prohibition on provider self-approval;
- capability metadata;
- human integration state.

The next frontier is therefore **binding**, not another queue or another AI kernel.

## Five control-plane findings

1. **Identity binding** — SECURITY DEFINER functions still receive owner/actor as caller-supplied text. Service-role-only execution does not itself prove that the supplied identity equals the authenticated execution identity.
2. **Lease fencing** — timestamps and owner checks exist, but the inspected schema has no visible monotonic lease generation or opaque fencing token. Delayed workers therefore need a stronger stale-authority invariant.
3. **Attempt identity** — task evidence is durable, but the inspected transition path does not expose a distinct attempt/completion identity connecting execution, evidence and verification.
4. **Capability enforcement** — providers advertise capabilities, but `isEligibleProvider()` currently does not enforce that the requested task lane is present in the provider capability set.
5. **Hard human gate** — `requireHumanFor` must be tested as an absolute routing constraint rather than something a provider risk ceiling can partially satisfy.

## Falsification experiment

Worker A claims task T under lease generation G1.

1. A starts execution.
2. A becomes unreachable.
3. Recovery marks the lease stale.
4. Worker B reclaims T under G2.
5. B executes and records evidence.
6. A returns and submits a delayed heartbeat, evidence or transition using G1.
7. The control plane must reject A.
8. B remains authoritative.
9. Both attempts remain auditable.

A passing implementation must also reject:

- actor impersonation;
- cross-scope task mutation;
- replayed completion;
- evidence from the wrong attempt;
- incapable provider selection;
- non-human execution where policy explicitly requires human handling;
- reviewer self-approval.

## Architectural consequence

This is the point where the system can move beyond "durable task queue" toward a **fenced execution substrate**.

The substrate should make stale authority impossible to confuse with current authority.

That is more valuable than adding another autonomous kernel because every future provider, worker, scheduler and AI-native kernel can inherit the same trust boundary.

## External evidence

GitHub Actions provides useful identity and orchestration primitives: OIDC exposes claims such as repository, workflow, actor, run ID and run attempt; trust policies can constrain which workflows receive federated access. GitHub Actions also provides concurrency and protected environments. These are useful enforcement layers, but they do not by themselves prove the repository's durable execution semantics. The database/control plane must remain authoritative.

## Next safe work

- derive the smallest provider-neutral execution-envelope contract;
- write deterministic pure tests for stale-worker rejection and capability/human-gate routing;
- map the contract onto the existing SQL boundary without recreating existing migrations;
- verify hosted identity binding before any execution activation;
- preserve all human gates.

## Non-goals

No autonomous merge, deploy, permission escalation, secret changes, RLS weakening, production activation or self-modification of safety policy.

## Final test

The system is progressing only if it can prove not merely that work is queued, but that **only the currently authorised execution context can advance that work**.
