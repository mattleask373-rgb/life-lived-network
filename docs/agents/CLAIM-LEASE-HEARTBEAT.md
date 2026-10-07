# Claim / Lease / Heartbeat Protocol

An agent does **not** own a task merely by declaring “I am working on this.”

Ownership is durable and exclusive. Concurrency is enforced by atomic SQL
`UPDATE … WHERE status = 'READY'` (claim) and by reclaim only accepting
`STALE` or `READY` rows.

## Required fields on every active task

```yaml
task_id: LW-YYYYMMDD-NNN          # unique durable ID
objective: <one sentence>
owner: <agent or human id>
backup_owner: <optional>
status: CLAIMED | IN_PROGRESS | VERIFYING | ...
lease_start: ISO-8601
lease_expiry: ISO-8601            # default 4 hours for implementation; sliding on heartbeat
last_heartbeat: ISO-8601
scope_in: [paths, modules, concerns]
scope_out: [explicit exclusions]
dependencies: [task_ids]
touched_paths: []
acceptance_criteria: []
risk_level: P0 | P1 | P2 | P3
product_invariants: []            # e.g. "journey ≠ availability"
evidence: []
reviewer: <agent or human>
handoff: <link or inline>
blocker: null | {why, evidence, required, owner}
```

## Operations

**CLAIM**
1. Search open tasks, PRs, recent commits, active claims for overlap.
2. If overlap → do not claim; assist, review, wait, or negotiate.
3. Call `claim_agent_task(task_id, owner, lease_minutes)`.
   - Succeeds only when `status = 'READY'` (atomic single-winner).
   - Returns the updated row, or empty set if lost the race.
4. Create branch named `agent/<owner>/<task_id>-short-slug` if implementation is required.

**HEARTBEAT** (sliding lease)
- Claimant must call `heartbeat_agent_task` at least every 30 minutes of active work (or on every substantive commit).
- Successful heartbeat:
  - requires matching owner
  - requires status in (`CLAIMED`, `IN_PROGRESS`, `VERIFYING`)
  - requires `lease_expiry > now()`
  - sets `last_heartbeat = now()` and **extends** `lease_expiry` by `extend_minutes` (default 240)
- Heartbeat after expiry fails; mark STALE then reclaim.

**RELEASE**
- Voluntary release via `release_agent_task` returns task to READY (or BLOCKED if reason given).
- Clears owner and lease fields. Preserve work (branch, commits, handoff).

**EXPIRE / STALE**
- System (or any recovery agent) calls `mark_stale_agent_tasks(heartbeat_grace_minutes)`.
- Transition to STALE when:
  - status in active ownership, AND
  - `lease_expiry < now()`, AND
  - `last_heartbeat < now() - grace` (default grace 45 min)
- Preserve branch, commits, and any handoff notes.
- Pure policy helper: `evaluateStale()` in `src/lib/agent-lease-policy.ts`.

**RECLAIM**
1. Inspect preserved work (branch, PR, files, handoff).
2. Decide: continue, abandon, or re-scope.
3. Call `reclaim_agent_task` — succeeds only for `STALE` or `READY`.
4. Never silently overwrite active non-stale work (CLAIMED / IN_PROGRESS / VERIFYING with live lease).

**BLOCK**
Use the blocker template (see HANDOFF.md). Then continue with non-overlapping work.

## Concurrency model (verified by design)

| Scenario | Outcome |
|----------|---------|
| Two agents claim READY simultaneously | One UPDATE wins; loser gets empty result |
| Heartbeat by non-owner | No row updated |
| Heartbeat after lease expiry | No row updated; must STALE → reclaim |
| Reclaim while still CLAIMED with live lease | No row updated |
| mark_stale while still within grace | No transition |
| Duplicate webhook for same event_id | Idempotent; one task |

## Default lease durations (adjustable per risk)

- P0 security: 2 h
- Implementation: 4 h (sliding via heartbeat)
- Review only: 2 h
- Research/audit: 6 h

## Code map

| Concern | Location |
|---------|----------|
| SQL claim / heartbeat / release / stale / reclaim | `supabase/migrations/20261007133000_agent_claim_leases.sql` + `20261007140000_agent_claim_lease_hardening.sql` |
| Server wrappers | `src/lib/agent-lease.server.ts` |
| Pure policy + tests | `src/lib/agent-lease-policy.ts`, `src/lib/agent-lease-policy.test.ts` |
