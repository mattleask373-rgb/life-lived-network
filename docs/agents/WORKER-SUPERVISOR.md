# Bounded Agent Worker Supervisor

**State: isolated supervisor-loop core proposed; no worker is deployed or activated.**

The supervisor is an orchestration loop around the existing bounded single-task runtime in
`src/lib/agent-worker-runtime.ts`. It owns no task state, local queue, identity, lease, database,
or provider. All reads and writes are injected adapters so the eventual server entrypoint must
use the canonical durable agent control plane.

## Contract

- Re-read the operator kill switch every tick. A disabled worker never selects a task.
- Ask the canonical task store for at most one eligible READY task per tick. Selection is bounded
  and deterministic; the runtime's atomic dispatch RPC, not the selection read, obtains the lease.
- Serialize cycles with concurrency fixed at one. Generate a new stable UUID for each invocation.
- Persist a minimal redacted heartbeat before invoking the runtime. If that write fails, do not
  dispatch work. Never include raw exceptions, task content, actor claims, provider output, or lease
  tokens in heartbeat records.
- Poll with a bounded interval and apply capped exponential backoff after adapter/runtime failures.
  There is no local retry queue and no automatic retry of a claimed attempt.
- Stop between cycles on the operator's AbortSignal. The current runtime's own hard deadline remains
  the maximum bound for an in-flight cycle; immediate cancellation requires the server adapter and
  provider to propagate cancellation through the runtime and must be proven separately.
- The supervisor never marks a task accepted/integrated and never grants merge, deploy, SQL, or
  production authority.

## Not yet connected

This module is not a persistent hosted service. Before any rehearsal, implement and independently
review the server-only Supabase adapter, derive actor/workspace/project scope from verified
workload identity and authoritative membership (never task payload claims), prove the actual
disposable/development database identity, wire a real durable kill switch/heartbeat, close run
lifecycle, enforce account/workspace quotas and provider-side spend ceilings, and test cancellation,
fencing, duplicate dispatch, restart/recovery, outage and dead-letter behavior.

Do not claim 24/7 operation until a non-production rehearsal proves scheduler liveness, heartbeat,
fencing, recovery, cancellation, bounded retry/cost, alert routing, kill switch and operator runbook.
