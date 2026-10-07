# Canonical Task Lifecycle

**Enforcement (single authority):**

| Layer | Location |
|-------|----------|
| Pure policy | `src/lib/agent-state-machine.ts` (`LEGAL_TRANSITIONS`, `evaluateTransition`) |
| Durable RPC | `public.transition_agent_task` (`supabase/migrations/20261007150000_agent_status_transitions.sql`) |
| Claim / lease | `claim_agent_task`, `heartbeat_agent_task`, `release_agent_task`, `mark_stale_agent_tasks`, `reclaim_agent_task` |
| Provider outcomes | `src/lib/agent-execution-contract.ts` (never writes ACCEPTED/INTEGRATED) |

If documentation and code disagree, **code + tests win** until docs are updated.

```
DISCOVERED
    ↓
READY
    ↓
CLAIMED          ← claim_agent_task (lease + heartbeat required)
    ↓
IN_PROGRESS      ← transition (owner + live lease)
    ↓
VERIFYING        ← transition (owner + live lease); tests / lint / typecheck
    ↓
REVIEW           ← transition (owner + live lease)
    ↓
ACCEPTED         ← transition (independent reviewer ≠ owner)
    ↓
INTEGRATED       ← transition (**human only**)
```

**Failure / side states**
- `BLOCKED` — explicit blocker recorded; parallel safe work continues
- `STALE` — lease expired / heartbeat missed (`mark_stale_agent_tasks` or system transition)
- `CHANGES_REQUESTED` — reviewer challenged; returns to IN_PROGRESS
- `ABANDONED` — orphaned after recovery inspection; may return to READY
- `CANCELLED` — explicit cancellation with reason (not yet exposed as RPC)
- `DONE` — **legacy only**; not a legal transition destination

## Transition rules (must be explicit)

| From            | To                  | Who / condition                                      | Required evidence                     |
|-----------------|---------------------|------------------------------------------------------|---------------------------------------|
| DISCOVERED      | READY               | Orchestrator / any agent after triage                | Objective + acceptance criteria       |
| READY           | CLAIMED             | `claim_agent_task`                                   | Owner, lease expiry, scope            |
| CLAIMED         | IN_PROGRESS         | Owner + live lease                                   | Branch or files touched               |
| IN_PROGRESS     | VERIFYING           | Owner + live lease                                   | Handoff draft + tests intended        |
| VERIFYING       | REVIEW              | Owner + live lease                                   | Test/lint/build results               |
| REVIEW          | ACCEPTED            | **Independent reviewer** (actor ≠ owner)             | Review notes + checklist              |
| REVIEW          | CHANGES_REQUESTED   | **Independent reviewer** (actor ≠ owner)             | Specific findings                     |
| CHANGES_REQUESTED | IN_PROGRESS       | Owner + live lease                                   | Response to findings                  |
| ACCEPTED        | INTEGRATED          | **Human only** (`human` or `human:*`)                | Merge evidence                        |
| CLAIMED/IN_PROGRESS/VERIFYING | BLOCKED | Owner + live lease                               | Blocker template                      |
| CLAIMED/IN_PROGRESS/VERIFYING | STALE   | System (`mark_stale` or actor `system`)          | Lease expiry + heartbeat grace        |
| STALE           | CLAIMED             | `reclaim_agent_task`                                 | Preserved work + new claim            |
| STALE           | ABANDONED           | Any agent after inspection                           | Inspection notes                      |
| ABANDONED / BLOCKED | READY           | Any agent                                            | Re-open / blocker cleared             |

### Non-negotiable rules

1. No agent may transition a task to `INTEGRATED` or `ACCEPTED` for its own work.
2. No silent “done”. Provider outcomes are limited to `VERIFYING | BLOCKED | FAILED | PARTIAL`.
3. `CHANGES_REQUESTED` is a **reviewer** transition, not a provider execution outcome.
4. Heartbeat after `lease_expiry` fails. Grace only delays STALE marking; it does **not** allow continued work.
5. Status changes that are ownership-controlled require a durable record (RPC + evidence JSON).

### Deliberately not transition RPCs

- READY → CLAIMED → `claim_agent_task`
- STALE/READY → CLAIMED → `reclaim_agent_task`
- Active → READY/BLOCKED (release) → `release_agent_task`
- Active → STALE (batch) → `mark_stale_agent_tasks`
