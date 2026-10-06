# ADR 002: Durable Agent Control Plane

**Status:** Accepted  
**Date:** 2026-10-06

## Decision
Multi-agent development is coordinated by a durable control plane consisting of:
- Explicit task lifecycle (STATE-MACHINE.md)
- Claim / lease / heartbeat ownership (CLAIM-LEASE-HEARTBEAT.md)
- Required structured handoffs (HANDOFF.md)
- Specialist lanes as boundaries, not silos (SPECIALIST-LANES.md)
- Hard invariants that are automatic failure conditions (INVARIANTS.md)
- Observability status and metrics (OBSERVABILITY.md)
- GitHub Issues/PRs/labels as shared durable memory
- Architecture Decision Records in `docs/adr/`

## Consequences
- No invisible work.
- Stale agents are recoverable without permanent blockage.
- Independent review is mandatory before acceptance.
- No autonomous merge to main.
- Progressive autonomy is gated by measured reliability.
- Conflicts are resolved by evidence → contracts → invariants → ADR → human.

## Alternatives considered
- Pure chat-based coordination → rejected (not durable, not recoverable).
- Fully autonomous agents with merge rights → rejected (safety, human authority).
