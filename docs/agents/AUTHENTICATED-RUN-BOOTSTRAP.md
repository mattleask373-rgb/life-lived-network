# Authenticated run bootstrap

**Status: IMPLEMENTED (pure policy) / NOT LIVE / HOSTED PROOF PENDING**

## Contract

```
authenticated request (Bearer JWT)
        ↓
requireSupabaseAuth → claims.sub = actorId
        ↓
server-generated run_id (UUID)
        ↓
authoritative workspace/project scope (or HOLD)
        ↓
decideRunBootstrap → CREATE_RUN | HOLD
        ↓
durable agent_execution_runs insert (service_role only)
```

## Forbidden

- `actor_id` from request body as authority
- Client-supplied `run_id`
- Inventing `project_id` / workspace when membership is unproven
- `productionLive: true` without human activation

## Project scope (Issue #112 alignment)

Repository search did **not** establish an authoritative project/workspace
membership source for control-plane scope.

Until proven:

```
scope = unprovenProjectScope()
→ HOLD AUTHORITY_NOT_PROVEN
```

Do not use Supabase infrastructure project ref as user project authority.

## Safety

No merge, deploy, credentials, or LIVE executor. Pure unit tests only on this slice.
