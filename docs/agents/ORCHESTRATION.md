# Provider-Neutral Agent Orchestration

## Purpose

The Living World development system must continue operating when any single AI surface is unavailable, rate-limited, or out of credits.

Plane is the work-control plane. It owns work-item state, priority, assignment, dependencies and human-visible history. It is not the only place where model inference may happen.

The execution layer is provider-neutral:

- Plane Agents may execute bounded tasks when credits are available.
- External model runners may execute the same task contracts.
- Human agents may perform the same task manually.
- Switching execution provider must not change the task lifecycle or product invariants.

## Runtime topology

                         HUMAN
                           |
                           v
                    +-------------+
                    |    PLANE    |
                    | work state  |
                    +------+------+
                           |
                 v2 webhook / API / MCP
                           |
                           v
                +----------------------+
                | ORCHESTRATOR / QUEUE |
                | idempotency + claims |
                +----------+-----------+
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
      Product/PM       Architect        Implementer
       runner           runner            runner
          |                |                |
          +----------------+----------------+
                           |
                     independent review
                           |
                           v
                         HUMAN

Plane's current developer platform provides REST API, webhooks, MCP and an agent framework, so the integration should use those stable boundaries rather than depending on Plane's internal AI-credit mechanism.

## Phase A implementation

The repository exposes a provider-neutral Plane ingress at:

    POST /api/agents/plane-webhook

It requires `PLANE_WEBHOOK_SECRET` and accepts the configured Plane signature header. The receiver records every accepted webhook in the durable `agent_events` ledger before dispatching, and uses the database uniqueness constraint on `event_id` as the concurrency-safe idempotency gate. Agent-ready work is normalized into `agent_tasks`.

No model credentials are required at ingress. No runner is invoked yet; this boundary deliberately stops at a durable READY task.

## Claim / lease (Phase A+)

Durable ownership is implemented in:

- `supabase/migrations/20261007133000_agent_claim_leases.sql`
- `supabase/migrations/20261007140000_agent_claim_lease_hardening.sql`
- `src/lib/agent-lease.server.ts`
- `src/lib/agent-lease-policy.ts` (pure policy + tests)

See CLAIM-LEASE-HEARTBEAT.md for the concurrency table.

## Provider registry

Providers implement a neutral interface (`src/lib/agent-provider.ts`):

```
Provider
  id, capabilities, maxAutonomy, maxRiskWithoutHumanGate
  costClass, reliabilityClass
  health()
  execute(task) → AgentExecutionResult
  cancel?(taskId)
```

Selection is policy-driven (`selectProvider` / `isEligibleProvider`). Example descriptors exist for tests only; they are not auto-registered runners.

Do not hard-code a single vendor into the control plane. Removing Plane AI credits, Grok, or OpenAI must only change throughput, not architecture.

## Execution evidence contract

Every runner returns a structured `AgentExecutionResult` (`src/lib/agent-execution-contract.ts`):

- status is limited to VERIFYING | BLOCKED | CHANGES_REQUESTED | FAILED | PARTIAL
- silent DONE / ACCEPTED / INTEGRATED is rejected by `validateExecutionResult`
- VERIFYING requires evidence (tests, claims, or changed paths)
- claims with non-unknown confidence require `supportedBy`
- handoff and recommendedNextAction are mandatory

Provider output is evidence. Independent review and human gates remain the path to ACCEPTED / INTEGRATED.

## Event model

The bridge subscribes to the smallest useful set of Plane v2 events:

- work-item creation/update
- assignment changes
- comments/mentions where needed
- state changes relevant to the workflow

Plane v2 webhooks provide a stable event_id for deduplication, delivery_id for delivery attempts, previous_attributes for updates, and an HMAC signature. The receiver must verify the signature before doing any work.

### Idempotency

event_id is the idempotency key.

Processing rules:

1. Verify HMAC signature against the raw request body.
2. Reject invalid signatures.
3. If event_id has already been processed, return success without executing again.
4. Persist the event before dispatching work.
5. A retry must never create a second claim or second agent run.

## Dispatch contract

The orchestrator converts a Plane work item into a normalized task envelope:

    task_id: LW-YYYYMMDD-NNN
    source:
      system: plane
      workspace_id: <uuid>
      project_id: <uuid>
      work_item_id: <uuid>
      event_id: <uuid>
    objective: <single sentence>
    lane: PRODUCT | ARCHITECTURE | IMPLEMENTATION | QA | SECURITY | REVIEW
    autonomy: L0 | L1 | L2 | L3 | L4
    risk: P0 | P1 | P2 | P3
    scope_in: []
    scope_out: []
    dependencies: []
    acceptance_criteria: []
    invariants: []
    evidence_required: []
    provider: auto

The provider field is a routing decision, not part of product truth.

## Failure handling

### Provider failure

Return the task to READY or BLOCKED with a provider-health reason. Preserve all evidence.

### Runner timeout

Do not immediately retry the same task against the same runner. Mark the attempt failed, inspect the preserved work, and either reclaim or route to another eligible provider.

### Three identical failures

Create a diagnosis task. Do not continue thrashing.

### Plane unavailable

The repository control plane remains usable locally/GitHub-side, but no new Plane state transition should be fabricated. Queue locally and reconcile once Plane returns.

### Orchestrator unavailable

Plane remains usable as the source of work state. Manual execution remains possible.

### Stale ownership / worker crash

`mark_stale_agent_tasks` → inspect → `reclaim_agent_task`. See CLAIM-LEASE-HEARTBEAT.md.

## Human gates

Human approval is mandatory for:

- merge to main
- architectural invariant changes
- privacy/security model changes
- regulated-category behaviour
- production credentials/secrets
- destructive migrations
- changes that alter product truth semantics

## Definition of done for this layer

The orchestration layer is complete when:

1. A Plane event can be received and verified.
2. Duplicate webhook delivery is harmless.
3. A work item becomes a normalized task envelope.
4. A runner can claim it with a lease.
5. A runner can produce a durable handoff.
6. A different runner can independently review it.
7. Human integration remains the final gate.
8. Removing Plane AI credits does not stop the lifecycle.
9. Stale ownership is recoverable without silent overwrite.
10. Provider results cannot silently declare done without evidence.
