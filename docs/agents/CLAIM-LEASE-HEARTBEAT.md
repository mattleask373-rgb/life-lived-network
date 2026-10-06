# Claim / Lease / Heartbeat Protocol

An agent does **not** own a task merely by declaring “I am working on this.”

## Required fields on every active task

```yaml
task_id: LW-YYYYMMDD-NNN          # unique durable ID
objective: <one sentence>
owner: <agent or human id>
backup_owner: <optional>
status: CLAIMED | IN_PROGRESS | ...
lease_start: ISO-8601
lease_expiry: ISO-8601            # default 4 hours for implementation
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
3. Create/update task record with owner + lease.
4. Create branch named `agent/<owner>/<task_id>-short-slug` if implementation is required.

**HEARTBEAT**
- Claimant must update `last_heartbeat` at least every 30 minutes of active work (or on every substantive commit).
- Heartbeat may be a comment on the task issue/PR or an update to the task file.

**RELEASE**
- Voluntary release returns task to READY (or BLOCKED if reason given). Preserve work.

**EXPIRE / STALE**
- If `now > lease_expiry` **and** `now - last_heartbeat > heartbeat_grace` (default 45 min) → mark STALE.
- Preserve branch, commits, and any handoff notes.
- Record “stale ownership” with last known state.

**RECLAIM**
1. Inspect preserved work (branch, PR, files, handoff).
2. Decide: continue, abandon, or re-scope.
3. New claim with fresh lease.
4. Never silently overwrite active non-stale work.

**BLOCK**
Use the blocker template (see HANDOFF.md). Then continue with non-overlapping work.

Default lease durations (adjustable per risk):
- P0 security: 2 h
- Implementation: 4 h
- Review only: 2 h
- Research/audit: 6 h
