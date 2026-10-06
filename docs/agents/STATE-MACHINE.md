# Canonical Task Lifecycle

```
DISCOVERED
    ↓
READY
    ↓
CLAIMED          ← lease + heartbeat required
    ↓
IN_PROGRESS
    ↓
VERIFYING        ← tests / lint / typecheck / eval
    ↓
REVIEW           ← independent reviewer (ChatGPT or human)
    ↓
ACCEPTED
    ↓
INTEGRATED       ← human merge only
```

**Failure / side states**
- `BLOCKED` — explicit blocker recorded; parallel safe work continues
- `STALE` — lease expired / heartbeat missed
- `CHANGES_REQUESTED` — reviewer challenged; returns to IN_PROGRESS or VERIFYING
- `ABANDONED` — orphaned after recovery inspection; may be reclaimed
- `CANCELLED` — explicit cancellation with reason

## Transition rules (must be explicit)

| From            | To                  | Who / condition                                      | Required evidence                     |
|-----------------|---------------------|------------------------------------------------------|---------------------------------------|
| DISCOVERED      | READY               | Orchestrator / any agent after triage                | Objective + acceptance criteria       |
| READY           | CLAIMED             | Agent claims with lease                              | Owner, lease expiry, scope            |
| CLAIMED         | IN_PROGRESS         | Claimant starts work + first heartbeat               | Branch or files touched               |
| IN_PROGRESS     | VERIFYING           | Claimant finishes implementation                     | Handoff draft + tests intended        |
| VERIFYING       | REVIEW              | Verification passes (or fails documented)            | Test/lint/build results               |
| REVIEW          | ACCEPTED            | Independent reviewer accepts                         | Review notes + checklist              |
| REVIEW          | CHANGES_REQUESTED   | Reviewer challenges                                  | Specific findings                     |
| CHANGES_REQUESTED | IN_PROGRESS       | Claimant resumes                                     | Response to findings                  |
| ACCEPTED        | INTEGRATED          | **Human only**                                       | Merge evidence                        |
| *               | BLOCKED             | Any agent encountering hard blocker                  | Blocker template                      |
| CLAIMED/IN_PROGRESS | STALE          | Heartbeat timeout / lease expiry                     | System or observer detection          |
| STALE           | READY / CLAIMED     | Recovery / reclaim after inspection                  | Preserved work + new claim            |
| *               | ABANDONED           | Recovery decides work is orphaned                    | Inspection notes                      |

No agent may transition a task to `INTEGRATED` or `ACCEPTED` for its own work without independent review.
No silent “done”. Status changes require durable record (task file, issue comment, or PR).
