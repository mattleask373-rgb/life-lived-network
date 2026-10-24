# AI Draft Assist — quota and incident runbook

**Status:** Proposed implementation. The database migration is not applied to any environment. Exact project identity, disposable-database replay, provider-side spend controls and independent security review are still required.

## Application limit proposed in this change

- **5 attempts per signed-in account per fixed UTC hour**
- **20 attempts per signed-in account per fixed UTC day**
- Every validated, sufficiently long request consumes one attempt, including attempts rejected after the cap. Short/invalid input and an enabled emergency stop do not consume a quota.
- Counters contain only account ID, UTC window starts, aggregate counts and update time. The table does not store prompts, completions, auth tokens, IP addresses or provider payloads.
- The database RPC derives identity from `auth.uid()`; it does not accept a caller-supplied user ID. A single row lock/upsert serializes concurrent requests across server instances.
- Missing, errored or malformed quota evidence fails closed before the AI provider module is imported. A valid quota denial returns the typed `RATE_LIMITED` result and sets HTTP status `429`, a positive `Retry-After` header in seconds, and `Cache-Control: no-store`. Exact-head CI must verify this source contract; a hosted request-level smoke is still needed before treating the deployed transport as proven.

These are starting guardrails, not an estimate of sustainable capacity or a provider cost ceiling. Review thresholds against actual usage and the provider's price/terms before enabling broader access.

## Release steps (all required)

1. Confirm the exact deployed app SHA, target Supabase project ID, environment, migration history, and whether staging shares any production credentials or side effects. Record those facts in the release issue.
2. Apply the migration in a **named disposable Supabase project only** first. Replay the complete ordered migration chain from clean and upgrade states.
3. Verify no direct table access from `anon`, `authenticated` or `service_role`; no RLS policy exposes counters; only authenticated callers can execute the function; the function cannot accept a spoofed user ID.
4. Run concurrent, replayed and cross-instance tests at the 4/5/6 hourly and 19/20/21 daily boundaries, plus UTC hour/day rollover, deleted account, unauthenticated JWT and DB/RPC outage cases. Verify limit counters remain atomic.
5. Independently review SECURITY DEFINER ownership, search path, grants, table RLS, foreign-key deletion and rollback. A static migration contract test is not database replay proof.
6. Configure provider-side spending limits and alerts in the AI gateway/provider control plane, with named recipients and tested alert delivery. This repository change does **not** set a provider budget or guarantee provider-side alerts.
7. Keep `DRAFT_ASSIST_DISABLED=true` until Steps 1–6 pass and the release owner authorizes activation. Confirm the emergency stop can be set in every runtime instance/edge and has a documented propagation bound.
8. Start with the account caps above and inspect aggregate counts/denials and provider usage without logging request text. Revisit after a small, consented pilot before raising limits.

## Incident response

- **Unexpected spend or abuse:** set `DRAFT_ASSIST_DISABLED=true` at the confirmed deployment control plane, use the provider's own disable/budget control, verify both controls are effective, preserve aggregate run IDs/statuses only, and open an incident record. Do not capture raw prompts or tokens to debug.
- **Quota RPC/table is unavailable:** fail closed; show the generic “drafting help is unavailable” message. Do not bypass the quota with an in-memory fallback.
- **Repeated limit denials:** retain only aggregate counts/reset windows needed for operations; do not add prompt or full IP logging to the quota table.
- **Rollback:** first disable draft assist, then use a reviewed app rollback and migration rollback plan in a disposable environment. Do not drop the table/function underneath active traffic or edit hosted migration history by hand.

## What this control does not cover

- It does not rate-limit account creation, sign-in, or every expensive/public endpoint.
- It does not implement per-IP/network controls, provider-side hard-spend caps or alerts.
- It does not make the AI assistant safe for public/unauthenticated use, and does not enable “Ask this place”.
- It does not prove 24/7 execution, production reliability, or any growth/capacity target.
