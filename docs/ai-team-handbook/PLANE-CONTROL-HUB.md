# Plane Control Hub Contract

Plane is the operational command surface. Its information must become durable, executable system state rather than remaining trapped in UI or chat.

## Canonical flow

Plane → signed event → validate → idempotency → normalize → agent task → claim/lease → execute → evidence → independent verification → human gate → GitHub PR → CI → human-approved merge.

## Plane should provide

- objective
- acceptance criteria
- priority
- risk
- autonomy
- scope in/out
- dependencies
- owner/backup owner
- agent-ready signal
- human-gate requirement

## Control plane should derive

- task identity
- lifecycle
- provider policy
- owner
- lease and heartbeat
- touched paths
- evidence
- reviewer
- handoff
- blocker
- audit trail

## Configuration principle

Use one canonical lifecycle and explicit fields. Do not make agents infer critical requirements from labels, naming conventions, or conversation.

Plane is not the sole execution engine. A provider outage must not destroy the task; an agent outage must produce safe stale/reclaim behaviour.

When a real Plane API/connector is available, start with observe/read/normalize before write automation. Safe writes can later update progress, blockers, handoffs, and evidence links. High-risk actions remain human-gated.
