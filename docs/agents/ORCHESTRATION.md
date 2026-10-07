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

## Provider routing

provider: auto selects the least constrained eligible runner.

Example policy:

- L0/L1: any approved model runner.
- L2 implementation: coding-capable runner with repository access.
- L3 verification/review: independent runner from the implementation runner where possible.
- P0 security / regulated / architectural change: human approval gate before execution or integration.
- No eligible runner: leave the Plane item READY/BLOCKED; do not silently make the human become the missing automation.

This is the key resilience rule: provider outage changes queue throughput, not architecture.

## Agent result contract

Every runner returns:

    task_id: <id>
    status: VERIFYING | BLOCKED | CHANGES_REQUESTED
    summary: <short>
    files_touched: []
    decisions: []
    tests:
      - command: <command>
        result: pass | fail | not-run
        evidence: <short>
    risks: []
    blockers: []
    next_safe_step: <single concrete action>
    review_request:
      questions: []
    provider:
      name: <runner>
      model: <model-or-unknown>

The result is written back to the task record/Plane and, for implementation work, the branch/PR.

## Claim ownership

The existing CLAIM-LEASE-HEARTBEAT.md remains canonical.

The orchestrator must never infer ownership from a model conversation. A task is owned only after a durable claim exists with:

- task ID
- owner
- lease
- heartbeat
- scope
- dependencies
- risk
- acceptance criteria

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
