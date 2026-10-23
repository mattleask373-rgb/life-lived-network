# Bounded Agent Worker Runtime

**State: implementation core proposed; no provider, database adapter, scheduler, or hosted environment is activated.**

This module is the next layer after the merged durable control-plane schema. It is a single-task runtime core, not a second task queue. It deliberately requires adapters for the canonical task store and the existing fenced RPC boundary.

## Runtime sequence

1. A server worker calls runAgentWorkerCycle with an explicit enable flag, a stable UUID cycle ID, a workload identity, and a fresh environment attestation.
2. The runtime loads the task from the durable store. It ignores caller-supplied task data and accepts only a READY task with explicit objective, workspace/project identity, a non-empty scope, L0-L2 autonomy, and P2/P3 risk.
3. It resolves workspace/project membership from the authenticated actor, requires an exact task-scope match, then checks recent durable-control-plane proof, hosted-security proof, provider health, and absence of an active attempt.
4. It calls one atomic dispatch adapter. That adapter must create/reuse the durable run keyed by the cycle UUID, use the existing dispatch_agent_attempt RPC for the task lease, and return the exact attempt/generation/token it acquired. Do not add local lease state or a second task engine.
5. The provider receives the task scope and attempt metadata, but never receives the private lease token. Execution has a hard timeout and an AbortSignal; a periodic heartbeat uses the same generation/token fence.
6. Invalid, secret-bearing, out-of-scope, or terminal model output is rejected. A heartbeat/fencing failure aborts execution and prevents result persistence. Durable result/failure writes must use the same fence.
7. A successful provider report stops at VERIFYING/REVIEW_REQUIRED. Provider-reported tests are claims, not independent evidence. The runtime cannot set ACCEPTED or INTEGRATED, merge, deploy, or activate production.

## Gates that are intentional

- Disabled unless the operator explicitly enables a feature flag.
- Only fresh, evidenced DISPOSABLE or DEVELOPMENT environments are accepted. Staging and production are rejected in this phase.
- Only workload identity or a server-verified session is accepted. Environment variables, task payload claims and infrastructure project IDs are not identity/scope authorities.
- P0/P1 and any task requiring human approval are held. There is no single-use approval adapter in this phase.
- The provider must be healthy, in-policy, within autonomy/risk ceilings, and capable of the task lane.
- One task attempt per cycle; no automatic retry loop. Recovery/backoff remains a durable supervisor responsibility.

## Adapter work still required before any live run

1. Owner/admin confirms the exact non-production Supabase project and proves it is disposable/isolated. The repository config reference previously did not match either connected Supabase project.
2. Implement server-only adapter methods backed by the canonical control-plane tables/RPCs. Do not expose service-role access to the browser.
3. Close and test dispatch idempotency around ambiguous retries. The current dispatch RPC must be reviewed for its correlation-ID replay path before connecting an unattended runner.
4. Add transactionally fenced result/failure persistence, authenticated workspace/project membership lookup, run lifecycle closure, and provider cancellation semantics.
5. Run the adversarial matrix from issue #117 on the confirmed non-production project: forged/missing actor/scope, duplicate claims, stale heartbeat/generation/token, conflicting duplicate dispatch/result, cancellation, client-role denial, and human-gated task denial.
6. Add an actual provider adapter with a hard provider timeout/cancel implementation and budget limits. No provider credentials are supplied by this module.
7. Only after those gates: add a scheduled worker job with least privilege, observed heartbeat, failure alerts, queue metrics, pause/resume/recovery instructions, and an operator kill switch. The existing hourly read-only probe is not this worker.

## Operational truth

No scheduled worker or provider was activated by this change. A passing unit test means the runtime core enforces these gates under test; it is not proof of hosted schema, a live worker, continuous execution, or production health.
