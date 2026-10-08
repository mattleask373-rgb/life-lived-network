# Durable reclaim + attempt abandon

**Status: IMPLEMENTED / NOT LIVE / HOSTED PROOF PENDING**

## Contract

`reclaim_stale_agent_task(...)`:

1. Requires task status **STALE** (fail closed otherwise)
2. Validates workspace + project scope
3. Increments `lease_generation`, rotates `lease_token`
4. Marks prior-generation attempts in `DISPATCHED|RUNNING|VERIFYING|STALE` as **ABANDONED**
5. Does **not** rewrite FAILED/SUCCEEDED history
6. Returns task to **READY** for a new fenced claim
7. Appends audit `RECLAIM` evidence

Companion pure policy: `decideReclaimAbandon` in `agent-reclaim-abandon.ts`.

## Safety

- SECURITY DEFINER + `search_path = public`
- REVOKE from PUBLIC / anon / authenticated; service_role only
- No provider call, no DONE/ACCEPTED/INTEGRATED, no merge/deploy

## Related

`mark_stale_agent_tasks` (Phase 3 recovery) → this reclaim → Phase 10/11/12 result/dispatch fencing.
